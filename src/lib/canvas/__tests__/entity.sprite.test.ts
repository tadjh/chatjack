import { SpriteEntity, SpriteEntityProps } from "@/lib/canvas/entity.sprite";
import { LAYER, POSITION } from "@/lib/canvas/types";
import { IMAGE } from "@/lib/canvas/constants";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("SpriteEntity", () => {
  let spriteEntity: SpriteEntity;
  let mockCtx: CanvasRenderingContext2D;
  let onBeginSpy: ReturnType<typeof vi.fn>;
  let onEndSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock canvas context
    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
      globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D;

    onBeginSpy = vi.fn();
    onEndSpy = vi.fn();

    // Create a test sprite entity
    const entityProps: SpriteEntityProps = {
      id: "test-sprite",
      type: "sprite",
      layer: LAYER.UI,
      position: POSITION.CENTER,
      src: IMAGE.CARDS,
      sprites: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
      spriteWidth: 100,
      spriteHeight: 150,
      scale: 1,
      phases: [
        {
          name: "flip-over",
          duration: 1,
        },
      ],
      onBegin: onBeginSpy,
      onEnd: onEndSpy,
    };

    spriteEntity = new SpriteEntity(entityProps);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with the correct values", () => {
      expect(spriteEntity.id).toBe("test-sprite");
      expect(spriteEntity.type).toBe("sprite");
      expect(spriteEntity.layer).toBe(LAYER.UI);
      expect(spriteEntity.position).toBe(POSITION.CENTER);
      expect(spriteEntity.src).toBe(IMAGE.CARDS);
      expect(spriteEntity.spriteWidth).toBe(100);
      expect(spriteEntity.spriteHeight).toBe(150);
      expect(spriteEntity.scale).toBe(1);
    });

    it("should use default values when not provided", () => {
      const minimalEntity = new SpriteEntity({
        id: "minimal-sprite",
        type: "sprite",
        layer: LAYER.BG,
        src: IMAGE.CARDS,
        sprites: [{ x: 0, y: 0 }],
        spriteWidth: 50,
        spriteHeight: 75,
        phases: [],
      });

      expect(minimalEntity.position).toBe(POSITION.TOP_LEFT); // Default position
      expect(minimalEntity.scale).toBe(1); // Default scale
      expect(minimalEntity.angle).toBe(0); // Default angle
    });
  });

  describe("sprite management", () => {
    it("should get sprite count correctly", () => {
      expect(spriteEntity.getSpriteCount()).toBe(2);
    });

    it("should get sprite by index", () => {
      const sprite = spriteEntity.getSprite(0);
      expect(sprite).toEqual({ x: 0, y: 0 });

      const sprite2 = spriteEntity.getSprite(1);
      expect(sprite2).toEqual({ x: 100, y: 0 });
    });

    it("should throw error when getting sprite with invalid index", () => {
      expect(() => spriteEntity.getSprite(5)).toThrow(
        "Sprite index out of bounds"
      );
    });

    it("should set sprite coordinates", () => {
      spriteEntity.setSprite(0, { x: 50, y: 50 });
      const sprite = spriteEntity.getSprite(0);
      expect(sprite).toEqual({ x: 50, y: 50 });
    });

    it("should throw error when setting sprite with invalid index", () => {
      expect(() => spriteEntity.setSprite(5, { x: 0, y: 0 })).toThrow(
        "Sprite index out of bounds"
      );
    });

    it("should add new sprite", () => {
      const initialCount = spriteEntity.getSpriteCount();
      spriteEntity.addSprite({ x: 200, y: 0 });
      expect(spriteEntity.getSpriteCount()).toBe(initialCount + 1);
      expect(spriteEntity.getSprite(initialCount)).toEqual({ x: 200, y: 0 });
    });

    it("should add new sprite and set it as active", () => {
      spriteEntity.addSprite({ x: 200, y: 0 }, true);
      expect(spriteEntity.props.spriteIndex).toBe(2); // Index of the newly added sprite
    });
  });

  describe("bitmap management", () => {
    it("should set bitmaps", () => {
      const mockBitmaps = [{} as ImageBitmap, {} as ImageBitmap];
      spriteEntity.setBitmaps(mockBitmaps);

      // We can't directly test private fields, but we can test the behavior
      // by rendering and checking if drawImage was called
      spriteEntity.render(mockCtx);
      expect(mockCtx.drawImage).toHaveBeenCalled();
    });

    it("should create image bitmap", () => {
      const mockImage = new Image();
      const mockSpritesheets = new Map<string, HTMLImageElement>();
      mockSpritesheets.set(IMAGE.CARDS, mockImage);

      // Mock OffscreenCanvas and its context
      const mockOffscreenCanvas = {
        getContext: vi.fn().mockReturnValue({
          drawImage: vi.fn(),
          imageSmoothingEnabled: false,
        }),
        transferToImageBitmap: vi.fn().mockReturnValue({} as ImageBitmap),
      };

      // We need to mock OffscreenCanvas for the test
      global.OffscreenCanvas = vi
        .fn()
        .mockImplementation(() => mockOffscreenCanvas);

      const bitmap = spriteEntity.createImageBitmap(mockSpritesheets, 0);
      expect(bitmap).toBeDefined();
    });

    it("should throw error when image is not found", () => {
      const mockSpritesheets = new Map<string, HTMLImageElement>();
      expect(() => spriteEntity.createImageBitmap(mockSpritesheets, 0)).toThrow(
        "Image not found"
      );
    });
  });

  describe("animation", () => {
    it("should handle flip-over animation", () => {
      // Create entity with flip-over animation
      const flipEntity = new SpriteEntity({
        id: "flip-entity",
        type: "sprite",
        layer: LAYER.UI,
        src: IMAGE.CARDS,
        sprites: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 200, y: 0 },
        ],
        spriteWidth: 100,
        spriteHeight: 150,
        phases: [
          {
            name: "flip-over",
            duration: 1,
          },
        ],
      });

      // Set progress to halfway
      const flipEntityInstance = flipEntity as unknown as { progress: number };
      flipEntityInstance.progress = 0.5;
      flipEntity.update();

      // Should have updated sprite index based on progress
      expect(flipEntity.props.spriteIndex).toBe(1); // Middle sprite
    });

    it("should handle animated-float-y animation", () => {
      // Create entity with animated-float-y animation
      const floatEntity = new SpriteEntity({
        id: "float-entity",
        type: "sprite",
        layer: LAYER.UI,
        src: IMAGE.CARDS,
        sprites: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 200, y: 0 },
        ],
        spriteWidth: 100,
        spriteHeight: 150,
        phases: [
          {
            name: "animated-float-y",
            duration: 1,
            magnitude: 10,
          },
        ],
      });

      // Initial state
      const initialOffsetY = floatEntity.props.offsetY;

      // Update animation
      floatEntity.update();

      // Should have updated offsetY and possibly sprite index
      expect(floatEntity.props.offsetY).not.toBe(initialOffsetY);
      // We can't predict exact sprite index as it depends on timing, but it should be valid
      expect(floatEntity.props.spriteIndex).toBeGreaterThanOrEqual(0);
      expect(floatEntity.props.spriteIndex).toBeLessThan(3);
    });
  });

  describe("rendering", () => {
    it("should not render when no bitmaps are available", () => {
      spriteEntity.render(mockCtx);
      expect(mockCtx.drawImage).not.toHaveBeenCalled();
    });

    it("should render with correct transformations", () => {
      // Set bitmaps
      const mockBitmaps = [{} as ImageBitmap, {} as ImageBitmap];
      spriteEntity.setBitmaps(mockBitmaps);

      // Render
      spriteEntity.render(mockCtx);

      // Check that context methods were called
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.translate).toHaveBeenCalled();
      expect(mockCtx.drawImage).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it("should apply flipping when sprite has flip flags", () => {
      // Create entity with flipped sprite
      const flipEntity = new SpriteEntity({
        id: "flip-entity",
        type: "sprite",
        layer: LAYER.UI,
        src: IMAGE.CARDS,
        sprites: [{ x: 0, y: 0, flipX: true, flipY: false }],
        spriteWidth: 100,
        spriteHeight: 150,
        phases: [],
      });

      // Set bitmaps
      const mockBitmaps = [{} as ImageBitmap];
      flipEntity.setBitmaps(mockBitmaps);

      // Render
      flipEntity.render(mockCtx);

      // Check that scale was called for flipping
      expect(mockCtx.scale).toHaveBeenCalledWith(-1, 1);
    });

    it("should apply rotation when angle is set", () => {
      // Create entity with rotation
      const rotateEntity = new SpriteEntity({
        id: "rotate-entity",
        type: "sprite",
        layer: LAYER.UI,
        src: IMAGE.CARDS,
        sprites: [{ x: 0, y: 0 }],
        spriteWidth: 100,
        spriteHeight: 150,
        angle: Math.PI / 4, // 45 degrees
        phases: [],
      });

      // Set bitmaps
      const mockBitmaps = [{} as ImageBitmap];
      rotateEntity.setBitmaps(mockBitmaps);

      // Render
      rotateEntity.render(mockCtx);

      // Check that rotate was called
      expect(mockCtx.rotate).toHaveBeenCalledWith(Math.PI / 4);
    });
  });

  describe("resize", () => {
    it("should update dimensions based on scale factor", () => {
      const initialWidth = spriteEntity.width;
      const initialHeight = spriteEntity.height;

      // Mock window resize
      Object.defineProperty(window, "innerWidth", { value: 2048 });
      Object.defineProperty(window, "innerHeight", { value: 1536 });

      // Resize
      spriteEntity.resize();

      // Dimensions should change based on scale factor
      expect(spriteEntity.width).not.toBe(initialWidth);
      expect(spriteEntity.height).not.toBe(initialHeight);
    });
  });

  describe("destroy", () => {
    it("should clear all sprite entity properties", () => {
      // Set bitmaps
      const mockBitmaps = [{} as ImageBitmap, {} as ImageBitmap];
      spriteEntity.setBitmaps(mockBitmaps);

      // Destroy
      spriteEntity.destroy();

      // Check public properties
      expect(spriteEntity.width).toBe(0);
      expect(spriteEntity.height).toBe(0);

      // We can't directly check private fields, but we can test behavior
      // Rendering should not draw anything after destroy
      spriteEntity.render(mockCtx);
      expect(mockCtx.drawImage).not.toHaveBeenCalled();

      // Sprite count should be reset to 1 (empty sprite)
      expect(spriteEntity.getSpriteCount()).toBe(1);
      expect(spriteEntity.getSprite(0)).toEqual({});
    });
  });

  describe("static methods", () => {
    it("should format sprite ID correctly", () => {
      const id = SpriteEntity.formatSpriteId(IMAGE.CARDS, 100, 200);
      expect(id).toBe(`${IMAGE.CARDS}-sprite-x-100-y-200`);
    });
  });
});

