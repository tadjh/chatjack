import { TimerEntity, TimerEntityProps } from "@/lib/canvas/entity.timer";
import { LAYER, POSITION } from "@/lib/canvas/types";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { radians } from "@/lib/canvas/utils";

describe("TimerEntity", () => {
  let timerEntity: TimerEntity;
  let mockCtx: CanvasRenderingContext2D;
  let onBeginSpy: ReturnType<typeof vi.fn>;
  let onEndSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock canvas context
    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      arc: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      globalAlpha: 1,
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D;

    onBeginSpy = vi.fn();
    onEndSpy = vi.fn();

    // Create a test timer entity
    const entityProps: TimerEntityProps = {
      id: "test-timer",
      type: "timer",
      layer: LAYER.UI,
      position: POSITION.CENTER,
      color: "red",
      backgroundColor: "black",
      backgroundScale: 1.2,
      strokeColor: "white",
      strokeWidth: 1.1,
      radius: 50,
      startAngle: 0,
      rotation: 0,
      counterclockwise: false,
      phases: [
        {
          name: "zoom-in",
          duration: 1,
        },
      ],
      onBegin: onBeginSpy,
      onEnd: onEndSpy,
    };

    timerEntity = new TimerEntity(entityProps);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with the correct values", () => {
      expect(timerEntity.id).toBe("test-timer");
      expect(timerEntity.type).toBe("timer");
      expect(timerEntity.layer).toBe(LAYER.UI);
      expect(timerEntity.position).toBe(POSITION.CENTER);
      expect(timerEntity.color).toBe("red");
      expect(timerEntity.backgroundColor).toBe("black");
      expect(timerEntity.backgroundScale).toBe(1.2);
      expect(timerEntity.strokeColor).toBe("white");
      expect(timerEntity.strokeScale).toBe(1.1);
      expect(timerEntity.radius).toBe(50);
      expect(timerEntity.startAngle).toBe(0); // 0 degrees in radians
      expect(timerEntity.rotation).toBe(0); // 0 degrees in radians
      expect(timerEntity.counterclockwise).toBe(false);
    });

    it("should use default values when not provided", () => {
      const minimalEntity = new TimerEntity({
        id: "minimal-timer",
        type: "timer",
        layer: LAYER.BG,
        color: "blue",
        radius: 30,
        startAngle: 0,
        rotation: 0,
        phases: [],
        backgroundColor: "black",
      });

      expect(minimalEntity.position).toBe(POSITION.TOP_LEFT); // Default position
      expect(minimalEntity.backgroundScale).toBe(1.15); // Default background scale
      expect(minimalEntity.strokeScale).toBe(1.05); // Default stroke scale
      expect(minimalEntity.counterclockwise).toBe(false); // Default counterclockwise
    });

    it("should set opacity to 1 when no phases are provided", () => {
      const noPhaseEntity = new TimerEntity({
        id: "no-phase-timer",
        type: "timer",
        layer: LAYER.UI,
        color: "green",
        radius: 40,
        startAngle: 0,
        rotation: 0,
        phases: [],
        backgroundColor: "black",
      });

      expect(noPhaseEntity.props.opacity).toBe(1);
    });

    it("should convert angles from degrees to radians", () => {
      const angleEntity = new TimerEntity({
        id: "angle-timer",
        type: "timer",
        layer: LAYER.UI,
        color: "yellow",
        radius: 40,
        startAngle: 90, // 90 degrees
        rotation: 45, // 45 degrees
        phases: [],
        backgroundColor: "black",
      });

      expect(angleEntity.rotation).toBeCloseTo(radians(45)); // π/4
      expect(angleEntity.startAngle).toBeCloseTo(radians(90) + radians(45)); // π/2 + π/4
    });
  });

  describe("animation", () => {
    it("should handle zoom-in animation", () => {
      // Create entity with zoom-in animation
      const zoomInEntity = new TimerEntity({
        id: "zoom-in-timer",
        type: "timer",
        layer: LAYER.UI,
        color: "red",
        radius: 50,
        startAngle: 0,
        rotation: 0,
        backgroundColor: "black",
        phases: [
          {
            name: "zoom-in",
            duration: 1,
          },
        ],
      });

      // Access the private interpolate method
      const interpolateMethod = Object.getPrototypeOf(zoomInEntity).interpolate;

      // Set up the current phase and progress
      zoomInEntity["current"] = zoomInEntity.phases[0];
      zoomInEntity["localProgress"] = 0.5;

      // Call the interpolate method
      interpolateMethod.call(zoomInEntity);

      // Verify properties were set correctly
      expect(zoomInEntity.props.scale).toBeGreaterThan(0); // Interpolated radius
      expect(zoomInEntity.props.scale).toBeLessThan(50); // Less than final radius
    });

    it("should handle countdown animation", () => {
      // Create entity with countdown animation
      const countdownEntity = new TimerEntity({
        id: "countdown-timer",
        type: "timer",
        layer: LAYER.UI,
        color: "blue",
        radius: 50,
        startAngle: 0,
        rotation: 0,
        backgroundColor: "black",
        phases: [
          {
            name: "countdown",
            duration: 1,
          },
        ],
      });

      // Access the private interpolate method
      const interpolateMethod =
        Object.getPrototypeOf(countdownEntity).interpolate;

      // Set up the current phase and progress
      countdownEntity["current"] = countdownEntity.phases[0];
      countdownEntity["localProgress"] = 0.5;

      // Call the interpolate method
      interpolateMethod.call(countdownEntity);

      // Verify properties were set correctly
      expect(countdownEntity.props.angle).toBeCloseTo(
        Math.PI + TimerEntity.epsilon / 2
      ); // Half of 2π
      expect(countdownEntity.props.scale).toBe(1); // Unchanged radius
    });

    it("should handle zoom-out animation", () => {
      // Create entity with zoom-out animation
      const zoomOutEntity = new TimerEntity({
        id: "zoom-out-timer",
        type: "timer",
        layer: LAYER.UI,
        color: "green",
        radius: 50,
        startAngle: 0,
        rotation: 0,
        backgroundColor: "black",
        phases: [
          {
            name: "zoom-out",
            duration: 1,
          },
        ],
      });

      // Access the private interpolate method
      const interpolateMethod =
        Object.getPrototypeOf(zoomOutEntity).interpolate;

      // Set up the current phase and progress
      zoomOutEntity["current"] = zoomOutEntity.phases[0];
      zoomOutEntity["localProgress"] = 0.5;

      // Call the interpolate method
      interpolateMethod.call(zoomOutEntity);

      // Verify properties were set correctly
      expect(zoomOutEntity.props.scale).toBeGreaterThan(0); // Interpolated radius
      expect(zoomOutEntity.props.scale).toBeLessThan(50); // Less than initial radius
    });

    it("should throw error when trying to ease with no current phase", () => {
      // Create a timer entity with no phases
      const noPhaseEntity = new TimerEntity({
        id: "no-phase-timer",
        type: "timer",
        layer: LAYER.UI,
        color: "purple",
        radius: 40,
        startAngle: 0,
        rotation: 0,
        phases: [],
        backgroundColor: "black",
      });

      // Access the private easing method
      const easingMethod = Object.getPrototypeOf(noPhaseEntity).easing;

      // Should throw error when trying to ease with no current phase
      expect(() => easingMethod.call(noPhaseEntity)).toThrow(
        "No current phase to ease"
      );
    });

    it("should throw error when trying to interpolate with no current phase", () => {
      // Create a timer entity with no phases
      const noPhaseEntity = new TimerEntity({
        id: "no-phase-timer",
        type: "timer",
        layer: LAYER.UI,
        color: "purple",
        radius: 40,
        startAngle: 0,
        rotation: 0,
        phases: [],
        backgroundColor: "black",
      });

      // Access the private interpolate method
      const interpolateMethod =
        Object.getPrototypeOf(noPhaseEntity).interpolate;

      // Should throw error when trying to interpolate with no current phase
      expect(() => interpolateMethod.call(noPhaseEntity)).toThrow(
        "No current phase to interpolate"
      );
    });

    it("should apply easeOutBack for zoom animations", () => {
      // Create entity with zoom-in animation
      const zoomInEntity = new TimerEntity({
        id: "zoom-in-timer",
        type: "timer",
        layer: LAYER.UI,
        color: "red",
        radius: 50,
        startAngle: 0,
        rotation: 0,
        phases: [
          {
            name: "zoom-in",
            duration: 1,
          },
        ],
        backgroundColor: "black",
      });

      // Access the private easing method
      const easingMethod = Object.getPrototypeOf(zoomInEntity).easing;

      // Set up the current phase and progress
      zoomInEntity["current"] = zoomInEntity.phases[0];
      zoomInEntity["localProgress"] = 0.5;

      // Store original progress
      const originalProgress = zoomInEntity["localProgress"];

      // Call the easing method
      easingMethod.call(zoomInEntity);

      // Verify easing was applied (progress should be different)
      expect(zoomInEntity["localProgress"]).not.toBe(originalProgress);
    });
  });

  describe("rendering", () => {
    it("should render timer with correct context settings", () => {
      // Set properties for rendering
      timerEntity.props.scale = 1;
      timerEntity.props.angle = Math.PI;

      // Render
      timerEntity.render(mockCtx);

      // Check that context methods were called with correct settings
      expect(mockCtx.beginPath).toHaveBeenCalledTimes(3); // Once for background, once for stroke, once for main timer
      expect(mockCtx.arc).toHaveBeenCalledTimes(3); // Once for each circle
      expect(mockCtx.fill).toHaveBeenCalledTimes(3); // Once for each fill
    });

    it("should apply props.scale to all circle radii", () => {
      // Set scale to 2
      timerEntity.props.scale = 2;
      timerEntity.props.angle = Math.PI;

      // Render
      timerEntity.render(mockCtx);

      // Check that arc was called with scaled radii for all circles
      const baseRadius =
        50 * (timerEntity as unknown as { scaleFactor: number }).scaleFactor;

      // Background circle (radius * backgroundScale * scale)
      expect(mockCtx.arc).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        baseRadius * 1.2 * 2, // backgroundScale is 1.2, scale is 2
        expect.any(Number),
        expect.any(Number),
        expect.any(Boolean)
      );

      // Stroke circle (radius * strokeScale * scale)
      expect(mockCtx.arc).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        baseRadius * 1.1 * 2, // strokeScale is 1.1, scale is 2
        expect.any(Number),
        expect.any(Number),
        expect.any(Boolean)
      );

      // Main circle (radius * scale)
      expect(mockCtx.arc).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        baseRadius * 2, // scale is 2
        expect.any(Number),
        expect.any(Number),
        expect.any(Boolean)
      );
    });

    it("should prevent negative scale values", () => {
      // Set negative scale
      timerEntity.props.scale = -1;
      timerEntity.props.angle = Math.PI;

      // Render
      timerEntity.render(mockCtx);

      // Check that arc was called with radius of 0 (clamped from negative)
      const baseRadius =
        50 * (timerEntity as unknown as { scaleFactor: number }).scaleFactor;

      // All circles should use scale of 0
      expect(mockCtx.arc).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        baseRadius * 1.2 * 0, // backgroundScale is 1.2, scale is 0
        expect.any(Number),
        expect.any(Number),
        expect.any(Boolean)
      );

      expect(mockCtx.arc).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        baseRadius * 1.1 * 0, // strokeScale is 1.1, scale is 0
        expect.any(Number),
        expect.any(Number),
        expect.any(Boolean)
      );

      expect(mockCtx.arc).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        baseRadius * 0, // scale is 0
        expect.any(Number),
        expect.any(Number),
        expect.any(Boolean)
      );
    });

    it("should use default scale of 1 when props.scale is not provided", () => {
      // Don't set scale (should default to 1)
      timerEntity.props.angle = Math.PI;

      // Render
      timerEntity.render(mockCtx);

      // Check that arc was called with default scale of 1
      const baseRadius =
        50 * (timerEntity as unknown as { scaleFactor: number }).scaleFactor;

      // All circles should use default scale of 1
      expect(mockCtx.arc).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        baseRadius * 1.2 * 1, // backgroundScale is 1.2, scale is 1
        expect.any(Number),
        expect.any(Number),
        expect.any(Boolean)
      );

      expect(mockCtx.arc).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        baseRadius * 1.1 * 1, // strokeScale is 1.1, scale is 1
        expect.any(Number),
        expect.any(Number),
        expect.any(Boolean)
      );

      expect(mockCtx.arc).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        baseRadius * 1, // scale is 1
        expect.any(Number),
        expect.any(Number),
        expect.any(Boolean)
      );
    });

    it("should not render background when backgroundColor is not set", () => {
      // Create entity without background
      const noBackgroundEntity = new TimerEntity({
        id: "no-background-timer",
        type: "timer",
        layer: LAYER.UI,
        color: "red",
        radius: 50,
        startAngle: 0,
        rotation: 0,
        phases: [],
        backgroundColor: "",
      });

      // Set properties for rendering
      noBackgroundEntity.props.scale = 50;
      noBackgroundEntity.props.angle = Math.PI;

      // Render
      noBackgroundEntity.render(mockCtx);

      // Check that context methods were called correct number of times
      expect(mockCtx.beginPath).toHaveBeenCalledTimes(1); // Only once for main timer
      expect(mockCtx.arc).toHaveBeenCalledTimes(1); // Only once for main timer
      expect(mockCtx.fill).toHaveBeenCalledTimes(1); // Only once for main timer
    });

    it("should not render stroke when strokeColor is not set", () => {
      // Create entity without stroke
      const noStrokeEntity = new TimerEntity({
        id: "no-stroke-timer",
        type: "timer",
        layer: LAYER.UI,
        color: "red",
        backgroundColor: "black",
        radius: 50,
        startAngle: 0,
        rotation: 0,
        phases: [],
      });

      // Set properties for rendering
      noStrokeEntity.props.scale = 50;
      noStrokeEntity.props.angle = Math.PI;

      // Render
      noStrokeEntity.render(mockCtx);

      // Check that context methods were called correct number of times
      expect(mockCtx.beginPath).toHaveBeenCalledTimes(2); // Once for background, once for main timer
      expect(mockCtx.arc).toHaveBeenCalledTimes(2); // Once for background, once for main timer
      expect(mockCtx.fill).toHaveBeenCalledTimes(2); // Once for background, once for main timer
    });

    it("should respect counterclockwise setting", () => {
      // Create entity with counterclockwise set to true
      const counterclockwiseEntity = new TimerEntity({
        id: "counterclockwise-timer",
        type: "timer",
        layer: LAYER.UI,
        color: "red",
        radius: 50,
        startAngle: 0,
        rotation: 0,
        counterclockwise: true,
        phases: [],
        backgroundColor: "black",
      });

      // Set properties for rendering
      counterclockwiseEntity.props.scale = 50;
      counterclockwiseEntity.props.angle = Math.PI;

      // Render
      counterclockwiseEntity.render(mockCtx);

      // Check that arc was called with counterclockwise set to true
      expect(mockCtx.arc).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        true
      );
    });
  });

  describe("resize", () => {
    it("should update dimensions based on scale factor", () => {
      // Store original dimensions
      const originalWidth = timerEntity.width;
      const originalHeight = timerEntity.height;

      // Mock getPosition to return a fixed position
      timerEntity["getPosition"] = vi.fn().mockReturnValue({ x: 100, y: 100 });

      // Resize
      timerEntity.resize();

      // Verify dimensions were updated
      expect(timerEntity.width).toBe(originalWidth);
      expect(timerEntity.height).toBe(originalHeight);
      expect(timerEntity.x).toBeGreaterThan(0);
      expect(timerEntity.y).toBeGreaterThan(0);
    });
  });

  describe("destroy", () => {
    it("should clear timer entity properties", () => {
      // Destroy
      timerEntity.destroy();

      // Check that radius is reset to 0
      expect(timerEntity.props.scale).toBe(0);
      expect(timerEntity.props.angle).toBe(0);

      // Verify that rendering still works after destruction
      timerEntity.render(mockCtx);

      // Verify the arc was called with radius 0
      expect(mockCtx.arc).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        0, // radius should be 0
        expect.any(Number),
        expect.any(Number),
        expect.any(Boolean)
      );
    });
  });
});

