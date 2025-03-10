/* eslint-disable @typescript-eslint/no-explicit-any */
import { CURRENT_URL } from "@/lib/constants";
import { Debug } from "@/lib/debug";
import { Dealer, DealerJSONSchema } from "@/lib/game/dealer";
import { Player, playerJSONSchema } from "@/lib/game/player";
import { z } from "zod";
import { COMMAND, EVENT, STATE } from "./types";

export const NETWORKED_UPDATE_EVENT = "networkedUpdateEvent";

export type EventCallback<T> = T extends void ? () => void : (data: T) => void;

export type EventArgs<T> = T extends void ? [] : [T];

export type EventData<
  T extends EVENT,
  D extends Record<string, any> | undefined = undefined,
> = D extends undefined
  ? { type: T }
  : {
      type: T;
      data: D;
    };

export type ChatEvent =
  | EventData<EVENT.CONNECTED>
  | EventData<EVENT.DISCONNECTED>
  | EventData<EVENT.VOTE_UPDATE, { command: COMMAND; count: number }>
  | EventData<EVENT.VOTE_END, { command: COMMAND }>;

export type GameEvent =
  | EventData<EVENT.DEALING, { dealer: Dealer; player: Player }>
  | EventData<EVENT.PLAYER_ACTION, { player: Player; state: STATE }>
  | EventData<EVENT.REVEAL_HOLE_CARD, { dealer: Dealer }>
  | EventData<EVENT.DEALER_ACTION, { dealer: Dealer; state: STATE }>
  | EventData<EVENT.JUDGE, { state: STATE }>
  | EventData<EVENT.STOP, { state: STATE }>;

export type MediatorEvent =
  | EventData<EVENT.WAIT_FOR_START, { options: [COMMAND, ...COMMAND[]] }>
  | EventData<
      EVENT.VOTE_START,
      { options: [COMMAND, ...COMMAND[]]; startTime: number; duration: number }
    >
  | EventData<EVENT.DEALER_DECIDE>
  | EventData<EVENT.JUDGE>;

export type MediatorEventType<T extends EVENT> = Extract<
  MediatorEvent,
  { type: T }
>;

export type MediatorAnimationEvent = MediatorEventType<EVENT.VOTE_START>;

export type AnimationEvent = ChatEvent | GameEvent | MediatorAnimationEvent;

export type EventType<T extends EVENT> = Extract<AnimationEvent, { type: T }>;

export type EventMap = {
  chat: ChatEvent;
  mediator: MediatorEvent;
  gamestate: GameEvent;
  animationComplete: AnimationEvent;
};

export interface EventBusOptions {
  channel?: string;
}

const chatEventSchema = z.union([
  z.object({
    type: z.literal(EVENT.CONNECTED),
  }),
  z.object({
    type: z.literal(EVENT.DISCONNECTED),
  }),
  z.object({
    type: z.literal(EVENT.VOTE_UPDATE),
    data: z.object({
      command: z.nativeEnum(COMMAND),
      count: z.number(),
    }),
  }),
  z.object({
    type: z.literal(EVENT.VOTE_END),
    data: z.object({
      command: z.nativeEnum(COMMAND),
    }),
  }),
]);

export type ChatEventSchema = z.infer<typeof chatEventSchema>;

const voteStartSchema = z.object({
  type: z.literal(EVENT.VOTE_START),
  data: z.object({
    options: z.array(z.nativeEnum(COMMAND)).nonempty(),
    startTime: z.number(),
    duration: z.number(),
  }),
});

export type VoteStartSchema = z.infer<typeof voteStartSchema>;

const mediatorEventSchema = z.union([
  z.object({
    type: z.literal(EVENT.WAIT_FOR_START),
  }),
  voteStartSchema,
  z.object({
    type: z.literal(EVENT.DEALER_DECIDE),
  }),
  z.object({
    type: z.literal(EVENT.JUDGE),
  }),
]);

export type MediatorEventSchema = z.infer<typeof mediatorEventSchema>;

const gameEventSchema = z.union([
  z.object({
    type: z.literal(EVENT.DEALING),
    data: z.object({
      dealer: DealerJSONSchema,
      player: playerJSONSchema,
    }),
  }),
  z.object({
    type: z.literal(EVENT.PLAYER_ACTION),
    data: z.object({
      player: z.any(),
      state: z.nativeEnum(STATE),
    }),
  }),
  z.object({
    type: z.literal(EVENT.REVEAL_HOLE_CARD),
    data: z.object({
      dealer: z.any(),
    }),
  }),
  z.object({
    type: z.literal(EVENT.DEALER_ACTION),
    data: z.object({
      dealer: DealerJSONSchema,
      state: z.nativeEnum(STATE),
    }),
  }),
  z.object({
    type: z.literal(EVENT.JUDGE),
    data: z.object({
      state: z.nativeEnum(STATE),
    }),
  }),
  z.object({
    type: z.literal(EVENT.STOP),
    data: z.object({
      state: z.nativeEnum(STATE),
    }),
  }),
]);

export type GameEventSchema = z.infer<typeof gameEventSchema>;

const animationEventSchema = z.union([
  ...chatEventSchema.options,
  ...gameEventSchema.options,
  voteStartSchema,
]);

export const eventBusAllData = z.object({
  type: z.string(),
  data: z
    .object({
      dealer: DealerJSONSchema.optional(),
      player: playerJSONSchema.optional(),
      command: z.nativeEnum(COMMAND).optional(),
      count: z.number().optional(),
      state: z.nativeEnum(STATE).optional(),
      options: z.array(z.nativeEnum(COMMAND)).optional(),
    })
    .optional(),
});

