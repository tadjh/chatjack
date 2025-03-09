import { FONT, IMAGE } from "@/lib/canvas/constants";
import { SpriteEntity, SpriteEntityProps } from "@/lib/canvas/entity.sprite";
import { TextEntity, TextEntityProps } from "@/lib/canvas/entity.text";
import { Layer } from "@/lib/canvas/layer";
import { LayerManager } from "@/lib/canvas/layer-manager";
import { LayoutManager } from "@/lib/canvas/layout-manager";
import { EntityType, LAYER, POSITION } from "@/lib/canvas/types";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("LayerManager", () => {
  let layerManager: LayerManager;
  let mockLayoutManager: { update: ReturnType<typeof vi.fn> };
  let bgLayer: ReturnType<typeof createMockLayer>;
  let gameLayer: ReturnType<typeof createMockLayer>;
  let uiLayer: ReturnType<typeof createMockLayer>;

  beforeEach(() => {
    // Create mock layers
    bgLayer = createMockLayer();
    gameLayer = createMockLayer();
    uiLayer = createMockLayer();

    // Create mock layout manager
    mockLayoutManager = {
      update: vi.fn(),
    };

    // Create layer manager
    layerManager = new LayerManager(
      mockLayoutManager as unknown as LayoutManager,
    );

    // Add layers to layer manager
    layerManager.set(LAYER.BG, bgLayer as unknown as Layer);
    layerManager.set(LAYER.GAME, gameLayer as unknown as Layer);
    layerManager.set(LAYER.UI, uiLayer as unknown as Layer);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to create a mock layer
  function createMockLayer() {
    const entities = new Map<string, EntityType>();
    return {
      shouldUpdate: false,
      shouldRender: false,
      set: vi.fn((id, entity) => {
        entities.set(id, entity);
        return entities.get(id);
      }),
      get: vi.fn((id) => entities.get(id)),
      has: vi.fn((id) => entities.has(id)),
      delete: vi.fn((id) => entities.delete(id)),
      values: vi.fn(() => entities.values()),
      getByType: vi.fn((type) =>
        Array.from(entities.values()).filter((e) => e.type === type),
      ),
      update: vi.fn(),
      render: vi.fn(),
      resize: vi.fn(),
      clear: vi.fn(),
      requestUpdate: vi.fn(),
    };
  }

  // Helper function to create a mock text entity
  function createMockTextEntity(props: TextEntityProps) {
    return {
      id: props.id,
      type: "text",
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
  }

  // Helper function to create a mock sprite entity
  function createMockSpriteEntity(props: SpriteEntityProps) {
    return {
      id: props.id,
      type: "sprite",
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
  }

  it("should initialize correctly", () => {
    expect(layerManager).toBeDefined();
    expect(layerManager.size).toBe(3);
    expect(layerManager.get(LAYER.BG)).toBe(bgLayer);
    expect(layerManager.get(LAYER.GAME)).toBe(gameLayer);
    expect(layerManager.get(LAYER.UI)).toBe(uiLayer);
  });

  it("should get entity by id", () => {
    // Create a text entity
    const textEntity = createMockTextEntity({
      id: "test-text",
      text: "Test",
      position: POSITION.TOP,
      layer: LAYER.UI,
      type: "text",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      strokeColor: "black",
      strokeWidth: 1,
    }) as unknown as TextEntity;

    // Add entity to UI layer
    uiLayer.set(textEntity.id, textEntity);

    // Mock the get method to return our entity
    uiLayer.get.mockReturnValue(textEntity);

    // Get entity by id
    const retrievedEntity = layerManager.getEntityById(LAYER.UI, "test-text");

    // Verify entity was retrieved correctly
    expect(retrievedEntity).toBe(textEntity);
    expect(uiLayer.get).toHaveBeenCalledWith("test-text");
  });

  it("should check if entity exists by id", () => {
    // Create a text entity
    createMockTextEntity({
      id: "test-text",
      text: "Test",
      position: POSITION.TOP,
      layer: LAYER.UI,
      type: "text",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      strokeColor: "black",
      strokeWidth: 1,
    });

    // Mock the has method
    uiLayer.has.mockReturnValueOnce(true).mockReturnValueOnce(false);

    // Check if entity exists
    const exists = layerManager.hasEntityById(LAYER.UI, "test-text");
    const doesNotExist = layerManager.hasEntityById(LAYER.UI, "non-existent");

    // Verify results
    expect(exists).toBe(true);
    expect(doesNotExist).toBe(false);
  });

  it("should set entity and request update for text entities", () => {
    // Create a text entity
    const textEntity = createMockTextEntity({
      id: "test-text",
      text: "Test",
      position: POSITION.TOP,
      layer: LAYER.UI,
      type: "text",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      strokeColor: "black",
      strokeWidth: 1,
    }) as unknown as TextEntity;

    // Spy on requestUpdate
    const requestUpdateSpy = vi.spyOn(layerManager, "requestUpdate");

    // Set entity
    layerManager.setEntity(textEntity as unknown as TextEntity);

    // Verify entity was added to the correct layer
    expect(uiLayer.set).toHaveBeenCalledWith("test-text", textEntity);

    // Verify requestUpdate was called
    expect(requestUpdateSpy).toHaveBeenCalled();
  });

  it("should set entity without requesting update for non-text entities", () => {
    // Create a sprite entity
    const spriteEntity = createMockSpriteEntity({
      id: "test-sprite",
      position: POSITION.CENTER,
      layer: LAYER.GAME,
      type: "sprite",
      src: IMAGE.CARDS,
      sprites: [
        { x: 0, y: 0, flipX: false, flipY: false },
        { x: 32, y: 0, flipX: true, flipY: false },
      ],
      spriteWidth: 32,
      spriteHeight: 32,
    }) as unknown as SpriteEntity;

    // Spy on requestUpdate
    const requestUpdateSpy = vi.spyOn(layerManager, "requestUpdate");

    // Set entity
    layerManager.setEntity(spriteEntity as unknown as SpriteEntity);

    // Verify entity was added to the correct layer
    expect(gameLayer.set).toHaveBeenCalledWith("test-sprite", spriteEntity);

    // Verify requestUpdate was not called
    expect(requestUpdateSpy).not.toHaveBeenCalled();
  });

  it("should remove entity by id", () => {
    // Remove entity
    layerManager.removeEntity(LAYER.UI, "test-text");

    // Verify delete was called
    expect(uiLayer.delete).toHaveBeenCalledWith("test-text");
  });

  it("should get entities by type", () => {
    // Create text entities
    const textEntity1 = createMockTextEntity({
      id: "text1",
      text: "Test 1",
      position: POSITION.TOP,
      layer: LAYER.UI,
      type: "text",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      strokeColor: "black",
      strokeWidth: 1,
    }) as unknown as TextEntity;

    const textEntity2 = createMockTextEntity({
      id: "text2",
      text: "Test 2",
      position: POSITION.BOTTOM,
      layer: LAYER.GAME,
      type: "text",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      strokeColor: "black",
      strokeWidth: 1,
    }) as unknown as TextEntity;

    // Mock getByType to return our entities
    uiLayer.getByType.mockReturnValue([textEntity1]);
    gameLayer.getByType.mockReturnValue([textEntity2]);
    bgLayer.getByType.mockReturnValue([]);

    // Get entities by type
    const textEntities = layerManager.getEntitiesByType("text");

    // Verify results
    expect(textEntities.length).toBe(2);
    expect(textEntities).toContain(textEntity1);
    expect(textEntities).toContain(textEntity2);

    // Verify getByType was called on all layers
    expect(uiLayer.getByType).toHaveBeenCalledWith("text");
    expect(gameLayer.getByType).toHaveBeenCalledWith("text");
    expect(bgLayer.getByType).toHaveBeenCalledWith("text");
  });

  it("should resize all layers", () => {
    // Resize layers
    layerManager.resize();

    // Verify all layers were resized
    expect(bgLayer.resize).toHaveBeenCalled();
    expect(gameLayer.resize).toHaveBeenCalled();
    expect(uiLayer.resize).toHaveBeenCalled();
  });

  it("should request update on all layers", () => {
    // Request update
    layerManager.requestUpdate();

    // Verify all layers' requestUpdate methods were called
    expect(bgLayer.requestUpdate).toHaveBeenCalled();
    expect(gameLayer.requestUpdate).toHaveBeenCalled();
    expect(uiLayer.requestUpdate).toHaveBeenCalled();
  });

  it("should update layout with text entities", () => {
    // Create text entities
    const textEntity1 = createMockTextEntity({
      id: "text1",
      text: "Test 1",
      position: POSITION.TOP,
      layer: LAYER.UI,
      type: "text",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      strokeColor: "black",
      strokeWidth: 1,
    }) as unknown as TextEntity;

    const textEntity2 = createMockTextEntity({
      id: "text2",
      text: "Test 2",
      position: POSITION.BOTTOM,
      layer: LAYER.GAME,
      type: "text",
      fontSize: 16,
      fontFamily: FONT.SANS_SERIF,
      textBaseline: "top",
      textAlign: "left",
      color: "white",
      strokeColor: "black",
      strokeWidth: 1,
    }) as unknown as TextEntity;

    // Mock getByType to return our entities
    uiLayer.getByType.mockReturnValue([textEntity1]);
    gameLayer.getByType.mockReturnValue([textEntity2]);
    bgLayer.getByType.mockReturnValue([]);

    // Update layout
    layerManager.updateLayout();

    // Verify layout manager's update method was called with text entities
    expect(mockLayoutManager.update).toHaveBeenCalled();
    const updateArgs = mockLayoutManager.update.mock.calls[0][0];
    expect(updateArgs).toHaveLength(2);
    expect(updateArgs).toContain(textEntity1);
    expect(updateArgs).toContain(textEntity2);
  });

  it("should update layers that need updating", () => {
    // Set shouldUpdate flags
    bgLayer.shouldUpdate = true;
    gameLayer.shouldUpdate = true;
    uiLayer.shouldUpdate = false;

    // Update layers
    layerManager.update();

    // Verify only layers with shouldUpdate=true were updated
    expect(bgLayer.update).toHaveBeenCalled();
    expect(gameLayer.update).toHaveBeenCalled();
    expect(uiLayer.update).not.toHaveBeenCalled();
  });

  it("should render layers and update layout if needed", () => {
    // Set shouldRender flags
    bgLayer.shouldRender = true;
    gameLayer.shouldRender = true;
    uiLayer.shouldRender = false;

    // Spy on updateLayout
    const updateLayoutSpy = vi.spyOn(layerManager, "updateLayout");

    // Render with shouldUpdate=true
    layerManager.render();

    // Verify updateLayout was called
    expect(updateLayoutSpy).toHaveBeenCalled();

    // Verify only layers with shouldRender=true were rendered
    expect(bgLayer.render).toHaveBeenCalled();
    expect(gameLayer.render).toHaveBeenCalled();
    expect(uiLayer.render).not.toHaveBeenCalled();

    // Reset spies
    vi.clearAllMocks();

    // Mock the private #shouldUpdate field to false by calling updateLayout
    // This is a workaround since we can't directly access private fields
    const privateField = Reflect.get(layerManager, "#shouldUpdate");
    Reflect.set(layerManager, "#shouldUpdate", false);

    // Render again - this time updateLayout shouldn't be called
    layerManager.render();

    // Verify updateLayout was not called again
    expect(updateLayoutSpy).not.toHaveBeenCalled();

    // Verify layers were still rendered based on their shouldRender flags
    expect(bgLayer.render).toHaveBeenCalled();
    expect(gameLayer.render).toHaveBeenCalled();
    expect(uiLayer.render).not.toHaveBeenCalled();

    // Restore the private field
    if (privateField !== undefined) {
      Reflect.set(layerManager, "#shouldUpdate", privateField);
    }
  });

  it("should clear all layers", () => {
    // Clear layers
    layerManager.clear();

    // Verify all layers were cleared
    expect(bgLayer.clear).toHaveBeenCalled();
    expect(gameLayer.clear).toHaveBeenCalled();
    expect(uiLayer.clear).toHaveBeenCalled();
  });
});
