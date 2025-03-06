import { Debug } from "@/lib/debug";
import { EventBus, eventBus, MediatorEvents } from "@/lib/event-bus";
import { Vote } from "@/lib/integrations/vote";
import { COMMAND, EVENT } from "@/lib/types";
import * as tmi from "tmi.js";

export type TwitchOptions = {
  channel: string;
  voteDuration: number;
  debug?: boolean;
};

export class Twitch {
  static #instance: Twitch | null = null;
  protected debug: Debug;
  #eventBus: EventBus;
  #channel: string;
  #voteTimer: NodeJS.Timeout | null = null;
  #duration: number;
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
      Twitch.#instance.destroy();
    }
    Twitch.#instance = null;
  }

  static createClient(channels: string[], debug: boolean) {
    return new tmi.Client({
      options: {
        debug,
      },
      // identity: {
      //   username: process.env.NEXT_PUBLIC_TWITCH_USERNAME,
      //   password: process.env.NEXT_PUBLIC_TWITCH_TOKEN,
      // },
      channels,
    });
  }

  private constructor(
    options: TwitchOptions = { channel: "", voteDuration: 10, debug: false },
    vote = new Vote(),
    events = eventBus,
    debug = new Debug(Twitch.name, "Purple"),
  ) {
    this.debug = debug;
    this.#eventBus = events;
    this.#channel = options.channel;
    this.#duration = options.voteDuration * 1000;
    this.#vote = vote;
    this.#options = [COMMAND.START, COMMAND.RESTART];
    this.setup(this.#channel);
  }

  get channel() {
    return this.#channel;
  }

  private async connect() {
    if (!this.#client) return;
    await this.#client.connect();
  }

  private async disconnect() {
    if (!this.#client) return;
    await this.#client.disconnect();
  }

  private addListener(
    event: keyof tmi.Events,
    listener: (...args: any[]) => void,
  ) {
    if (!this.#client) return;
    this.#client.addListener(event, listener);
  }

  private removeListener(
    event: keyof tmi.Events,
    listener: (...args: any[]) => void,
  ) {
    if (!this.#client) return;
    this.#client.removeListener(event, listener);
  }

  private setChannel(channel: string) {
    this.#channel = channel;
    this.#client = Twitch.createClient([this.#channel], this.debug.enabled);
  }

  public async setup(channel: string) {
    if (!channel) {
      this.debug.error("Channel is not set");
      return;
    }

    this.setChannel(channel);

    this.addListener("connected", this.handleConnected);
    this.addListener("disconnected", this.handleDisconnected);

    this.#eventBus.subscribe(
      "waitForStart",
      this.handleWaitForStart,
      Twitch.name,
    );
    this.#eventBus.subscribe("voteStart", this.handleVoteStart, Twitch.name);
    await this.connect();
  }

  public async destroy() {
    this.removeListener("connected", this.handleConnected);
    this.removeListener("disconnected", this.handleDisconnected);

    this.#eventBus.unsubscribe("waitForStart", this.handleWaitForStart);
    this.#eventBus.unsubscribe("voteStart", this.handleVoteStart);
    await this.disconnect();
  }

  private startVoteTimer(onEnd: (command: COMMAND) => void) {
    if (this.#voteTimer) {
      clearTimeout(this.#voteTimer);
    }
    this.#voteTimer = setTimeout(() => {
      const tieVoteCommand = COMMAND.STAND;
      const popularCommand = this.#vote.tally(tieVoteCommand);
      onEnd(popularCommand);
    }, this.#duration);
  }

  private parseMessage = (message: string): COMMAND | null => {
    const command = message.toLowerCase();
    if (this.#options.includes(command as COMMAND)) {
      return command as COMMAND;
    }
    return null;
  };

  private handleWaitForStart = () => {
    console.log("handleWaitForStart");
    const waitForStart = (
      channel: string,
      user: tmi.ChatUserstate,
      message: string,
      self: boolean,
    ) => {
      if (self || !user.username) return;
      this.debug.log("here", channel, user, message);
      const command = this.parseMessage(message);
      console.log("command", command);

      if (command !== COMMAND.START) return;
      this.handlePlayerAction(command);
      this.removeListener("message", waitForStart);
    };

    this.addListener("message", waitForStart);
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

  private handleVoteStart = (event: MediatorEvents["voteStart"]) => {
    this.#vote.reset();
    this.#options = event.options;

    this.#client?.addListener("message", this.handleVote);
    this.startVoteTimer((command) => {
      this.handlePlayerAction(command);
    });
  };

  public handlePlayerAction = (command: COMMAND) => {
    if (this.#voteTimer) {
      clearTimeout(this.#voteTimer);
      this.#client?.removeListener("message", this.handleVote);
    }
    this.#eventBus.emit("playerAction", command);
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
    this.destroy();
  };
}
