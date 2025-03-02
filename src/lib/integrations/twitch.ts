import { Debug } from "@/lib/debug";
import { EventBus, eventBus } from "@/lib/event-bus";
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

  public static create(options: TwitchOptions) {
    if (!Twitch.#instance) {
      Twitch.#instance = new Twitch(options);
    }
    return Twitch.#instance;
  }

  private constructor(
    options: TwitchOptions = { channel: "", voteDuration: 10, debug: false },
    vote = new Vote(),
    events = eventBus,
    debug = new Debug("Twitch", "Purple")
  ) {
    super({
      options: {
        debug: options.debug,
      },
      identity: {
        username: import.meta.env.VITE_TWITCH_USERNAME,
        password: import.meta.env.VITE_TWITCH_TOKEN,
      },
      channels: [options.channel],
    });

    this.debug = debug;
    this.#eventBus = events;
    this.#channel = options.channel;
    this.#duration = options.voteDuration * 1000;
    this.#vote = vote;
    this.setup();
  }

  private async setup() {
    if (!this.#channel) {
      this.debug.error("Channel is not set");
      return;
    }

    this.addListener("connected", this.handleConnected);
    this.addListener("disconnected", this.handleDisconnected);

    this.#eventBus.subscribe("waitForStart", this.handleWaitForStart);
    this.#eventBus.subscribe("vote", this.handleVoteStart);

    await this.connect();
  }

  private async destroy() {
    this.removeListener("connected", this.handleConnected);
    this.removeListener("disconnected", this.handleDisconnected);
    await this.disconnect();

    this.#eventBus.unsubscribe("waitForStart", this.handleWaitForStart);
    this.#eventBus.unsubscribe("vote", this.handleVoteStart);
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
    const command = message.toLowerCase().replace("!", "");
    if (
      command === COMMAND.HIT ||
      command === COMMAND.STAND ||
      command === COMMAND.START ||
      command === COMMAND.RESTART ||
      command === COMMAND.STOP
    ) {
      return command;
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
      this.#eventBus.emit(EVENT.START);
      this.removeListener("message", waitForStart);
    };

    this.addListener("message", waitForStart);
  };

  private handleVoteStart = () => {
    this.#vote.reset();
    const handleVote = (
      channel: string,
      user: tmi.ChatUserstate,
      message: string,
      self: boolean
    ) => {
      if (self || !user.username) return;
      this.debug.log(channel, user, message);
      const command = this.parseMessage(message);
      if (!command) return;
      return this.#vote.register(user.username, command, (command, count) => {
        this.#eventBus.emit("chat", {
          type: EVENT.VOTE_UPDATE,
          data: { command, count },
        });
      });
    };

    this.addListener("message", handleVote);
    this.startVoteTimer((command) => {
      this.#eventBus.emit("playerAction", command);
      this.removeListener("message", handleVote);
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
    this.destroy();
  };
}

