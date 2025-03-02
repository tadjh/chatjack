import { LayerManager } from "@/lib/canvas/layer-manager";
import { LayoutManager } from "@/lib/canvas/layout-manager";
import { StaticLayer } from "@/lib/canvas/layer.static";
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

// Mock LayoutManager
vi.mock("@/lib/canvas/layout-manager", () => {
  return {
    LayoutManager: vi.fn().mockImplementation(() => {
      return {
        update: vi.fn(),
      };
    }),
  };
});

describe("LayerManager", () => {
  let layerManager: LayerManager;
  let mockLayoutManager: LayoutManager;
  let bgCanvas: HTMLCanvasElement;
  let gameCanvas: HTMLCanvasElement;
  let uiCanvas: HTMLCanvasElement;
  let bgLayer: StaticLayer;
  let gameLayer: DynamicLayer;
  let uiLayer: StaticLayer;
  let mockBgCtx: CanvasRenderingContext2D;
  let mockGameCtx: CanvasRenderingContext2D;
  let mockUiCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    // Mock canvases and contexts
    bgCanvas = document.createElement("canvas");
    gameCanvas = document.createElement("canvas");
    uiCanvas = document.createElement("canvas");

    mockBgCtx = {
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

    mockGameCtx = {
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

    mockUiCtx = {
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
    vi.spyOn(bgCanvas, "getContext").mockReturnValue(mockBgCtx);
    vi.spyOn(gameCanvas, "getContext").mockReturnValue(mockGameCtx);
    vi.spyOn(uiCanvas, "getContext").mockReturnValue(mockUiCtx);

    // Create layer instances
    bgLayer = new StaticLayer(LAYER.BG, bgCanvas);
    gameLayer = new DynamicLayer(LAYER.GAME, gameCanvas);
    uiLayer = new StaticLayer(LAYER.UI, uiCanvas);

    // Mock performance.now()
    vi.spyOn(performance, "now").mockReturnValue(1000);

    // Create layout manager
    mockLayoutManager = new LayoutManager();

    // Create layer manager
    layerManager = new LayerManager(mockLayoutManager);

    // Add layers to layer manager
    layerManager.set(LAYER.BG, bgLayer);
    layerManager.set(LAYER.GAME, gameLayer);
    layerManager.set(LAYER.UI, uiLayer);

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
    expect(layerManager).toBeDefined();
    expect(layerManager.size).toBe(3);
    expect(layerManager.get(LAYER.BG)).toBe(bgLayer);
    expect(layerManager.get(LAYER.GAME)).toBe(gameLayer);
    expect(layerManager.get(LAYER.UI)).toBe(uiLayer);
  });

  it("should get entity by id", () => {
    // Create a text entity
    const textEntity = new TextEntity({
      id: "test-text",
      type: "text",
      text: "Test",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      position: POSITION.TOP,
      layer: LAYER.UI,
      phases: [],
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Add entity to UI layer
    uiLayer.set(textEntity.id, textEntity);

    // Get entity by id
    const retrievedEntity = layerManager.getEntityById(LAYER.UI, "test-text");

    // Verify entity was retrieved correctly
    expect(retrievedEntity).toBe(textEntity);
  });

  it("should check if entity exists by id", () => {
    // Create a text entity
    const textEntity = new TextEntity({
      id: "test-text",
      type: "text",
      text: "Test",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      position: POSITION.TOP,
      layer: LAYER.UI,
      phases: [],
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Add entity to UI layer
    uiLayer.set(textEntity.id, textEntity);

    // Check if entity exists
    const exists = layerManager.hasEntityById(LAYER.UI, "test-text");
    const doesNotExist = layerManager.hasEntityById(LAYER.UI, "non-existent");

    // Verify results
    expect(exists).toBe(true);
    expect(doesNotExist).toBe(false);
  });

  it("should set entity and request update for text entities", () => {
    // Create a text entity
    const textEntity = new TextEntity({
      id: "test-text",
      type: "text",
      text: "Test",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      position: POSITION.TOP,
      layer: LAYER.UI,
      phases: [],
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Spy on requestUpdate
    const requestUpdateSpy = vi.spyOn(layerManager, "requestUpdate");

    // Set entity
    layerManager.setEntity(textEntity);

    // Verify entity was added to the correct layer
    expect(uiLayer.get("test-text")).toBe(textEntity);

    // Verify requestUpdate was called
    expect(requestUpdateSpy).toHaveBeenCalled();
  });

  it("should set entity without requesting update for non-text entities", () => {
    // Create a sprite entity
    const spriteEntity = new SpriteEntity({
      id: "test-sprite",
      type: "sprite",
      position: POSITION.CENTER,
      layer: LAYER.GAME,
      phases: [],
      src: IMAGE.CARDS,
      sprites: [{ x: 0, y: 0 }],
      spriteWidth: 32,
      spriteHeight: 32,
    });

    // Spy on requestUpdate
    const requestUpdateSpy = vi.spyOn(layerManager, "requestUpdate");

    // Set entity
    layerManager.setEntity(spriteEntity);

    // Verify entity was added to the correct layer
    expect(gameLayer.get("test-sprite")).toBe(spriteEntity);

    // Verify requestUpdate was not called
    expect(requestUpdateSpy).not.toHaveBeenCalled();
  });

  it("should remove entity by id", () => {
    // Create a text entity
    const textEntity = new TextEntity({
      id: "test-text",
      type: "text",
      text: "Test",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      position: POSITION.TOP,
      layer: LAYER.UI,
      phases: [],
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Add entity to UI layer
    uiLayer.set(textEntity.id, textEntity);

    // Verify entity exists
    expect(uiLayer.has("test-text")).toBe(true);

    // Remove entity
    layerManager.removeEntity(LAYER.UI, "test-text");

    // Verify entity was removed
    expect(uiLayer.has("test-text")).toBe(false);
  });

  it("should get entities by type", () => {
    // Create a text entity in UI layer
    const textEntity1 = new TextEntity({
      id: "text1",
      type: "text",
      text: "Test 1",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      position: POSITION.TOP,
      layer: LAYER.UI,
      phases: [],
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Create a text entity in GAME layer
    const textEntity2 = new TextEntity({
      id: "text2",
      type: "text",
      text: "Test 2",
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

    // Create a sprite entity
    const spriteEntity = new SpriteEntity({
      id: "sprite",
      type: "sprite",
      position: POSITION.CENTER,
      layer: LAYER.GAME,
      phases: [],
      src: IMAGE.CARDS,
      sprites: [{ x: 0, y: 0 }],
      spriteWidth: 32,
      spriteHeight: 32,
    });

    // Add entities to layers
    uiLayer.set(textEntity1.id, textEntity1);
    gameLayer.set(textEntity2.id, textEntity2);
    gameLayer.set(spriteEntity.id, spriteEntity);

    // Get entities by type
    const textEntities = layerManager.getEntitiesByType("text");
    const spriteEntities = layerManager.getEntitiesByType("sprite");

    // Verify results
    expect(textEntities.length).toBe(2);
    expect(textEntities).toContain(textEntity1);
    expect(textEntities).toContain(textEntity2);
    expect(spriteEntities.length).toBe(1);
    expect(spriteEntities).toContain(spriteEntity);
  });

  it("should resize all layers", () => {
    // Spy on layer resize methods
    const bgResizeSpy = vi.spyOn(bgLayer, "resize");
    const gameResizeSpy = vi.spyOn(gameLayer, "resize");
    const uiResizeSpy = vi.spyOn(uiLayer, "resize");

    // Spy on requestUpdate
    const requestUpdateSpy = vi.spyOn(layerManager, "requestUpdate");

    // Resize layers
    layerManager.resize();

    // Verify requestUpdate was called
    expect(requestUpdateSpy).toHaveBeenCalled();

    // Verify all layers were resized
    expect(bgResizeSpy).toHaveBeenCalled();
    expect(gameResizeSpy).toHaveBeenCalled();
    expect(uiResizeSpy).toHaveBeenCalled();
  });

  it("should request update on all layers", () => {
    // Spy on layer requestUpdate methods
    const bgRequestUpdateSpy = vi.spyOn(bgLayer, "requestUpdate");
    const gameRequestUpdateSpy = vi.spyOn(gameLayer, "requestUpdate");
    const uiRequestUpdateSpy = vi.spyOn(uiLayer, "requestUpdate");

    // Request update
    layerManager.requestUpdate();

    // Verify all layers' requestUpdate methods were called
    expect(bgRequestUpdateSpy).toHaveBeenCalled();
    expect(gameRequestUpdateSpy).toHaveBeenCalled();
    expect(uiRequestUpdateSpy).toHaveBeenCalled();
  });

  it("should update layout with text entities", () => {
    // Create text entities
    const textEntity1 = new TextEntity({
      id: "text1",
      type: "text",
      text: "Test 1",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      position: POSITION.TOP,
      layer: LAYER.UI,
      phases: [],
      strokeColor: "black",
      strokeWidth: 1,
    });

    const textEntity2 = new TextEntity({
      id: "text2",
      type: "text",
      text: "Test 2",
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

    // Add entities to layers
    uiLayer.set(textEntity1.id, textEntity1);
    gameLayer.set(textEntity2.id, textEntity2);

    // Update layout
    layerManager.updateLayout();

    // Verify layout manager's update method was called with text entities
    // The order of entities might vary, so we just check that it was called with both entities
    expect(mockLayoutManager.update).toHaveBeenCalled();
    const updateArgs = vi.mocked(mockLayoutManager.update).mock.calls[0][0];
    expect(updateArgs).toHaveLength(2);
    expect(updateArgs).toEqual(
      expect.arrayContaining([textEntity1, textEntity2])
    );
  });

  it("should update layers that need updating", () => {
    // Set shouldUpdate flags
    bgLayer.shouldUpdate = true;
    gameLayer.shouldUpdate = true;
    uiLayer.shouldUpdate = false;

    // Spy on layer update methods
    const bgUpdateSpy = vi.spyOn(bgLayer, "update");
    const gameUpdateSpy = vi.spyOn(gameLayer, "update");
    const uiUpdateSpy = vi.spyOn(uiLayer, "update");

    // Update layers
    layerManager.update();

    // Verify only layers with shouldUpdate=true were updated
    expect(bgUpdateSpy).toHaveBeenCalled();
    expect(gameUpdateSpy).toHaveBeenCalled();
    expect(uiUpdateSpy).not.toHaveBeenCalled();
  });

  it("should render layers and update layout if needed", () => {
    // Set shouldRender flags
    bgLayer.shouldRender = true;
    gameLayer.shouldRender = true;
    uiLayer.shouldRender = false;

    // Spy on layer render methods
    const bgRenderSpy = vi.spyOn(bgLayer, "render");
    const gameRenderSpy = vi.spyOn(gameLayer, "render");
    const uiRenderSpy = vi.spyOn(uiLayer, "render");

    // Spy on updateLayout
    const updateLayoutSpy = vi.spyOn(layerManager, "updateLayout");

    // Render with shouldUpdate=true
    layerManager.render();

    // Verify updateLayout was called
    expect(updateLayoutSpy).toHaveBeenCalled();

    // Verify only layers with shouldRender=true were rendered
    expect(bgRenderSpy).toHaveBeenCalled();
    expect(gameRenderSpy).toHaveBeenCalled();
    expect(uiRenderSpy).not.toHaveBeenCalled();

    // Reset spies
    vi.clearAllMocks();

    // Set private shouldUpdate to false
    // We need to access the private field via a workaround
    // Call updateLayout which sets shouldUpdate to false
    layerManager.updateLayout();

    // Mock the updateLayout method to verify it's not called again
    const originalUpdateLayout = layerManager.updateLayout;
    layerManager.updateLayout = vi.fn();

    // Render with shouldUpdate=false
    layerManager.render();

    // Verify updateLayout was not called again
    expect(layerManager.updateLayout).not.toHaveBeenCalled();

    // Verify layers were still rendered
    expect(bgRenderSpy).not.toHaveBeenCalled();
    expect(gameRenderSpy).toHaveBeenCalled();
    expect(uiRenderSpy).not.toHaveBeenCalled();

    // Restore the original method
    layerManager.updateLayout = originalUpdateLayout;
  });

  it("should clear all layers", () => {
    // Spy on layer clear methods
    const bgClearSpy = vi.spyOn(bgLayer, "clear");
    const gameClearSpy = vi.spyOn(gameLayer, "clear");
    const uiClearSpy = vi.spyOn(uiLayer, "clear");

    // Clear layers
    layerManager.clear();

    // Verify all layers were cleared
    expect(bgClearSpy).toHaveBeenCalled();
    expect(gameClearSpy).toHaveBeenCalled();
    expect(uiClearSpy).toHaveBeenCalled();
  });
});

