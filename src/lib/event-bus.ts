/* eslint-disable @typescript-eslint/no-explicit-any */
export type EventCallback<T> = (data: T) => void;

export interface EventMap {
  // Define your events and their payload types here. For example:
  "user:login": { userId: number; username: string };
  "user:logout": void;
  // You can add more events as needed.
}

export class EventBus<Events extends Record<string, any> = EventMap> {
  // Use a Partial mapping to store callbacks for defined events.
  #events: Partial<{ [K in keyof Events]: EventCallback<Events[K]>[] }>;

  private static instance: EventBus | null = null;

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

  private constructor() {
    this.#events = {};
  }

  subscribe<K extends keyof Events>(
    eventName: K,
    callback: EventCallback<Events[K]>
  ): () => void {
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
    if (this.#events[eventName]) {
      // Properly filter out the callback and update the event's callback array.
      this.#events[eventName] = this.#events[eventName]?.filter(
        (cb) => cb !== callback
      );
    }
  }

  emit<K extends keyof Events>(eventName: K, data: Events[K]) {
    if (this.#events[eventName]) {
      this.#events[eventName]?.forEach((callback) => callback(data));
    }
  }
}

