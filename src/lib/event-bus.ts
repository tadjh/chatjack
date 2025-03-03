/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dealer } from "@/lib/game/dealer";
import { Player } from "@/lib/game/player";
import { STATE, COMMAND, EVENT } from "./types";
import { Debug } from "@/lib/debug";

export type EventCallback<T> = T extends void
  ? () => void
  : T extends any[]
    ? (...args: T) => void
    : (data: T) => void;

export type EventArgs<T> = T extends void ? [] : T extends any[] ? T : [T];

export type ChatEvent =
  | {
      type: EVENT.CONNECTED;
    }
  | {
      type: EVENT.DISCONNECTED;
    }
  | {
      type: EVENT.VOTE_UPDATE;
      data: { command: COMMAND; count: number };
    }
  | {
      type: EVENT.VOTE_END;
      data: { command: COMMAND };
    };

export type GameEvent =
  | {
      type: EVENT.DEALING;
      data: { dealer: Dealer; player: Player };
    }
  | {
      type: EVENT.PLAYER_ACTION;
      data: { player: Player; state: STATE };
    }
  | {
      type: EVENT.REVEAL_HOLE_CARD;
      data: { dealer: Dealer };
    }
  | {
      type: EVENT.DEALER_ACTION;
      data: { dealer: Dealer; state: STATE };
    }
  | {
      type: EVENT.JUDGE;
      data: { state: STATE };
    }
  | {
      type: EVENT.STOP;
      data: { state: STATE };
    };

export type AnimationEvent = ChatEvent | GameEvent;

export type EventType<T extends EVENT> = Extract<AnimationEvent, { type: T }>;

interface MediatorEvents {
  waitForStart: void;
  start: void;
  vote: void;
  playerAction: COMMAND;
  dealerAction: void;
  judge: void;
  stop: void;
}

export type EventMap = MediatorEvents & {
  chat: ChatEvent;
  gamestate: GameEvent;
  animationComplete: AnimationEvent;
};

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
  public static create<
    T extends Record<string, any> = EventMap,
  >(): EventBus<T> {
    if (!EventBus.#instance) {
      EventBus.#instance = new EventBus<T>();
    }

    return EventBus.#instance as EventBus<T>;
  }

  public static destroy() {
    if (EventBus.#instance) {
      EventBus.#instance.teardown();
    }
    EventBus.#instance = null;
  }

  private constructor(debug = new Debug("EventBus", "LightBlue")) {
    this.#events = {};
    this.debug = debug;
  }

  public subscribe<K extends keyof Events>(
    eventName: K,
    callback: EventCallback<Events[K]>,
    source: string = "Unknown"
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
    source?: string
  ) {
    if (this.#events[eventName]) {
      // Properly filter out the callback and update the event's callback array.
      this.#events[eventName] = this.#events[eventName]?.filter((cb) => {
        const search = cb.callback !== callback;
        if (!search) {
          this.debug.log(
            `${source ?? cb.source} unsubscribing from: ${String(eventName)}`
          );
        }
        return search;
      });
    }
  }

  public once<K extends keyof Events>(
    eventName: K,
    callback: EventCallback<Events[K]>,
    source: string = "unknown"
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
    ...args: EventArgs<Events[K]>
  ): void {
    this.debug.log(`Emitting: ${String(eventName)}`);
    if (this.#events[eventName]) {
      this.#events[eventName]?.forEach(({ callback }) => {
        if (args.length === 0) {
          (callback as () => void)();
        } else if (args.length === 1) {
          (callback as (arg: Events[K]) => void)(args[0]);
        } else {
          (callback as (...args: Events[K]) => void)(...args);
        }
      });
    }
  }

  public listSubscriptions(): void {
    this.debug.log("Current event subscriptions:");
    Object.entries(this.#events).forEach(([eventName, callbacks]) => {
      this.debug.log(
        `Event: ${String(eventName)}, Subscribers: ${callbacks.length}`
      );
      callbacks.forEach((cb: { source: string }, index: number) => {
        this.debug.log(`  ${index + 1}. Source: ${cb.source}`);
      });
    });
  }

  private teardown() {
    this.#events = {};
  }
}

export const eventBus = EventBus.create();

