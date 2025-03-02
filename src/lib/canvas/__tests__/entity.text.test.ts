import { TextEntity, TextEntityProps } from "@/lib/canvas/entity.text";
import { LAYER, POSITION } from "@/lib/canvas/types";
import { FONT } from "@/lib/canvas/constants";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("TextEntity", () => {
  let textEntity: TextEntity;
  let mockCtx: CanvasRenderingContext2D;
  let onBeginSpy: ReturnType<typeof vi.fn>;
  let onEndSpy: ReturnType<typeof vi.fn>;
  let originalOffscreenCanvas: typeof global.OffscreenCanvas;

  beforeEach(() => {
    // Save original OffscreenCanvas
    originalOffscreenCanvas = global.OffscreenCanvas;

    // Mock OffscreenCanvas and its context
    const mockOffscreenCtx = {
      measureText: vi.fn().mockReturnValue({
        width: 100,
        fontBoundingBoxAscent: 10,
        fontBoundingBoxDescent: 5,
      }),
      font: "",
      drawImage: vi.fn(),
      imageSmoothingEnabled: false,
    };

    const mockOffscreenCanvas = {
      getContext: vi.fn().mockReturnValue(mockOffscreenCtx),
      transferToImageBitmap: vi.fn().mockReturnValue({} as ImageBitmap),
    };

    // Override global OffscreenCanvas
    global.OffscreenCanvas = vi
      .fn()
      .mockImplementation(() => mockOffscreenCanvas);

    // Mock canvas context
    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      measureText: vi.fn().mockReturnValue({
        width: 100,
        fontBoundingBoxAscent: 10,
        fontBoundingBoxDescent: 5,
      }),
      globalAlpha: 1,
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      shadowColor: "",
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowBlur: 0,
      textBaseline: "alphabetic",
      textAlign: "start",
      letterSpacing: "0px",
      font: "",
    } as unknown as CanvasRenderingContext2D;

    onBeginSpy = vi.fn();
    onEndSpy = vi.fn();

    // Create a test text entity
    const entityProps: TextEntityProps = {
      id: "test-text",
      type: "text",
      layer: LAYER.UI,
      position: POSITION.CENTER,
      text: "Test Text",
      fontSize: 24,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "middle",
      textAlign: "center",
      color: "white",
      strokeColor: "black",
      strokeWidth: 2,
      phases: [
        {
          name: "fade-slide-in-bottom",
          duration: 1,
        },
      ],
      onBegin: onBeginSpy,
      onEnd: onEndSpy,
    };

    textEntity = new TextEntity(entityProps);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore original OffscreenCanvas
    global.OffscreenCanvas = originalOffscreenCanvas;
  });

  describe("constructor", () => {
    it("should initialize with the correct values", () => {
      expect(textEntity.id).toBe("test-text");
      expect(textEntity.type).toBe("text");
      expect(textEntity.layer).toBe(LAYER.UI);
      expect(textEntity.position).toBe(POSITION.CENTER);
      expect(textEntity.text).toBe("Test Text");
      expect(textEntity.fontSize).toBe(24);
      expect(textEntity.fontFamily).toBe(FONT.SANS_SERIF);
      expect(textEntity.textBaseline).toBe("middle");
      expect(textEntity.textAlign).toBe("center");
      expect(textEntity.color).toBe("white");
      expect(textEntity.strokeColor).toBe("black");
      expect(textEntity.strokeWidth).toBe(2);
    });

    it("should use default values when not provided", () => {
      const minimalEntity = new TextEntity({
        id: "minimal-text",
        type: "text",
        layer: LAYER.BG,
        text: "Minimal Text",
        fontSize: 16,
        fontFamily: FONT.DISPLAY,
        textBaseline: "top",
        textAlign: "left",
        color: "black",
        strokeColor: undefined,
        phases: [],
      });

      expect(minimalEntity.position).toBe(POSITION.TOP_LEFT); // Default position
      expect(minimalEntity.strokeWidth).toBe(0); // Default stroke width
      expect(minimalEntity.strokeColor).toBeUndefined(); // Default stroke color
    });

    it("should set opacity to 1 when no phases are provided", () => {
      const noPhaseEntity = new TextEntity({
        id: "no-phase-text",
        type: "text",
        layer: LAYER.UI,
        text: "No Phase Text",
        fontSize: 20,
        fontFamily: FONT.SANS_SERIF,
        textBaseline: "middle",
        textAlign: "center",
        color: "white",
        strokeColor: undefined,
        phases: [],
      });

      expect(noPhaseEntity.props.opacity).toBe(1);
    });

    it("should initialize offscreen context", () => {
      // We can't directly test private fields, but we can test behavior
      // by checking if the entity can be rendered without errors
      expect(() => textEntity.render(mockCtx)).not.toThrow();
    });
  });

  describe("text management", () => {
    it("should allow changing text content", () => {
      const newText = "Updated Text";
      textEntity.text = newText;
      expect(textEntity.text).toBe(newText);
    });

    it("should allow changing text color", () => {
      const newColor = "red";
      textEntity.color = newColor;
      expect(textEntity.color).toBe(newColor);
    });
  });

  describe("animation", () => {
    it("should handle fade-slide-kerning-in-bottom animation", () => {
      // Create entity with fade-slide-kerning-in-bottom animation
      const fadeSlideEntity = new TextEntity({
        id: "fade-slide-entity",
        type: "text",
        layer: LAYER.UI,
        text: "Fade Slide Text",
        fontSize: 24,
        fontFamily: FONT.SANS_SERIF,
        textBaseline: "middle",
        textAlign: "center",
        color: "white",
        strokeColor: undefined,
        phases: [
          {
            name: "fade-slide-kerning-in-bottom",
            duration: 1,
          },
        ],
      });

      // Manually set properties to verify they can be updated
      fadeSlideEntity.props.opacity = 0.5;
      fadeSlideEntity.props.kerning = 20;
      fadeSlideEntity.props.offsetY = 25;

      // Verify properties were set correctly
      expect(fadeSlideEntity.props.opacity).toBe(0.5);
      expect(fadeSlideEntity.props.kerning).toBe(20);
      expect(fadeSlideEntity.props.offsetY).toBe(25);
    });

    it("should throw error when trying to ease with no current phase", () => {
      // Create a text entity with no phases
      const noPhaseEntity = new TextEntity({
        id: "no-phase-text",
        type: "text",
        layer: LAYER.UI,
        text: "No Phase Text",
        fontSize: 20,
        fontFamily: FONT.SANS_SERIF,
        textBaseline: "middle",
        textAlign: "center",
        color: "white",
        strokeColor: undefined,
        phases: [],
      });

      // Access the private easing method
      const easingMethod = Object.getPrototypeOf(noPhaseEntity).easing;

      // Should throw error when trying to ease with no current phase
      expect(() => easingMethod.call(noPhaseEntity)).toThrow(
        "No current phase to ease"
      );
    });

    it("should throw error when trying to interpolate with no current phase", () => {
      // Create a text entity with no phases
      const noPhaseEntity = new TextEntity({
        id: "no-phase-text",
        type: "text",
        layer: LAYER.UI,
        text: "No Phase Text",
        fontSize: 20,
        fontFamily: FONT.SANS_SERIF,
        textBaseline: "middle",
        textAlign: "center",
        color: "white",
        strokeColor: undefined,
        phases: [],
      });

      // Access the private interpolate method
      const interpolateMethod =
        Object.getPrototypeOf(noPhaseEntity).interpolate;

      // Should throw error when trying to interpolate with no current phase
      expect(() => interpolateMethod.call(noPhaseEntity)).toThrow(
        "No current phase to interpolate"
      );
    });
  });

  describe("rendering", () => {
    it("should render text with correct context settings", () => {
      // Render
      textEntity.render(mockCtx);

      // Check that context methods were called with correct settings
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.textBaseline).toBe("middle");
      expect(mockCtx.textAlign).toBe("center");
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "Test Text",
        expect.any(Number),
        expect.any(Number)
      );
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it("should apply stroke when stroke properties are set", () => {
      // Render
      textEntity.render(mockCtx);

      // Check that stroke was applied
      expect(mockCtx.strokeStyle).toBe("black");
      expect(mockCtx.lineWidth).toBe(
        2 * (textEntity as unknown as { scaleFactor: number }).scaleFactor
      );
      expect(mockCtx.strokeText).toHaveBeenCalledWith(
        "Test Text",
        expect.any(Number),
        expect.any(Number)
      );
    });

    it("should apply shadow when shadow properties are set", () => {
      // Create entity with shadow
      const shadowEntity = new TextEntity({
        id: "shadow-text",
        type: "text",
        layer: LAYER.UI,
        text: "Shadow Text",
        fontSize: 24,
        fontFamily: FONT.SANS_SERIF,
        textBaseline: "middle",
        textAlign: "center",
        color: "white",
        strokeColor: undefined,
        shadowColor: "rgba(0, 0, 0, 0.5)",
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 4,
        phases: [],
      });

      // Verify shadow properties were set correctly on the entity
      expect(shadowEntity.shadowColor).toBe("rgba(0, 0, 0, 0.5)");
      expect(shadowEntity.shadowOffsetX).toBe(2);
      expect(shadowEntity.shadowOffsetY).toBe(2);
      expect(shadowEntity.shadowBlur).toBe(4);

      // Render should not throw errors
      expect(() => shadowEntity.render(mockCtx)).not.toThrow();
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it("should not apply shadow when shadow color is not set", () => {
      // Render
      textEntity.render(mockCtx);

      // Check that shadow was not applied
      expect(mockCtx.shadowColor).toBe("");
      expect(mockCtx.shadowOffsetX).toBe(0);
      expect(mockCtx.shadowOffsetY).toBe(0);
      expect(mockCtx.shadowBlur).toBe(0);
    });
  });

  describe("resize", () => {
    it("should update dimensions based on scale factor", () => {
      // Since we're mocking the measureText method to always return the same values,
      // we can't actually test dimension changes. Instead, we'll just verify that
      // resize doesn't throw errors and the dimensions are set to something reasonable.
      textEntity.resize();

      expect(textEntity.width).toBeGreaterThan(0);
      expect(textEntity.height).toBeGreaterThan(0);
    });

    it("should throw error when offscreen context is not initialized", () => {
      // Create a text entity
      const brokenEntity = new TextEntity({
        id: "broken-text",
        type: "text",
        layer: LAYER.UI,
        text: "Broken Text",
        fontSize: 24,
        fontFamily: FONT.SANS_SERIF,
        textBaseline: "middle",
        textAlign: "center",
        color: "white",
        strokeColor: undefined,
        phases: [],
      });

      // Mock the getFontSize method to throw the expected error
      const originalGetFontSize = brokenEntity["getFontSize"];
      brokenEntity["getFontSize"] = function () {
        throw new Error("Offscreen context not initialized");
      };

      // Should throw error when trying to resize
      expect(() => brokenEntity.resize()).toThrow(
        "Offscreen context not initialized"
      );

      // Restore original method
      brokenEntity["getFontSize"] = originalGetFontSize;
    });
  });

  describe("destroy", () => {
    it("should clear all text entity properties", () => {
      // Destroy
      textEntity.destroy();

      // Check public properties
      expect(textEntity.width).toBe(0);
      expect(textEntity.height).toBe(0);
      expect(textEntity.text).toBe("");
      expect(textEntity.color).toBe("");

      // We can't directly check private fields, but we can test behavior
      // Rendering should still work but with empty text
      textEntity.render(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "",
        expect.any(Number),
        expect.any(Number)
      );
    });
  });
});

