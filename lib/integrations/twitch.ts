import { TimerEntity } from "@/lib/canvas/entity.timer";
import { CURRENT_URL } from "@/lib/constants";
import { Debug } from "@/lib/debug";
import { EventBus, MediatorEvent, MediatorEventType } from "@/lib/event-bus";
import { TwitchChatResponse } from "@/lib/integrations/twitch.types";
import { Vote } from "@/lib/integrations/vote";
import { COMMAND, EVENT } from "@/lib/types";
import * as tmi from "tmi.js";
import { z } from "zod";

export const chatMessageSchema = z.object({
  broadcaster_id: z.string(),
  sender_id: z.string(),
  message: z.string(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export type TwitchOptions = {
  channel: string;
  broadcaster_id: string;
};

export class Twitch {
  public static readonly defaultOptions: Required<TwitchOptions> = {
    channel: "",
    broadcaster_id: "",
  };
  static #instance: Twitch | null = null;
  protected debug: Debug;
  #eventBus: EventBus;
  #channel: string;
  #broadcasterId: string;
  #voteTimer: NodeJS.Timeout | null = null;
  #vote: Vote;
  #options: COMMAND[];
  #client: tmi.Client | null = null;

  public static create(
    options?: TwitchOptions,
    events?: EventBus,
    vote?: Vote,
    debug?: Debug,
  ) {
    if (!Twitch.#instance) {
      Twitch.#instance = new Twitch(options, events, vote, debug);
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
      channels: [channel],
    });
  }

  private constructor(
    {
      channel = Twitch.defaultOptions.channel,
      broadcaster_id = Twitch.defaultOptions.broadcaster_id,
    }: TwitchOptions = Twitch.defaultOptions,
    events: EventBus = EventBus.create(),
    vote = new Vote(),
    debug = new Debug(Twitch.name, "Purple"),
  ) {
    this.debug = debug;
    this.debug.log(`Creating: ${Twitch.name} instance`);
    this.#eventBus = events;
    this.#channel = channel;
    this.#broadcasterId = broadcaster_id;
    this.#vote = vote;
    this.#options = [COMMAND.START, COMMAND.RESTART];
  }

  get channel() {
    return this.#channel;
  }

  get broadcasterId() {
    return this.#broadcasterId;
  }

  public async setup(channel: string) {
    this.debug.log(`Setup: ${channel} subscriptions`);

    if (!channel) {
      this.debug.error("Channel is not set");
      return;
    }

    this.#channel = channel;
    this.#client = Twitch.createClient(this.#channel, this.debug.enabled);
    this.#client.addListener("connected", this.handleConnected);
    this.#client.addListener("disconnected", this.handleDisconnected);

    this.#eventBus.subscribe("mediator", this.handleMediator, Twitch.name);
    try {
      this.debug.log("Connecting to Twitch");
      await this.#client.connect();
    } catch (error) {
      this.debug.error("Error connecting to Twitch", error);
      return;
    }
  }

  public async teardown() {
    this.debug.log(`Teardown: ${Twitch.name} subscriptions`);
    this.#eventBus.unsubscribe("mediator", this.handleMediator);
    if (this.#client) {
      this.debug.log("Disconnecting from Twitch");
      this.#client.removeListener("connected", this.handleConnected);
      this.#client.removeListener("disconnected", this.handleDisconnected);
      await this.#client.disconnect();
    }
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

  static parseMessage = (message: string): COMMAND | null => {
    const sanitizedMessage = message.replace(/[^\x20-\x7E]/g, "");
    const command = sanitizedMessage.trim().split(/\s+/)[0].toLowerCase();

    switch (command) {
      case "!hit":
        return COMMAND.HIT;
      case "!stand":
        return COMMAND.STAND;
      case "!start":
        return COMMAND.START;
      case "!restart":
        return COMMAND.RESTART;
      case "!stop":
        return COMMAND.STOP;
      default:
        return null;
    }
  };

  private handleWaitForStart = (
    event: MediatorEventType<EVENT.WAIT_FOR_START>,
  ) => {
    this.#options = event.data.options;
    const waitForStart = (
      channel: string,
      user: tmi.ChatUserstate,
      message: string,
      self: boolean,
    ) => {
      if (self || !user.username) return;
      const command = Twitch.parseMessage(message);
      if (!command || !this.#options.includes(command)) return;
      this.handlePlayerAction(command);
      this.#client?.removeListener("message", waitForStart);
    };

    this.#client?.addListener("message", waitForStart);
  };

  private handleMediator = (event: MediatorEvent) => {
    switch (event.type) {
      case EVENT.WAIT_FOR_START:
        this.handleWaitForStart(event);
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
    const command = Twitch.parseMessage(message);
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

  private async sendChatMessage(chatMessage: Omit<ChatMessage, "sender_id">) {
    try {
      const res = await fetch(
        `${CURRENT_URL}${process.env.NEXT_PUBLIC_PUBLISH_CHAT_URL}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            broadcaster_id: chatMessage.broadcaster_id,
            message: chatMessage.message,
          }),
        },
      );

      console.log("res", JSON.stringify(res));

      if (!res.ok) {
        this.debug.error(
          `Error sending chat: ${res.statusText} (${res.status})`,
        );
        return;
      }
      const data = (await res.json()) as TwitchChatResponse;

      if (!data.data[0].is_sent) {
        this.debug.error(
          `Error [${data.data[0].drop_reason.code}] sending chat: ${data.data[0].drop_reason.message}`,
        );
        return;
      }
      return data;
    } catch (error) {
      this.debug.error(`Error sending chat: ${error}`);
    }
  }

  private handleConnected = async () => {
    this.debug.log("Connected to Twitch");
    this.#eventBus.emit("chat", {
      type: EVENT.CONNECTED,
    });

    const greetings = [
      "Welcome to the game! Type !start to begin!",
      "Hello, everyone! Type !start to kick things off!",
      "Hey there! Type !start to get started!",
      "Welcome! Type !start to start the game!",
      "Greetings! Type !start to begin the fun!",
      "Hi, everyone! Type !start to start the game!",
      "Hello! Type !start to kick off the game!",
    ];

    const randomGreeting =
      greetings[Math.floor(Math.random() * greetings.length)];
    try {
      const result = await this.sendChatMessage({
        broadcaster_id: this.#broadcasterId,
        message: randomGreeting,
      });

      if (!result) {
        this.debug.error("Failed to send greeting message");
        return;
      }

      this.debug.log(`Sent: ${randomGreeting}`);
    } catch (error) {
      this.debug.error(`Error sending greeting2: ${JSON.stringify(error)}`);
    }
  };

  private handleDisconnected = () => {
    this.debug.log("Disconnected from Twitch");
    this.#eventBus.emit("chat", {
      type: EVENT.DISCONNECTED,
    });
    // this.teardown();
  };
}
