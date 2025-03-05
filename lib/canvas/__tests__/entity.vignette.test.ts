import {
  VignetteEntity,
  VignetteEntityProps,
} from "@/lib/canvas/entity.vignette";
import { LAYER } from "@/lib/canvas/types";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("VignetteEntity", () => {
  let vignetteEntity: VignetteEntity;
  let mockCtx: CanvasRenderingContext2D;
  let mockGradient: CanvasGradient;
  let createGradientFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, "innerWidth", {
      value: 1024,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 768,
      configurable: true,
    });

    // Mock gradient
    mockGradient = {
      addColorStop: vi.fn(),
    } as unknown as CanvasGradient;

    // Mock canvas context
    createGradientFn = vi.fn().mockReturnValue(mockGradient);
    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      createRadialGradient: createGradientFn,
      fillRect: vi.fn(),
      globalAlpha: 1,
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D;

    // Create a test vignette entity
    const entityProps: VignetteEntityProps = {
      id: "test-vignette",
      type: "vignette",
      layer: LAYER.GAME,
    };

    vignetteEntity = new VignetteEntity(entityProps);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with the correct values", () => {
      expect(vignetteEntity.id).toBe("test-vignette");
      expect(vignetteEntity.type).toBe("vignette");
      expect(vignetteEntity.layer).toBe(LAYER.GAME);
      expect(vignetteEntity.props.opacity).toBe(0); // Initial opacity
    });

    it("should initialize with default phases when none provided", () => {
      expect(vignetteEntity.phases).toEqual([
        { name: "fade-in", duration: 1 },
        { name: "idle", duration: 10, loop: true },
        { name: "fade-out", duration: 1 },
      ]);
    });

    it("should use provided phases when specified", () => {
      const customPhases = [
        { name: "fade-in" as const, duration: 2 },
        { name: "fade-out" as const, duration: 2 },
      ];

      const customEntity = new VignetteEntity({
        id: "custom-vignette",
        type: "vignette",
        layer: LAYER.GAME,
        phases: customPhases,
      });

      expect(customEntity.phases).toEqual(customPhases);
    });
  });

  describe("animation control", () => {
    it("should handle fadeIn", () => {
      vignetteEntity.fadeIn();
      expect(vignetteEntity.currentPhase?.name).toBe("fade-in");
    });

    it("should handle fadeOut with callback", () => {
      const callback = vi.fn();
      vignetteEntity.fadeOut(callback);
      expect(vignetteEntity.currentPhase?.name).toBe("fade-out");
      expect(vignetteEntity.onEnd).toBe(callback);
    });

    it("should handle fadeOut without callback", () => {
      vignetteEntity.fadeOut();
      expect(vignetteEntity.currentPhase?.name).toBe("fade-out");
      expect(vignetteEntity.onEnd).toBeUndefined();
    });
  });

  describe("rendering", () => {
    it("should create gradient on first render", () => {
      vignetteEntity.render(mockCtx);

      // Check gradient creation
      expect(createGradientFn).toHaveBeenCalledWith(
        512, // window.innerWidth / 2
        384, // window.innerHeight / 2
        0,
        512,
        384,
        expect.any(Number) // radius calculation
      );

      // Check gradient color stops
      expect(mockGradient.addColorStop).toHaveBeenCalledTimes(3);
      expect(mockGradient.addColorStop).toHaveBeenCalledWith(
        0,
        "rgba(0, 0, 0, 0)"
      );
      expect(mockGradient.addColorStop).toHaveBeenCalledWith(
        0.7,
        "rgba(0, 0, 0, 0)"
      );
      expect(mockGradient.addColorStop).toHaveBeenCalledWith(
        1,
        "rgba(0, 0, 0, 0.5)"
      );
    });

    it("should reuse existing gradient on subsequent renders", () => {
      // First render creates gradient
      vignetteEntity.render(mockCtx);
      const initialCalls = createGradientFn.mock.calls.length;

      // Second render should reuse gradient
      vignetteEntity.render(mockCtx);
      expect(createGradientFn.mock.calls.length).toBe(initialCalls);
    });

    it("should apply opacity from props", () => {
      vignetteEntity.props.opacity = 0.5;
      vignetteEntity.render(mockCtx);

      expect(mockCtx.globalAlpha).toBe(0.5);
    });

    it("should fill entire viewport", () => {
      vignetteEntity.render(mockCtx);

      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 1024, 768);
    });

    it("should properly save and restore context state", () => {
      vignetteEntity.render(mockCtx);

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });
  });

  describe("resize", () => {
    it("should update dimensions on resize", () => {
      // Initial render
      vignetteEntity.render(mockCtx);
      const initialCalls = createGradientFn.mock.calls.length;

      // Change window dimensions
      Object.defineProperty(window, "innerWidth", {
        value: 800,
        configurable: true,
      });
      Object.defineProperty(window, "innerHeight", {
        value: 600,
        configurable: true,
      });

      // Resize and render
      vignetteEntity.resize();
      vignetteEntity.render(mockCtx);

      // Should create new gradient with updated dimensions
      expect(createGradientFn.mock.calls.length).toBe(initialCalls + 1);
      expect(createGradientFn).toHaveBeenLastCalledWith(
        400, // new window.innerWidth / 2
        300, // new window.innerHeight / 2
        0,
        400,
        300,
        expect.any(Number) // new radius calculation
      );
    });

    it("should reset gradient on resize", () => {
      // Initial render
      vignetteEntity.render(mockCtx);

      // Clear gradient creation calls
      createGradientFn.mockClear();

      // Resize without changing dimensions
      vignetteEntity.resize();
      vignetteEntity.render(mockCtx);

      // Should create new gradient even if dimensions haven't changed
      expect(createGradientFn).toHaveBeenCalled();
    });
  });
});

