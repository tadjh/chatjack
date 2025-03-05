import { Layer } from "@/lib/canvas/layer";
import { DynamicLayer } from "@/lib/canvas/layer.dynamic";
import { LAYER, POSITION } from "@/lib/canvas/types";
import { TextEntity } from "@/lib/canvas/entity.text";
import { SpriteEntity } from "@/lib/canvas/entity.sprite";
import { FONT, IMAGE } from "@/lib/canvas/constants";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Create a concrete implementation of Layer for testing
class TestLayer extends Layer {
  constructor(id: LAYER, canvas: HTMLCanvasElement) {
    super(id, "static", canvas);
  }

  render(): void {
    this.clearRect();
    this.forEach((entity) => {
      entity.render(this.ctx);
    });
  }

  update(): void {
    this.shouldUpdate = false;
  }
}

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

describe("Layer", () => {
  let canvas: HTMLCanvasElement;
  let dynamicCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;
  let mockDynamicCtx: CanvasRenderingContext2D;
  let layer: TestLayer;
  let dynamicLayer: DynamicLayer;

  beforeEach(() => {
    // Mock canvas and context for TestLayer
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

    // Mock canvas and context for DynamicLayer
    dynamicCanvas = document.createElement("canvas");
    mockDynamicCtx = {
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

    // Mock getContext for TestLayer
    vi.spyOn(canvas, "getContext").mockReturnValue(mockCtx);

    // Mock getContext for DynamicLayer
    vi.spyOn(dynamicCanvas, "getContext").mockReturnValue(mockDynamicCtx);

    // Create layer instances
    layer = new TestLayer(LAYER.UI, canvas);
    dynamicLayer = new DynamicLayer(LAYER.GAME, dynamicCanvas);

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
    expect(layer).toBeDefined();
    expect(layer.id).toBe(LAYER.UI);
    expect(layer.type).toBe("static");
    expect(layer.shouldUpdate).toBe(true);
    expect(layer.shouldRender).toBe(true);
    expect(canvas.style.position).toBe("absolute");
    expect(canvas.style.top).toBe("0px");
    expect(canvas.style.left).toBe("0px");
    expect(canvas.style.zIndex).toBe("2");
  });

  it("should throw an error if 2d context is not supported", () => {
    vi.spyOn(canvas, "getContext").mockReturnValue(null);

    expect(() => new TestLayer(LAYER.UI, canvas)).toThrow(
      "2d rendering context not supported"
    );
  });

  it("should clear the canvas", () => {
    layer.clear();

    expect(mockCtx.clearRect).toHaveBeenCalledWith(
      0,
      0,
      window.innerWidth,
      window.innerHeight
    );
    expect(layer.size).toBe(0);
    expect(layer.shouldUpdate).toBe(true);
    expect(layer.shouldRender).toBe(true);
  });

  it("should resize the canvas", () => {
    const ratio = window.devicePixelRatio;

    layer.resize();

    expect(canvas.width).toBe(window.innerWidth * ratio);
    expect(canvas.height).toBe(window.innerHeight * ratio);
    expect(canvas.style.width).toBe(`${window.innerWidth}px`);
    expect(canvas.style.height).toBe(`${window.innerHeight}px`);
    expect(mockCtx.scale).toHaveBeenCalledWith(ratio, ratio);
  });

  it("should request update", () => {
    layer.shouldUpdate = false;
    layer.shouldRender = false;

    layer.requestUpdate();

    expect(layer.shouldUpdate).toBe(true);
    expect(layer.shouldRender).toBe(true);
  });

  it("should filter entities by type", () => {
    // Create test entities
    const textEntity = new TextEntity({
      id: "text1",
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
      id: "sprite1",
      type: "sprite",
      position: POSITION.CENTER,
      layer: LAYER.UI,
      src: IMAGE.CARDS,
      sprites: [{ x: 0, y: 0 }],
      spriteWidth: 32,
      spriteHeight: 32,
    });

    // Add entities to layer
    layer.set(textEntity.id, textEntity);
    layer.set(spriteEntity.id, spriteEntity);

    // Test getByType
    const textEntities = layer.getByType("text");
    const spriteEntities = layer.getByType("sprite");

    expect(textEntities.length).toBe(1);
    expect(textEntities[0].id).toBe("text1");
    expect(spriteEntities.length).toBe(1);
    expect(spriteEntities[0].id).toBe("sprite1");
  });

  it("should render entities", () => {
    // Create a mock TextEntity
    const mockTextEntity = new TextEntity({
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
    layer.set(mockTextEntity.id, mockTextEntity);

    // Render the layer
    layer.render();

    // Verify clearRect was called
    expect(mockCtx.clearRect).toHaveBeenCalled();

    // Verify entity's render method was called
    expect(mockTextEntity.render).toHaveBeenCalledWith(mockCtx);
  });

  it("should update entities in dynamic layer", () => {
    // Create a TextEntity
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
      layer: LAYER.GAME,
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Add entity to dynamic layer
    dynamicLayer.set(textEntity.id, textEntity);

    // Update the layer
    dynamicLayer.update();

    // Verify entity's update method was called
    expect(textEntity.update).toHaveBeenCalled();
    expect(textEntity.startTime).toBeGreaterThan(0);
  });

  it("should handle delayed entities in dynamic layer", () => {
    // Create a TextEntity with delay
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
      layer: LAYER.GAME,
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Set delay
    textEntity.delay = 10;

    // Add entity to dynamic layer
    dynamicLayer.set(textEntity.id, textEntity);

    // Update the layer
    dynamicLayer.update();

    // Verify entity's update method was not called
    expect(textEntity.update).not.toHaveBeenCalled();
    expect(textEntity.delay).toBe(9); // Delay should be decremented
    expect(textEntity.props.opacity).toBe(0);
  });

  it("should handle action entity separately in dynamic layer", () => {
    // Create a regular entity
    const regularEntity = new TextEntity({
      id: "regular",
      type: "text",
      text: "Regular",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      position: POSITION.TOP,
      layer: LAYER.GAME,
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Create an action entity
    const actionEntity = new TextEntity({
      id: "action-text",
      type: "text",
      text: "Action",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      position: POSITION.TOP,
      layer: LAYER.GAME,
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Add entities to dynamic layer
    dynamicLayer.set(regularEntity.id, regularEntity);
    dynamicLayer.set(actionEntity.id, actionEntity);

    // Render the layer
    dynamicLayer.render();

    // Verify entities' render methods were called
    expect(regularEntity.render).toHaveBeenCalledWith(mockDynamicCtx);
    expect(actionEntity.render).toHaveBeenCalledWith(mockDynamicCtx);
  });

  it("should not render delayed entities", () => {
    // Create a TextEntity with delay
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
      layer: LAYER.GAME,
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Set delay
    textEntity.delay = 10;

    // Add entity to dynamic layer
    dynamicLayer.set(textEntity.id, textEntity);

    // Render the layer
    dynamicLayer.render();

    // Verify entity's render method was not called
    expect(textEntity.render).not.toHaveBeenCalled();
  });
});

