/* eslint-disable @typescript-eslint/no-explicit-any */
import { Debug } from "@/lib/debug";
import { Dealer } from "@/lib/game/dealer";
import { Player } from "@/lib/game/player";
import Pusher from "pusher-js";
import { COMMAND, EVENT, STATE } from "./types";
import { RendererOptions } from "@/lib/canvas/renderer";

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

export type AnimationEvent = ChatEvent | GameEvent | MediatorAnimationEvent;

export type MediatorEvent =
  | EventData<EVENT.WAIT_FOR_START>
  | EventData<EVENT.VOTE_START, { options: COMMAND[] }>
  | EventData<EVENT.DEALER_DECIDE>
  | EventData<EVENT.JUDGE>;

export type EventType<T extends EVENT> = Extract<AnimationEvent, { type: T }>;

export type MediatorEventType<T extends EVENT> = Extract<
  MediatorEvent,
  { type: T }
>;

export type MediatorAnimationEvent = MediatorEventType<EVENT.VOTE_START>;

export type EventMap = {
  chat: ChatEvent;
  mediator: MediatorEvent;
  gamestate: GameEvent;
  animationComplete: AnimationEvent;
};

export interface EventBusOptions {
  channel?: string;
}

export class EventBus<Events extends Record<string, any> = EventMap> {
  // Use a Partial mapping to store callbacks for defined events.
  #events: Partial<{
    [K in keyof Events]: Array<{
      source: string;
      callback: EventCallback<Events[K]>;
    }>;
  }>;

  #pusher: Pusher | null = null;

  static #instance: EventBus | null = null;
  protected debug: Debug;
  public readonly channel: string;

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
    this.channel = channel;
    this.#events = {};
    this.debug = debug;
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

  public emit<K extends keyof Events>(eventName: K, args: Events[K]): void {
    this.debug.log(`Emitting: ${String(eventName)}`);
    if (this.#events[eventName]) {
      this.emitNet(NETWORKED_UPDATE_EVENT, { eventName, args });
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

  private teardown() {
    this.#events = {};
  }

  async emitNet<K extends keyof Events>(
    event: typeof NETWORKED_UPDATE_EVENT,
    data: { eventName: K; args: Events[K] },
  ) {
    try {
      const response = await fetch("/api/publish/event", {
        method: "POST",
        body: JSON.stringify({
          channel: this.channel,
          event,
          data,
        }),
      });
      if (!response.ok) {
        return { success: false };
      }

      return response.json() as Promise<{ success: boolean }>;
    } catch (error) {
      this.debug.error(`Failed to emit event: ${error}`);
      return { success: false };
    }
  }
}
