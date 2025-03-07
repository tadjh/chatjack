import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventBus } from "../event-bus";
import { EVENT } from "../types";

// Mock the Debug class
vi.mock("../debug", () => {
  return {
    Debug: vi.fn().mockImplementation(() => {
      return {
        log: vi.fn(),
      };
    }),
  };
});

// Create a test-specific event map to avoid type errors
interface TestEventMap {
  chat: { type: EVENT.CONNECTED } | { type: EVENT.DISCONNECTED };
  start: void;
  customEvent: [number, string, boolean];
  testEvent: string;
}

describe("EventBus", () => {
  let eventBus: EventBus<TestEventMap>;

  beforeEach(() => {
    // Reset the EventBus instance before each test
    EventBus.destroy();
    eventBus = EventBus.create<TestEventMap>();
    vi.clearAllMocks();
  });

  afterEach(() => {
    EventBus.destroy();
  });

  describe("Singleton pattern", () => {
    it("should create a singleton instance", () => {
      const instance1 = EventBus.create<TestEventMap>();
      const instance2 = EventBus.create<TestEventMap>();

      expect(instance1).toBe(instance2);
    });

    it("should destroy the singleton instance", () => {
      const instance1 = EventBus.create<TestEventMap>();
      EventBus.destroy();
      const instance2 = EventBus.create<TestEventMap>();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe("subscribe", () => {
    it("should subscribe to an event", () => {
      const callback = vi.fn();
      const source = "TestComponent";

      eventBus.subscribe("chat", callback, source);

      // Emit the event to test if the callback is called
      eventBus.emit("chat", { type: EVENT.CONNECTED });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ type: EVENT.CONNECTED });
    });

    it("should log the source when subscribing", () => {
      const callback = vi.fn();
      const source = "TestComponent";

      eventBus.subscribe("chat", callback, source);

      // Check if Debug.log was called with the correct source
      expect(eventBus["debug"].log).toHaveBeenCalledWith(
        expect.stringContaining("TestComponent subscribing to: chat"),
      );
    });

    it('should use "Unknown" as default source', () => {
      const callback = vi.fn();

      eventBus.subscribe("chat", callback);

      // Check if Debug.log was called with the default source
      expect(eventBus["debug"].log).toHaveBeenCalledWith(
        expect.stringContaining("Unknown subscribing to: chat"),
      );
    });

    it("should return an unsubscribe function", () => {
      const callback = vi.fn();

      const unsubscribe = eventBus.subscribe("chat", callback);

      // Emit once before unsubscribing
      eventBus.emit("chat", { type: EVENT.CONNECTED });
      expect(callback).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();

      // Emit again after unsubscribing
      eventBus.emit("chat", { type: EVENT.CONNECTED });
      expect(callback).toHaveBeenCalledTimes(1); // Still 1, not called again
    });
  });

  describe("unsubscribe", () => {
    it("should unsubscribe from an event", () => {
      const callback = vi.fn();

      eventBus.subscribe("chat", callback);
      eventBus.unsubscribe("chat", callback);

      // Emit the event to test if the callback is called
      eventBus.emit("chat", { type: EVENT.CONNECTED });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should log the source when unsubscribing", () => {
      const callback = vi.fn();
      const source = "TestComponent";

      eventBus.subscribe("chat", callback, source);
      vi.clearAllMocks(); // Clear previous log calls

      eventBus.unsubscribe("chat", callback);

      // Check if Debug.log was called with the correct source
      expect(eventBus["debug"].log).toHaveBeenCalledWith(
        expect.stringContaining("TestComponent unsubscribing from: chat"),
      );
    });

    it("should handle unsubscribing from non-existent event", () => {
      const callback = vi.fn();

      // Using a type assertion to test error handling for non-existent events
      type AnyEventBus = EventBus<Record<string, unknown>>;
      const anyEventBus = eventBus as AnyEventBus;

      // Should not throw an error
      expect(() => {
        // Using a type cast to bypass TypeScript's type checking for this test
        anyEventBus.unsubscribe(
          "nonExistentEvent" as keyof Record<string, unknown>,
          callback,
          "TestSource",
        );
      }).not.toThrow();
    });
  });

  describe("once", () => {
    it("should subscribe to an event only once", () => {
      const callback = vi.fn();

      eventBus.once("chat", callback);

      // Emit the event twice
      eventBus.emit("chat", { type: EVENT.CONNECTED });
      eventBus.emit("chat", { type: EVENT.CONNECTED });

      // Callback should only be called once
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should log the source when subscribing once", () => {
      const callback = vi.fn();
      const source = "TestComponent";

      eventBus.once("chat", callback, source);

      // Check if Debug.log was called with the correct source
      expect(eventBus["debug"].log).toHaveBeenCalledWith(
        expect.stringContaining("TestComponent subscribing once to: chat"),
      );
    });
  });

  describe("emit", () => {
    it("should emit an event with no data", () => {
      const callback = vi.fn();

      eventBus.subscribe("start", callback);
      eventBus.emit("start", undefined);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(undefined);
    });

    it("should emit an event with single data argument", () => {
      const callback = vi.fn();

      eventBus.subscribe("chat", callback);
      // Use a specific EVENT enum value instead of the generic EVENT type
      eventBus.emit("chat", { type: EVENT.CONNECTED });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ type: EVENT.CONNECTED });
    });

    it("should emit an event with multiple data arguments", () => {
      const callback = vi.fn();

      eventBus.subscribe("customEvent", callback);
      eventBus.emit("customEvent", [42, "test", true]);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith([42, "test", true]);
    });

    it("should handle emitting to non-existent event", () => {
      // Using a type assertion to test error handling for non-existent events
      type AnyEventBus = EventBus<Record<string, unknown>>;
      const anyEventBus = eventBus as AnyEventBus;

      // Should not throw an error
      expect(() => {
        // Using a type cast to bypass TypeScript's type checking for this test
        // For emit, we need to provide at least the event name
        anyEventBus.emit(
          "nonExistentEvent" as keyof Record<string, unknown>,
          undefined,
        );
      }).not.toThrow();
    });
  });

  describe("listSubscriptions", () => {
    it("should list all subscriptions with their sources", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.subscribe("chat", callback1, "Component1");
      eventBus.subscribe("chat", callback2, "Component2");
      eventBus.subscribe("start", callback1, "Component3");

      vi.clearAllMocks(); // Clear previous log calls

      eventBus.listSubscriptions();

      // Check if Debug.log was called with the correct information
      expect(eventBus["debug"].log).toHaveBeenCalledWith(
        "Current event subscriptions:",
      );
      expect(eventBus["debug"].log).toHaveBeenCalledWith(
        expect.stringContaining("Event: chat, Subscribers: 2"),
      );
      expect(eventBus["debug"].log).toHaveBeenCalledWith(
        expect.stringContaining("Source: Component1"),
      );
      expect(eventBus["debug"].log).toHaveBeenCalledWith(
        expect.stringContaining("Source: Component2"),
      );
      expect(eventBus["debug"].log).toHaveBeenCalledWith(
        expect.stringContaining("Event: start, Subscribers: 1"),
      );
      expect(eventBus["debug"].log).toHaveBeenCalledWith(
        expect.stringContaining("Source: Component3"),
      );
    });
  });
});
