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

export class Twitch extends tmi.Client {
  static #instance: Twitch | null = null;
  protected debug: Debug;
  #eventBus: EventBus;
  #channel: string;
  #voteTimer: NodeJS.Timeout | null = null;
  #duration: number;
  #vote: Vote;
  #options: COMMAND[];
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

  private constructor(
    options: TwitchOptions = { channel: "", voteDuration: 10, debug: false },
    vote = new Vote(),
    events = eventBus,
    debug = new Debug(Twitch.name, "Purple")
  ) {
    super({
      options: {
        debug: options.debug,
      },
      identity: {
        username: process.env.TWITCH_CLIENT_ID,
        password: process.env.TWITCH_CLIENT_SECRET,
      },
      channels: [options.channel],
    });

    this.debug = debug;
    this.#eventBus = events;
    this.#channel = options.channel;
    this.#duration = options.voteDuration * 1000;
    this.#vote = vote;
    this.#options = [COMMAND.START, COMMAND.RESTART];
    this.setup();
  }

  private async setup() {
    this.addListener("connected", this.handleConnected);
    this.addListener("disconnected", this.handleDisconnected);

    this.#eventBus.subscribe(
      "waitForStart",
      this.handleWaitForStart,
      Twitch.name
    );
    this.#eventBus.subscribe("voteStart", this.handleVoteStart, Twitch.name);

    if (!this.#channel) {
      this.debug.error("Channel is not set");
      return;
    }
    await this.connect();
  }

  private async destroy() {
    this.removeListener("connected", this.handleConnected);
    this.removeListener("disconnected", this.handleDisconnected);
    await this.disconnect();

    this.#eventBus.unsubscribe("waitForStart", this.handleWaitForStart);
    this.#eventBus.unsubscribe("voteStart", this.handleVoteStart);
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
    const waitForStart = (
      channel: string,
      user: tmi.ChatUserstate,
      message: string,
      self: boolean
    ) => {
      if (self || !user.username) return;
      this.debug.log(channel, user, message);
      const command = this.parseMessage(message);
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
    self: boolean
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

    this.addListener("message", this.handleVote);
    this.startVoteTimer((command) => {
      this.handlePlayerAction(command);
    });
  };

  public handlePlayerAction = (command: COMMAND) => {
    if (this.#voteTimer) {
      clearTimeout(this.#voteTimer);
      this.removeListener("message", this.handleVote);
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
