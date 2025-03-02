/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dealer } from "@/lib/game/dealer";
import { Player } from "@/lib/game/player";
import { STATE, COMMAND, EVENT } from "./types";
import { Palette } from "@/lib/constants";
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
}

export type EventMap = MediatorEvents & {
  chat: ChatEvent;
  gamestate: GameEvent;
  animationComplete: AnimationEvent;
};

export class EventBus<Events extends Record<string, any> = EventMap> {
  // Use a Partial mapping to store callbacks for defined events.
  #events: Partial<{ [K in keyof Events]: EventCallback<Events[K]>[] }>;

  private static instance: EventBus | null = null;
  protected debug: Debug;
  public static create<T extends Record<string, any> = EventMap>(
    instance?: EventBus<T>
  ): EventBus<T> {
    if (instance) return instance;
    if (EventBus.instance) {
      return EventBus.instance as EventBus<T>;
    }
    EventBus.instance = new EventBus<T>();
    return EventBus.instance as EventBus<T>;
  }

  private constructor(debug = new Debug("EventBus", Palette.LightBlue)) {
    this.#events = {};
    this.debug = debug;
  }

  subscribe<K extends keyof Events>(
    eventName: K,
    callback: EventCallback<Events[K]>
  ): () => void {
    this.debug.log("Subscribing to event", eventName);
    if (!this.#events[eventName]) {
      this.#events[eventName] = [];
    }
    this.#events[eventName]?.push(callback);
    return () => this.unsubscribe(eventName, callback);
  }

  unsubscribe<K extends keyof Events>(
    eventName: K,
    callback: EventCallback<Events[K]>
  ) {
    this.debug.log("Unsubscribing from event", eventName);
    if (this.#events[eventName]) {
      // Properly filter out the callback and update the event's callback array.
      this.#events[eventName] = this.#events[eventName]?.filter(
        (cb) => cb !== callback
      );
    }
  }

  once<K extends keyof Events>(
    eventName: K,
    callback: EventCallback<Events[K]>
  ): () => void {
    this.debug.log("Subscribing once to event", eventName);
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

    return this.subscribe(eventName, wrappedCallback);
  }

  emit<K extends keyof Events>(
    eventName: K,
    ...args: EventArgs<Events[K]>
  ): void {
    this.debug.log("Emitting event", eventName);
    if (this.#events[eventName]) {
      this.#events[eventName]?.forEach((callback) => {
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
}

export const eventBus = EventBus.create();

