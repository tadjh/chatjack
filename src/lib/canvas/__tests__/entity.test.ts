import {
  Entity,
  BaseAnimationProps,
  BaseEntityProps,
} from "@/lib/canvas/entity";
import { LAYER, POSITION } from "@/lib/canvas/types";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FPS } from "@/lib/canvas/constants";

// Create a concrete implementation of Entity for testing
type TestPhase = "idle" | "active" | "complete";
type TestProps = BaseAnimationProps & {
  scale: number;
  rotation: number;
};

class TestEntity extends Entity<TestPhase, TestProps> {
  // We need to implement the abstract method but don't use it in tests
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(ctx: CanvasRenderingContext2D): this {
    // Simple implementation for testing
    return this;
  }
}

describe("Entity", () => {
  let entity: TestEntity;
  let onBeginSpy: ReturnType<typeof vi.fn>;
  let onEndSpy: ReturnType<typeof vi.fn>;

  // Mock window dimensions
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, "innerWidth", {
      value: 1024,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 768,
      writable: true,
    });

    // Mock performance.now
    vi.spyOn(performance, "now").mockReturnValue(1000);

    onBeginSpy = vi.fn();
    onEndSpy = vi.fn();

    // Create a test entity with basic animation phases
    const entityProps: BaseEntityProps<TestPhase, TestProps> = {
      id: "test-entity",
      type: "test",
      layer: LAYER.UI,
      position: POSITION.CENTER,
      phases: [
        {
          name: "idle",
          duration: 1, // 1 second
        },
        {
          name: "active",
          duration: 1, // 1 second
        },
        {
          name: "complete",
          duration: 1, // 1 second
        },
      ],
      props: {
        opacity: 1,
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        rotation: 0,
      },
      onBegin: onBeginSpy,
      onEnd: onEndSpy,
    };

    entity = new TestEntity(entityProps);
  });

  afterEach(() => {
    // Restore window dimensions
    Object.defineProperty(window, "innerWidth", { value: originalInnerWidth });
    Object.defineProperty(window, "innerHeight", {
      value: originalInnerHeight,
    });

    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with the correct values", () => {
      expect(entity.id).toBe("test-entity");
      expect(entity.type).toBe("test");
      expect(entity.layer).toBe(LAYER.UI);
      expect(entity.position).toBe(POSITION.CENTER);
      expect(entity.progress).toBe(0);
      expect(entity.phases.length).toBe(3);
      expect(entity.props).toEqual({
        opacity: 1,
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        rotation: 0,
      });
    });

    it("should calculate total duration correctly", () => {
      // Total duration should be the sum of all phase durations
      const entityInstance = entity as unknown as { totalDuration: number };
      expect(entityInstance.totalDuration).toBe(3); // 1 + 1 + 1
    });

    it("should use default values when not provided", () => {
      const minimalEntity = new TestEntity({
        id: "minimal",
        type: "test",
        layer: LAYER.BG,
        phases: [],
        props: {
          opacity: 1,
          offsetX: 0,
          offsetY: 0,
          scale: 1,
          rotation: 0,
        },
      });

      expect(minimalEntity.position).toBe(POSITION.TOP_LEFT); // Default position
      expect(minimalEntity.opacity).toBe(1); // Default opacity
      expect(minimalEntity.delay).toBe(0); // Default delay
      expect(minimalEntity.x).toBe(0); // Default x
      expect(minimalEntity.y).toBe(0); // Default y
    });
  });

  describe("update", () => {
    it("should increase progress on each update", () => {
      entity.update();

      // Progress should increase by speed (1 / (totalDuration * FPS))
      const expectedProgress = 1 / (3 * FPS);
      expect(entity.progress).toBeCloseTo(expectedProgress, 5);
    });

    it("should call onBegin when progress starts", () => {
      entity.update();

      expect(onBeginSpy).toHaveBeenCalledTimes(1);
      expect(onBeginSpy).toHaveBeenCalledWith(LAYER.UI, "test-entity");
    });

    it("should call onEnd when progress completes", () => {
      // Force progress to almost complete
      const entityInstance = entity as unknown as { progress: number };
      entityInstance.progress = 0.99;

      // This update should complete the progress
      entity.update();

      expect(entity.progress).toBe(1);
      expect(onEndSpy).toHaveBeenCalledTimes(1);
      expect(onEndSpy).toHaveBeenCalledWith(LAYER.UI, "test-entity");
    });

    it("should only call onBegin and onEnd once", () => {
      // First update - should call onBegin
      entity.update();
      expect(onBeginSpy).toHaveBeenCalledTimes(1);

      // Second update - should not call onBegin again
      entity.update();
      expect(onBeginSpy).toHaveBeenCalledTimes(1);

      // Force progress to complete
      const entityInstance = entity as unknown as { progress: number };
      entityInstance.progress = 1;
      entity.update();
      expect(onEndSpy).toHaveBeenCalledTimes(1);

      // Another update after completion - should not call onEnd again
      entity.update();
      expect(onEndSpy).toHaveBeenCalledTimes(1);
    });

    it("should set the current phase based on progress", () => {
      // Start in first phase
      entity.update();
      const entityWithCurrent = entity as unknown as {
        current: { name: string };
      };
      expect(entityWithCurrent.current.name).toBe("idle");

      // Move to second phase
      const entityInstance = entity as unknown as { progress: number };
      entityInstance.progress = 0.4;
      entity.update();
      expect(entityWithCurrent.current.name).toBe("active");

      // Move to third phase
      entityInstance.progress = 0.8;
      entity.update();
      expect(entityWithCurrent.current.name).toBe("complete");
    });

    it("should calculate local progress within the current phase", () => {
      // Start in first phase
      entity.update();
      const entityWithProgress = entity as unknown as {
        localProgress: number;
        current: { name: string };
      };
      expect(entityWithProgress.localProgress).toBeGreaterThan(0);
      expect(entityWithProgress.localProgress).toBeLessThan(1);

      // Middle of second phase
      const entityInstance = entity as unknown as { progress: number };
      entityInstance.progress = 0.5; // 1.5 seconds into a 3 second animation
      entity.update();
      expect(entityWithProgress.current.name).toBe("active");
      expect(entityWithProgress.localProgress).toBeCloseTo(0.58333, 5); // 0.5 seconds into a 1 second phase
    });
  });

  describe("reset", () => {
    it("should reset all animation state", () => {
      // Update a few times to advance the animation
      entity.update();
      entity.update();

      // Reset
      entity.reset();

      expect(entity.progress).toBe(0);
      const entityInstance = entity as unknown as {
        startTime: number;
        hasBeginFired: boolean;
        hasEndFired: boolean;
        localProgress: number;
        phaseStart: number;
        current: null;
      };
      expect(entityInstance.startTime).toBe(0);
      expect(entityInstance.hasBeginFired).toBe(false);
      expect(entityInstance.hasEndFired).toBe(false);
      expect(entityInstance.localProgress).toBe(0);
      expect(entityInstance.phaseStart).toBe(0);
      expect(entityInstance.current).toBe(null);
    });

    it("should allow the animation to start again after reset", () => {
      // Update to advance animation
      entity.update();

      // Reset
      entity.reset();

      // Update again
      entity.update();

      // Should fire onBegin again
      expect(onBeginSpy).toHaveBeenCalledTimes(2);
      expect(entity.progress).toBeGreaterThan(0);
    });
  });

  describe("destroy", () => {
    it("should clear all entity properties", () => {
      entity.destroy();

      expect(entity.phases).toEqual([]);
      expect(entity.props).toEqual({});
      expect(entity.opacity).toBe(0);
      expect(entity.x).toBe(0);
      expect(entity.y).toBe(0);
      expect(entity.width).toBe(0);
      expect(entity.height).toBe(0);

      const entityInstance = entity as unknown as {
        startTime: number;
        totalDuration: number;
        phaseStart: number;
        localProgress: number;
        onBegin: undefined;
        onEnd: undefined;
        hasBeginFired: boolean;
        hasEndFired: boolean;
      };
      expect(entityInstance.startTime).toBe(0);
      expect(entityInstance.totalDuration).toBe(0);
      expect(entityInstance.phaseStart).toBe(0);
      expect(entityInstance.localProgress).toBe(0);
      expect(entityInstance.onBegin).toBeUndefined();
      expect(entityInstance.onEnd).toBeUndefined();
      expect(entityInstance.hasBeginFired).toBe(false);
      expect(entityInstance.hasEndFired).toBe(false);
    });
  });

  describe("resize", () => {
    it("should update scale factors", () => {
      const entityInstance = entity as unknown as {
        scaleFactor: number;
        padding: number;
      };
      const originalScaleFactor = entityInstance.scaleFactor;
      const originalPadding = entityInstance.padding;

      // Mock different window size
      Object.defineProperty(window, "innerWidth", { value: 2048 });
      Object.defineProperty(window, "innerHeight", { value: 1536 });

      entity.resize();

      // We can't test exact values since getScaleFactor is imported,
      // but we can verify the method updates the properties
      expect(entityInstance.scaleFactor).not.toBe(originalScaleFactor);
      expect(entityInstance.padding).not.toBe(originalPadding);
    });
  });

  describe("animation phases", () => {
    it("should handle looping animations", () => {
      // Create entity with a looping phase
      const loopingEntity = new TestEntity({
        id: "looping",
        type: "test",
        layer: LAYER.UI,
        phases: [
          {
            name: "idle",
            duration: 1,
            loop: true,
          },
        ],
        props: {
          opacity: 1,
          offsetX: 0,
          offsetY: 0,
          scale: 1,
          rotation: 0,
        },
      });

      // Mock performance.now to simulate time passing
      vi.spyOn(performance, "now").mockReturnValue(1000);
      loopingEntity.update();

      // Advance time by 1.5 seconds (1.5 loops)
      vi.spyOn(performance, "now").mockReturnValue(2500);
      loopingEntity.update();

      // Local progress should be based on the current loop position (0.5 into the loop)
      const loopingEntityInstance = loopingEntity as unknown as {
        localProgress: number;
      };
      expect(loopingEntityInstance.localProgress).toBeCloseTo(0.5, 5);
    });

    it("should handle custom easing functions", () => {
      const easingSpy = vi.fn().mockReturnValue({
        opacity: 0.5,
        offsetX: 10,
        offsetY: 20,
        scale: 1.5,
        rotation: 45,
      });

      const easingEntity = new TestEntity({
        id: "easing",
        type: "test",
        layer: LAYER.UI,
        phases: [
          {
            name: "idle",
            duration: 1,
            easing: easingSpy,
          },
        ],
        props: {
          opacity: 1,
          offsetX: 0,
          offsetY: 0,
          scale: 1,
          rotation: 0,
        },
      });

      easingEntity.update();

      expect(easingSpy).toHaveBeenCalled();
      expect(easingEntity.props).toEqual({
        opacity: 0.5,
        offsetX: 10,
        offsetY: 20,
        scale: 1.5,
        rotation: 45,
      });
    });

    it("should handle custom interpolation functions", () => {
      const interpolateSpy = vi.fn().mockReturnValue({
        opacity: 0.7,
        offsetX: 15,
        offsetY: 25,
        scale: 2,
        rotation: 90,
      });

      const interpolateEntity = new TestEntity({
        id: "interpolate",
        type: "test",
        layer: LAYER.UI,
        phases: [
          {
            name: "idle",
            duration: 1,
            interpolate: interpolateSpy,
          },
        ],
        props: {
          opacity: 1,
          offsetX: 0,
          offsetY: 0,
          scale: 1,
          rotation: 0,
        },
      });

      interpolateEntity.update();

      expect(interpolateSpy).toHaveBeenCalled();
      expect(interpolateEntity.props).toEqual({
        opacity: 0.7,
        offsetX: 15,
        offsetY: 25,
        scale: 2,
        rotation: 90,
      });
    });

    it("should handle built-in animation types", () => {
      // Test a built-in animation type
      const slideEntity = new TestEntity({
        id: "slide",
        type: "test",
        layer: LAYER.UI,
        phases: [
          {
            name: "slide-in-top",
            duration: 1,
            magnitude: 100,
          },
        ],
        props: {
          opacity: 1,
          offsetX: 0,
          offsetY: -100,
          scale: 1,
          rotation: 0,
        },
      });

      // Update halfway through animation
      const slideEntityInstance = slideEntity as unknown as {
        progress: number;
      };
      slideEntityInstance.progress = 0.5;
      slideEntity.update();

      // Should have interpolated offsetY
      expect(slideEntity.props.offsetY).toBeGreaterThan(-100);
      expect(slideEntity.props.offsetY).toBeLessThan(0);
    });
  });

  describe("getPosition", () => {
    it("should calculate position based on POSITION enum", () => {
      // Create entities with different positions
      const createEntityWithPosition = (position: POSITION) => {
        return new TestEntity({
          id: "position-test",
          type: "test",
          layer: LAYER.UI,
          position,
          phases: [],
          props: {
            opacity: 1,
            offsetX: 0,
            offsetY: 0,
            scale: 1,
            rotation: 0,
          },
        });
      };

      // Test CENTER position
      const centerEntity = createEntityWithPosition(POSITION.CENTER);
      centerEntity.width = 100;
      centerEntity.height = 100;

      type EntityWithGetPosition = { getPosition(): { x: number; y: number } };
      const centerEntityWithMethod =
        centerEntity as unknown as EntityWithGetPosition;
      const centerPos = centerEntityWithMethod.getPosition();
      expect(centerPos.x).toBe((window.innerWidth - 100) / 2);
      expect(centerPos.y).toBe((window.innerHeight - 100) / 2);

      // Test TOP_LEFT position
      const topLeftEntity = createEntityWithPosition(POSITION.TOP_LEFT);
      topLeftEntity.width = 100;
      topLeftEntity.height = 100;

      const topLeftEntityWithMethod =
        topLeftEntity as unknown as EntityWithGetPosition;
      const topLeftPos = topLeftEntityWithMethod.getPosition();
      const entityWithPadding = topLeftEntity as unknown as { padding: number };
      expect(topLeftPos.x).toBe(entityWithPadding.padding);
      expect(topLeftPos.y).toBe(entityWithPadding.padding);

      // Test BOTTOM_RIGHT position
      const bottomRightEntity = createEntityWithPosition(POSITION.BOTTOM_RIGHT);
      bottomRightEntity.width = 100;
      bottomRightEntity.height = 100;

      const bottomRightEntityWithMethod =
        bottomRightEntity as unknown as EntityWithGetPosition;
      const bottomRightPos = bottomRightEntityWithMethod.getPosition();
      const bottomRightEntityWithPadding = bottomRightEntity as unknown as {
        padding: number;
      };
      expect(bottomRightPos.x).toBe(
        window.innerWidth - 100 - bottomRightEntityWithPadding.padding
      );
      expect(bottomRightPos.y).toBe(
        window.innerHeight - 100 - bottomRightEntityWithPadding.padding
      );
    });
  });
});

