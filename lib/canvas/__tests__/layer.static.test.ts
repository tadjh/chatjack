import { StaticLayer } from "@/lib/canvas/layer.static";
import { LAYER, POSITION } from "@/lib/canvas/types";
import { TextEntity } from "@/lib/canvas/entity.text";
import { SpriteEntity } from "@/lib/canvas/entity.sprite";
import { FONT, IMAGE } from "@/lib/canvas/constants";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock TextEntity to avoid OffscreenCanvas issues
vi.mock("@/lib/canvas/entity.text", () => {
  return {
    TextEntity: vi.fn().mockImplementation((props) => {
      return {
        id: props.id,
        type: props.type,
        text: props.text,
        position: props.position,
        layer: props.layer,
        height: 20,
        width: 100,
        x: props.x || 0,
        y: props.y || 0,
        startTime: 0,
        delay: 0,
        props: { opacity: 1 },
        render: vi.fn(),
        update: vi.fn(),
        resize: vi.fn(),
      };
    }),
  };
});

// Mock SpriteEntity
vi.mock("@/lib/canvas/entity.sprite", () => {
  return {
    SpriteEntity: vi.fn().mockImplementation((props) => {
      return {
        id: props.id,
        type: props.type,
        position: props.position,
        layer: props.layer,
        height: 32,
        width: 32,
        x: props.x || 0,
        y: props.y || 0,
        render: vi.fn(),
        update: vi.fn(),
        resize: vi.fn(),
      };
    }),
  };
});

describe("StaticLayer", () => {
  let canvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;
  let staticLayer: StaticLayer;

  beforeEach(() => {
    // Mock canvas and context
    canvas = document.createElement("canvas");
    mockCtx = {
      clearRect: vi.fn(),
      scale: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      drawImage: vi.fn(),
      imageSmoothingEnabled: false,
    } as unknown as CanvasRenderingContext2D;

    // Mock getContext
    vi.spyOn(canvas, "getContext").mockReturnValue(mockCtx);

    // Create layer instance
    staticLayer = new StaticLayer(LAYER.UI, canvas);

    // Mock window dimensions
    Object.defineProperty(window, "innerWidth", {
      value: 1024,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 768,
      writable: true,
    });
    Object.defineProperty(window, "devicePixelRatio", {
      value: 1,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize correctly", () => {
    expect(staticLayer).toBeDefined();
    expect(staticLayer.id).toBe(LAYER.UI);
    expect(staticLayer.type).toBe("static");
    expect(staticLayer.shouldUpdate).toBe(true);
    expect(staticLayer.shouldRender).toBe(true);
    expect(canvas.style.position).toBe("absolute");
    expect(canvas.style.top).toBe("0px");
    expect(canvas.style.left).toBe("0px");
    expect(canvas.style.zIndex).toBe("2");
  });

  it("should set shouldUpdate to false when update is called", () => {
    staticLayer.update();
    expect(staticLayer.shouldUpdate).toBe(false);
  });

  it("should clear the canvas and render entities", () => {
    // Create a mock TextEntity
    const textEntity = new TextEntity({
      id: "test",
      type: "text",
      text: "Test",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      position: POSITION.TOP,
      layer: LAYER.UI,
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Add entity to layer
    staticLayer.set(textEntity.id, textEntity);

    // Render the layer
    staticLayer.render();

    // Verify clearRect was called
    expect(mockCtx.clearRect).toHaveBeenCalledWith(
      0,
      0,
      window.innerWidth,
      window.innerHeight
    );

    // Verify entity's render method was called
    expect(textEntity.render).toHaveBeenCalledWith(mockCtx);

    // Verify shouldRender is set to false after rendering
    expect(staticLayer.shouldRender).toBe(false);
  });

  it("should resize the canvas and all entities", () => {
    // Create a mock entity
    const textEntity = new TextEntity({
      id: "test",
      type: "text",
      text: "Test",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      position: POSITION.TOP,
      layer: LAYER.UI,
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Add entity to layer
    staticLayer.set(textEntity.id, textEntity);

    // Resize the layer
    staticLayer.resize();

    // Verify canvas dimensions were set correctly
    const ratio = window.devicePixelRatio;
    expect(canvas.width).toBe(window.innerWidth * ratio);
    expect(canvas.height).toBe(window.innerHeight * ratio);
    expect(canvas.style.width).toBe(`${window.innerWidth}px`);
    expect(canvas.style.height).toBe(`${window.innerHeight}px`);

    // Verify scale was called
    expect(mockCtx.scale).toHaveBeenCalledWith(ratio, ratio);

    // Verify entity's resize method was called
    expect(textEntity.resize).toHaveBeenCalled();
  });

  it("should clear all entities and the canvas", () => {
    // Create a mock entity
    const textEntity = new TextEntity({
      id: "test",
      type: "text",
      text: "Test",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      position: POSITION.TOP,
      layer: LAYER.UI,
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Add entity to layer
    staticLayer.set(textEntity.id, textEntity);
    expect(staticLayer.size).toBe(1);

    // Clear the layer
    staticLayer.clear();

    // Verify clearRect was called
    expect(mockCtx.clearRect).toHaveBeenCalledWith(
      0,
      0,
      window.innerWidth,
      window.innerHeight
    );

    // Verify all entities were removed
    expect(staticLayer.size).toBe(0);

    // Verify update flags were set
    expect(staticLayer.shouldUpdate).toBe(true);
    expect(staticLayer.shouldRender).toBe(true);
  });

  it("should handle multiple entities", () => {
    // Create multiple entities
    const textEntity = new TextEntity({
      id: "text",
      type: "text",
      text: "Test",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      position: POSITION.TOP,
      layer: LAYER.UI,
      strokeColor: "black",
      strokeWidth: 1,
    });

    const spriteEntity = new SpriteEntity({
      id: "sprite",
      type: "sprite",
      position: POSITION.CENTER,
      layer: LAYER.UI,
      src: IMAGE.CARDS,
      sprites: [{ x: 0, y: 0 }],
      spriteWidth: 32,
      spriteHeight: 32,
    });

    // Add entities to layer
    staticLayer.set(textEntity.id, textEntity);
    staticLayer.set(spriteEntity.id, spriteEntity);

    // Verify entities were added
    expect(staticLayer.size).toBe(2);

    // Render the layer
    staticLayer.render();

    // Verify both entities' render methods were called
    expect(textEntity.render).toHaveBeenCalledWith(mockCtx);
    expect(spriteEntity.render).toHaveBeenCalledWith(mockCtx);
  });
});

