import { Counter } from "@/lib/canvas/counter";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Counter", () => {
  let callback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    callback = vi.fn();
  });

  describe("constructor", () => {
    it("should initialize with the correct values", () => {
      const counter = new Counter("test-counter", 5, callback);

      expect(counter.current).toBe(0);
      expect(counter.name).toBe("test-counter");
      expect(counter.targetCount).toBe(5);
    });
  });

  describe("tick", () => {
    it("should increment the counter", () => {
      const counter = new Counter("test-counter", 5, callback);

      counter.tick();

      expect(counter.current).toBe(1);
      expect(callback).not.toHaveBeenCalled();
    });

    it("should call the callback when target count is reached", () => {
      const counter = new Counter("test-counter", 3, callback);

      counter.tick();
      counter.tick();
      counter.tick(); // This should trigger the callback

      expect(counter.current).toBe(3);
      expect(callback).toHaveBeenCalledTimes(1); // Once for reaching target
    });

    it("should call destroy when target count is reached", () => {
      const counter = new Counter("test-counter", 2, callback);
      const destroySpy = vi.spyOn(counter, "destroy");

      counter.tick();
      counter.tick(); // This should trigger destroy

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });

    it("should not call the callback before target count is reached", () => {
      const counter = new Counter("test-counter", 5, callback);

      counter.tick();
      counter.tick();
      counter.tick();
      counter.tick();

      expect(counter.current).toBe(4);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("destroy", () => {
    it("should set current to target count", () => {
      const counter = new Counter("test-counter", 10, callback);

      counter.destroy();

      expect(counter.current).toBe(10);
    });

    it("should replace the callback with null", () => {
      const counter = new Counter("test-counter", 5, callback);

      counter.destroy();
      callback.mockClear();

      expect(counter.callback).toBeNull();

      // Original callback should not be called
      expect(callback).not.toHaveBeenCalled();
    });

    it("should prevent further callbacks when ticking after destroy", () => {
      const counter = new Counter("test-counter", 5, callback);

      counter.destroy();
      callback.mockClear();

      // Try to tick after destroy
      counter.tick();

      // Original callback should not be called
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle a target count of 0", () => {
      const counter = new Counter("zero-counter", 0, callback);

      // First tick should immediately trigger callback and destroy
      counter.tick();

      expect(counter.current).toBe(0); // Should be set to target (0)
      expect(callback).toHaveBeenCalledTimes(1); // Once for reaching target
    });

    it("should handle a target count of 1", () => {
      const counter = new Counter("single-counter", 1, callback);

      counter.tick();

      expect(counter.current).toBe(1);
      expect(callback).toHaveBeenCalledTimes(1); // Once for reaching target
    });
  });
});

