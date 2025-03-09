import { TimerEntity } from "@/lib/canvas/entity.timer";
import { RendererOptions } from "@/lib/canvas/renderer";
import { Debug } from "@/lib/debug";
import { EventBus, MediatorEvent, MediatorEventType } from "@/lib/event-bus";
import { Vote } from "@/lib/integrations/vote";
import { COMMAND, EVENT } from "@/lib/types";
import * as tmi from "tmi.js";

export type TwitchOptions = Pick<RendererOptions, "channel">;

export class Twitch {
  public static readonly defaultOptions: Required<TwitchOptions> = {
    channel: "",
  };
  static #instance: Twitch | null = null;
  protected debug: Debug;
  #eventBus: EventBus;
  #channel: string;
  #voteTimer: NodeJS.Timeout | null = null;
  #vote: Vote;
  #options: COMMAND[];
  #client: tmi.Client | null = null;

  public static create(options: TwitchOptions) {
    if (!Twitch.#instance) {
      Twitch.#instance = new Twitch(options);
    }
    return Twitch.#instance;
  }

  public static destroy() {
    if (Twitch.#instance) {
      Twitch.#instance.teardown();
    }
    Twitch.#instance = null;
  }

  static createClient(channel: string, debug: boolean) {
    return new tmi.Client({
      options: {
        debug,
      },
      channels: [channel], // updated to accept a single channel instead of an array
    });
  }

  private constructor(
    {
      channel = Twitch.defaultOptions.channel,
    }: TwitchOptions = Twitch.defaultOptions,
    events: EventBus = EventBus.create(),
    vote = new Vote(),
    debug = new Debug(Twitch.name, "Purple"),
  ) {
    this.debug = debug;
    this.debug.log(`Creating: ${Twitch.name} instance`);
    this.#eventBus = events;
    this.#channel = channel;
    this.#vote = vote;
    this.#options = [COMMAND.START, COMMAND.RESTART];
  }

  get channel() {
    return this.#channel;
  }

  private async connect() {
    if (!this.#client) return;
    this.debug.log("Connecting to Twitch");
    await this.#client.connect();
  }

  private async disconnect() {
    if (!this.#client) return;
    this.debug.log("Disconnecting from Twitch");
    await this.#client.disconnect();
  }

  private addListener(
    event: keyof tmi.Events,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (...args: any[]) => void,
  ) {
    if (!this.#client) return;
    this.#client.addListener(event, listener);
  }

  private removeListener(
    event: keyof tmi.Events,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (...args: any[]) => void,
  ) {
    if (!this.#client) return;
    this.#client.removeListener(event, listener);
  }

  public async setup(channel: string) {
    this.debug.log(`Setup: ${channel} subscriptions`);

    if (!channel) {
      this.debug.error("Channel is not set");
      return;
    }

    this.#channel = channel;
    this.#client = Twitch.createClient(this.#channel, this.debug.enabled);

    this.addListener("connected", this.handleConnected);
    this.addListener("disconnected", this.handleDisconnected);

    this.#eventBus.subscribe("mediator", this.handleMediator, Twitch.name);
    try {
      await this.connect();
    } catch (error) {
      this.debug.error("Error connecting to Twitch", error);
      return;
    }
  }

  public async teardown() {
    this.debug.log(`Teardown: ${Twitch.name} subscriptions`);
    this.removeListener("connected", this.handleConnected);
    this.removeListener("disconnected", this.handleDisconnected);

    this.#eventBus.unsubscribe("mediator", this.handleMediator);
    await this.disconnect();
    this.#channel = "";
    this.#client = null;
  }

  private startVoteTimer(event: MediatorEventType<EVENT.VOTE_START>) {
    if (this.#voteTimer) {
      clearTimeout(this.#voteTimer);
    }

    this.#voteTimer = setTimeout(() => {
      const tieVoteCommand = COMMAND.STAND;
      const popularCommand = this.#vote.tally(tieVoteCommand);
      this.handlePlayerAction(popularCommand);
    }, event.data.duration * 1000);
  }

  private parseMessage = (message: string): COMMAND | null => {
    const command = message.toLowerCase();
    if (this.#options.includes(command as COMMAND)) {
      return command as COMMAND;
    }
    return null;
  };

  private handleWaitForStart = () => {
    const waitForStart = (
      channel: string,
      user: tmi.ChatUserstate,
      message: string,
      self: boolean,
    ) => {
      if (self || !user.username) return;
      const command = this.parseMessage(message);
      if (command !== COMMAND.START) return;
      this.handlePlayerAction(command);
      this.removeListener("message", waitForStart);
    };

    this.addListener("message", waitForStart);
  };

  private handleMediator = (event: MediatorEvent) => {
    switch (event.type) {
      case EVENT.WAIT_FOR_START:
        this.handleWaitForStart();
        break;
      case EVENT.VOTE_START:
        this.handleVoteStart(event);
        break;
    }
  };

  private handleVote = (
    channel: string,
    user: tmi.ChatUserstate,
    message: string,
    self: boolean,
  ) => {
    if (self || !user.username) return;
    this.debug.log(channel, user, message);
    const command = this.parseMessage(message);
    if (!command) return;
    return this.handleVoteUpdate(user.username, command);
  };

  public handleVoteUpdate = (username: string, command: COMMAND) => {
    return this.#vote.register(username, command, (command, count) => {
      this.#eventBus.emit("chat", {
        type: EVENT.VOTE_UPDATE,
        data: { command, count },
      });
    });
  };

  private handleVoteStart = (event: MediatorEventType<EVENT.VOTE_START>) => {
    this.#vote.reset();
    this.#options = event.data.options;
    const latency = Date.now() - event.data.startTime;
    const delay = Math.max(0, TimerEntity.zoomInDuration() - latency);

    this.#voteTimer = setTimeout(() => {
      this.#client?.addListener("message", this.handleVote);
      this.startVoteTimer(event);
    }, delay);
  };

  public handlePlayerAction = (command: COMMAND) => {
    if (this.#voteTimer) {
      clearTimeout(this.#voteTimer);
      this.#client?.removeListener("message", this.handleVote);
    }

    this.#eventBus.emit("chat", {
      type: EVENT.VOTE_END,
      data: { command },
    });
  };

  private handleConnected = () => {
    this.debug.log("Connected to Twitch");
    this.#eventBus.emit("chat", {
      type: EVENT.CONNECTED,
    });
  };

  private handleDisconnected = () => {
    this.debug.log("Disconnected from Twitch");
    this.#eventBus.emit("chat", {
      type: EVENT.DISCONNECTED,
    });
    // this.teardown();
  };
}