export type EventBusAllData = z.infer<typeof eventBusAllData>;

export const eventBusDataSchema = z.discriminatedUnion("eventName", [
  z.object({
    channel: z.string().nonempty(),
    eventName: z.literal("chat"),
    args: chatEventSchema,
  }),
  z.object({
    channel: z.string().nonempty(),
    eventName: z.literal("mediator"),
    args: mediatorEventSchema,
  }),
  z.object({
    channel: z.string().nonempty(),
    eventName: z.literal("gamestate"),
    args: gameEventSchema,
  }),
  z.object({
    channel: z.string().nonempty(),
    eventName: z.literal("animationComplete"),
    args: animationEventSchema,
  }),
]);

export type EventBusData = z.infer<typeof eventBusDataSchema>;

export class EventBus<Events extends Record<string, any> = EventMap> {
  // Use a Partial mapping to store callbacks for defined events.
  #events: Partial<{
    [K in keyof Events]: Array<{
      source: string;
      callback: EventCallback<Events[K]>;
    }>;
  }>;

  static #instance: EventBus | null = null;
  protected debug: Debug;
  #channel: string;

  public static create<T extends Record<string, any> = EventMap>(
    options?: EventBusOptions,
  ): EventBus<T> {
    if (!EventBus.#instance) {
      EventBus.#instance = new EventBus<T>(options);
    }

    return EventBus.#instance as EventBus<T>;
  }

  public static destroy() {
    if (EventBus.#instance) {
      EventBus.#instance.teardown();
    }
    EventBus.#instance = null;
  }

  private constructor(
    { channel = "" }: EventBusOptions = { channel: "" },
    debug = new Debug("EventBus", "LightBlue"),
  ) {
    this.debug = debug;
    this.debug.log(`Creating: ${EventBus.name} instance`);
    this.#channel = channel;
    this.#events = {};
  }

  get channel(): string {
    return this.#channel;
  }

  setChannel(channel: string) {
    this.debug.log(`Setting channel to: ${channel}`);
    this.#channel = channel;
  }

  public subscribe<K extends keyof Events>(
    eventName: K,
    callback: EventCallback<Events[K]>,
    source: string = "Unknown",
  ): () => void {
    this.debug.log(`${source} subscribing to: ${String(eventName)}`);
    if (!this.#events[eventName]) {
      this.#events[eventName] = [];
    }
    this.#events[eventName]?.push({ source, callback });
    return () => this.unsubscribe(eventName, callback);
  }

  public unsubscribe<K extends keyof Events>(
    eventName: K,
    callback: EventCallback<Events[K]>,
    source?: string,
  ) {
    if (this.#events[eventName]) {
      // Properly filter out the callback and update the event's callback array.
      this.#events[eventName] = this.#events[eventName]?.filter((cb) => {
        const search = cb.callback !== callback;
        if (!search) {
          this.debug.log(
            `${source ?? cb.source} unsubscribing from: ${String(eventName)}`,
          );
        }
        return search;
      });
    }
  }

  public once<K extends keyof Events>(
    eventName: K,
    callback: EventCallback<Events[K]>,
    source: string = "unknown",
  ): () => void {
    this.debug.log(`${source} subscribing once to: ${String(eventName)}`);
    const wrappedCallback = ((...args: Events[K]) => {
      if (args.length === 0) {
        (callback as () => void)();
      } else if (args.length === 1) {
        (callback as (arg: Events[K]) => void)(args[0]);
      } else {
        (callback as (...args: Events[K]) => void)(...args);
      }
      this.unsubscribe(eventName, wrappedCallback);
    }) as EventCallback<Events[K]>;

    return this.subscribe(eventName, wrappedCallback, source);
  }

  public emit<K extends keyof Events>(
    eventName: K,
    args: Events[K],
    networked = true,
  ): void {
    this.debug.log(`Emitting: ${String(eventName)}`);
    if (this.#events[eventName]) {
      if (networked) {
        this.emitNet(this.#channel, eventName, args);
      }
      this.#events[eventName]?.forEach(({ callback }) => {
        callback(args);
      });
    }
  }

  public listSubscriptions(): void {
    this.debug.log("Current event subscriptions:");
    Object.entries(this.#events).forEach(([eventName, callbacks]) => {
      this.debug.log(
        `Event: ${String(eventName)}, Subscribers: ${callbacks.length}`,
      );
      callbacks.forEach((cb: { source: string }, index: number) => {
        this.debug.log(`  ${index + 1}. Source: ${cb.source}`);
      });
    });
  }

  public teardown() {
    this.debug.log(`Destroying: ${EventBus.name} instance`);
    this.#events = {};
  }

  async emitNet<K extends keyof Events>(
    channel: string,
    eventName: K,
    args: Events[K],
  ) {
    try {
      const response = await fetch(`${CURRENT_URL}/api/publish/event`, {
        method: "POST",
        body: JSON.stringify({
          channel,
          eventName,
          args,
        }),
      });
      if (!response.ok) {
        this.debug.error(
          `Channel ${channel || "unknown"} Failed to emit event ${String(eventName)}: ${response.statusText}`,
        );
        return { success: false };
      }

      return response.json() as Promise<{ success: boolean }>;
    } catch (error) {
      this.debug.error(`Failed to emit event: ${error}`);
      return { success: false };
    }
  }
}
