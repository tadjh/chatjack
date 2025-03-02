import { DynamicLayer } from "@/lib/canvas/layer.dynamic";
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

describe("DynamicLayer", () => {
  let canvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;
  let dynamicLayer: DynamicLayer;

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

    // Mock performance.now()
    vi.spyOn(performance, "now").mockReturnValue(1000);

    // Create layer instance
    dynamicLayer = new DynamicLayer(LAYER.GAME, canvas);

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
    expect(dynamicLayer).toBeDefined();
    expect(dynamicLayer.id).toBe(LAYER.GAME);
    expect(dynamicLayer.type).toBe("dynamic");
    expect(dynamicLayer.shouldUpdate).toBe(true);
    expect(dynamicLayer.shouldRender).toBe(true);
    expect(canvas.style.position).toBe("absolute");
    expect(canvas.style.top).toBe("0px");
    expect(canvas.style.left).toBe("0px");
    expect(canvas.style.zIndex).toBe("1");
  });

  it("should update entities with no delay", () => {
    // Create a TextEntity with no delay
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
      phases: [],
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Add entity to layer
    dynamicLayer.set(textEntity.id, textEntity);

    // Update the layer
    dynamicLayer.update();

    // Verify entity's update method was called
    expect(textEntity.update).toHaveBeenCalled();
    expect(textEntity.startTime).toBe(1000); // Should be set to performance.now()
  });

  it("should handle entities with delay", () => {
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
      phases: [],
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Set delay
    textEntity.delay = 5;

    // Add entity to layer
    dynamicLayer.set(textEntity.id, textEntity);

    // Update the layer
    dynamicLayer.update();

    // Verify entity's update method was not called
    expect(textEntity.update).not.toHaveBeenCalled();
    expect(textEntity.delay).toBe(4); // Delay should be decremented
    expect(textEntity.props.opacity).toBe(0);
  });

  it("should render entities with no delay", () => {
    // Create a TextEntity with no delay
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
      phases: [],
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Add entity to layer
    dynamicLayer.set(textEntity.id, textEntity);

    // Render the layer
    dynamicLayer.render();

    // Verify clearRect was called
    expect(mockCtx.clearRect).toHaveBeenCalledWith(
      0,
      0,
      window.innerWidth,
      window.innerHeight
    );

    // Verify entity's render method was called
    expect(textEntity.render).toHaveBeenCalledWith(mockCtx);
  });

  it("should not render entities with delay", () => {
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
      phases: [],
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Set delay
    textEntity.delay = 5;

    // Add entity to layer
    dynamicLayer.set(textEntity.id, textEntity);

    // Render the layer
    dynamicLayer.render();

    // Verify entity's render method was not called
    expect(textEntity.render).not.toHaveBeenCalled();
  });

  it("should render action entity last", () => {
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
      phases: [],
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
      phases: [],
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Add entities to layer
    dynamicLayer.set(regularEntity.id, regularEntity);
    dynamicLayer.set(actionEntity.id, actionEntity);

    // Create spies to track render order
    const regularRenderSpy = vi.spyOn(regularEntity, "render");
    const actionRenderSpy = vi.spyOn(actionEntity, "render");

    // Render the layer
    dynamicLayer.render();

    // Verify both entities' render methods were called
    expect(regularRenderSpy).toHaveBeenCalledWith(mockCtx);
    expect(actionRenderSpy).toHaveBeenCalledWith(mockCtx);

    // Verify action entity was rendered after regular entity
    expect(regularRenderSpy.mock.invocationCallOrder[0]).toBeLessThan(
      actionRenderSpy.mock.invocationCallOrder[0]
    );
  });

  it("should handle multiple entities with different delays", () => {
    // Create entities with different delays
    const noDelayEntity = new TextEntity({
      id: "noDelay",
      type: "text",
      text: "No Delay",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      position: POSITION.TOP,
      layer: LAYER.GAME,
      phases: [],
      strokeColor: "black",
      strokeWidth: 1,
    });

    const delayedEntity = new TextEntity({
      id: "delayed",
      type: "text",
      text: "Delayed",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      position: POSITION.BOTTOM,
      layer: LAYER.GAME,
      phases: [],
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Set delay for the delayed entity
    delayedEntity.delay = 3;

    // Add entities to layer
    dynamicLayer.set(noDelayEntity.id, noDelayEntity);
    dynamicLayer.set(delayedEntity.id, delayedEntity);

    // Update the layer
    dynamicLayer.update();

    // Verify only the no-delay entity was updated
    expect(noDelayEntity.update).toHaveBeenCalled();
    expect(delayedEntity.update).not.toHaveBeenCalled();
    expect(delayedEntity.delay).toBe(2);

    // Render the layer
    dynamicLayer.render();

    // Verify only the no-delay entity was rendered
    expect(noDelayEntity.render).toHaveBeenCalledWith(mockCtx);
    expect(delayedEntity.render).not.toHaveBeenCalled();
  });

  it("should resize the canvas and all entities", () => {
    // Create entities
    const entity1 = new TextEntity({
      id: "entity1",
      type: "text",
      text: "Entity 1",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      position: POSITION.TOP,
      layer: LAYER.GAME,
      phases: [],
      strokeColor: "black",
      strokeWidth: 1,
    });

    const entity2 = new SpriteEntity({
      id: "entity2",
      type: "sprite",
      position: POSITION.CENTER,
      layer: LAYER.GAME,
      phases: [],
      src: IMAGE.CARDS,
      sprites: [{ x: 0, y: 0 }],
      spriteWidth: 32,
      spriteHeight: 32,
    });

    // Add entities to layer
    dynamicLayer.set(entity1.id, entity1);
    dynamicLayer.set(entity2.id, entity2);

    // Resize the layer
    dynamicLayer.resize();

    // Verify canvas dimensions were set correctly
    const ratio = window.devicePixelRatio;
    expect(canvas.width).toBe(window.innerWidth * ratio);
    expect(canvas.height).toBe(window.innerHeight * ratio);
    expect(canvas.style.width).toBe(`${window.innerWidth}px`);
    expect(canvas.style.height).toBe(`${window.innerHeight}px`);

    // Verify scale was called
    expect(mockCtx.scale).toHaveBeenCalledWith(ratio, ratio);

    // Verify entities' resize methods were called
    expect(entity1.resize).toHaveBeenCalled();
    expect(entity2.resize).toHaveBeenCalled();
  });

  it("should clear all entities and the canvas", () => {
    // Create entities
    const entity1 = new TextEntity({
      id: "entity1",
      type: "text",
      text: "Entity 1",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      position: POSITION.TOP,
      layer: LAYER.GAME,
      phases: [],
      strokeColor: "black",
      strokeWidth: 1,
    });

    const entity2 = new SpriteEntity({
      id: "entity2",
      type: "sprite",
      position: POSITION.CENTER,
      layer: LAYER.GAME,
      phases: [],
      src: IMAGE.CARDS,
      sprites: [{ x: 0, y: 0 }],
      spriteWidth: 32,
      spriteHeight: 32,
    });

    // Add entities to layer
    dynamicLayer.set(entity1.id, entity1);
    dynamicLayer.set(entity2.id, entity2);
    expect(dynamicLayer.size).toBe(2);

    // Clear the layer
    dynamicLayer.clear();

    // Verify clearRect was called
    expect(mockCtx.clearRect).toHaveBeenCalledWith(
      0,
      0,
      window.innerWidth,
      window.innerHeight
    );

    // Verify all entities were removed
    expect(dynamicLayer.size).toBe(0);

    // Verify update flags were set
    expect(dynamicLayer.shouldUpdate).toBe(true);
    expect(dynamicLayer.shouldRender).toBe(true);
  });
});

