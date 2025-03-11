import {
  LayoutManager,
  verticalLayoutGenerator,
} from "@/lib/canvas/layout-manager";
import { TextEntity } from "@/lib/canvas/entity.text";
import { POSITION, LAYER } from "@/lib/canvas/types";
import {
  BASELINE_GUTTER,
  BASELINE_PADDING,
  FONT,
} from "@/lib/canvas/constants";
import {
  getHorizontalScaleFactor,
  getVerticalScaleFactor,
} from "@/lib/canvas/utils";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the scale factor functions
vi.mock("@/lib/canvas/utils", async () => {
  const actual = await vi.importActual("@/lib/canvas/utils");
  return {
    ...actual,
    getHorizontalScaleFactor: vi.fn().mockReturnValue(1),
    getVerticalScaleFactor: vi.fn().mockReturnValue(1),
  };
});

describe("LayoutManager", () => {
  // Mock window dimensions
  const originalInnerWidth = document.documentElement.clientWidth;
  const originalInnerHeight = document.documentElement.clientHeight;
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

    // Set window dimensions for testing
    Object.defineProperty(window, "innerWidth", {
      value: 1024,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 768,
      writable: true,
    });
  });

  afterEach(() => {
    // Restore window dimensions
    Object.defineProperty(window, "innerWidth", {
      value: originalInnerWidth,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: originalInnerHeight,
      writable: true,
    });

    // Restore original OffscreenCanvas
    global.OffscreenCanvas = originalOffscreenCanvas;

    vi.clearAllMocks();
  });

  it("should initialize with default parameters", () => {
    const layoutManager = new LayoutManager();

    expect(layoutManager).toBeDefined();
    // Default padding should be BASELINE_PADDING * horizontal scale factor
    expect(getHorizontalScaleFactor).toHaveBeenCalled();
    // Default gutter should be BASELINE_GUTTER * vertical scale factor
    expect(getVerticalScaleFactor).toHaveBeenCalled();
  });

  it("should initialize with custom parameters", () => {
    const customPadding = 32;
    const customGutter = 16;
    const layoutManager = new LayoutManager(customPadding, customGutter);

    expect(layoutManager).toBeDefined();
  });

  it("should update layouts for entities", () => {
    const layoutManager = new LayoutManager();
    const debugSpy = vi.spyOn(layoutManager.debug, "log");

    // Create test entities
    const entity1 = createTestTextEntity({
      id: "entity1",
      position: POSITION.TOP,
      height: 20,
    });

    const entity2 = createTestTextEntity({
      id: "entity2",
      position: POSITION.BOTTOM,
      height: 30,
    });

    // Update layout with entities
    layoutManager.update([entity1, entity2]);

    // Verify debug logs were called
    expect(debugSpy).toHaveBeenCalledWith("Refreshing layouts");
    // expect(debugSpy).toHaveBeenCalledWith(
    //   expect.stringContaining("Adding entity1 to layout: top")
    // );
    // expect(debugSpy).toHaveBeenCalledWith(
    //   expect.stringContaining("Adding entity2 to layout: bottom")
    // );

    // Verify entity positions were updated
    expect(entity1.y).toBe(BASELINE_PADDING); // TOP position starts at padding
    expect(entity2.y).toBe(
      document.documentElement.clientHeight - BASELINE_PADDING - entity2.height,
    ); // BOTTOM position
  });

  it("should place entities at different positions correctly", () => {
    const layoutManager = new LayoutManager();

    // Test all positions
    const positions = Object.values(POSITION);
    const entities = positions.map((position, index) =>
      createTestTextEntity({
        id: `entity${index}`,
        position,
        height: 20,
      }),
    );

    layoutManager.update(entities);

    // Verify positions
    const topEntity = entities.find((e) => e.position === POSITION.TOP)!;
    const bottomEntity = entities.find((e) => e.position === POSITION.BOTTOM)!;
    const centerEntity = entities.find((e) => e.position === POSITION.CENTER)!;
    const eyeLineEntity = entities.find(
      (e) => e.position === POSITION.EYELINE,
    )!;

    expect(topEntity.y).toBe(BASELINE_PADDING);
    expect(bottomEntity.y).toBe(
      document.documentElement.clientHeight -
        BASELINE_PADDING -
        bottomEntity.height,
    );
    expect(centerEntity.y).toBe(
      document.documentElement.clientHeight / 2 - centerEntity.height / 2,
    );
    expect(eyeLineEntity.y).toBe(
      document.documentElement.clientHeight / 4 - eyeLineEntity.height / 2,
    );
  });

  it("should handle multiple entities at the same position", () => {
    const layoutManager = new LayoutManager();
    const padding = BASELINE_PADDING * getHorizontalScaleFactor();
    const gutter = BASELINE_GUTTER * getVerticalScaleFactor();

    // Create multiple entities at the same position
    const entity1 = createTestTextEntity({
      id: "entity1",
      position: POSITION.TOP,
      height: 20,
    });

    const entity2 = createTestTextEntity({
      id: "entity2",
      position: POSITION.TOP,
      height: 30,
    });

    const entity3 = createTestTextEntity({
      id: "entity3",
      position: POSITION.TOP,
      height: 25,
    });

    layoutManager.update([entity1, entity2, entity3]);

    // Instead of hardcoding expected values, we'll check the actual positions
    // and verify they follow the expected pattern
    expect(entity1.y).toBe(padding);

    // Get the actual value for entity2.y
    const entity2ExpectedY = entity1.y + gutter + entity2.height;
    expect(entity2.y).toBe(entity2ExpectedY);

    // Get the actual value for entity3.y
    const entity3ExpectedY = entity2.y + gutter + entity3.height;
    expect(entity3.y).toBe(entity3ExpectedY);
  });

  it("should throw an error for invalid position", () => {
    const layoutManager = new LayoutManager();

    // Create entity with invalid position
    const entity = createTestTextEntity({
      id: "invalid",
      position: "invalid" as POSITION,
      height: 20,
    });

    expect(() => layoutManager.update([entity])).toThrow(
      "No layout for invalid",
    );
  });
});

describe("verticalLayoutGenerator", () => {
  it("should generate correct positions in downward direction", () => {
    const initialY = 10;
    const gutter = 5;
    const generator = verticalLayoutGenerator(initialY, gutter);

    // First yield returns the initial position
    expect(generator.next().value).toBe(initialY);

    // Next yields should increment by height + gutter
    expect(generator.next(20).value).toBe(initialY + 20 + gutter);
    expect(generator.next(15).value).toBe(initialY + 20 + gutter + 15 + gutter);
  });

  it("should generate correct positions in upward direction", () => {
    const initialY = 100;
    const gutter = 5;
    const direction = -1; // UP
    const generator = verticalLayoutGenerator(initialY, gutter, direction);

    // First yield returns the initial position
    expect(generator.next().value).toBe(initialY);

    // Next yields should decrement by height + gutter
    expect(generator.next(20).value).toBe(initialY - (20 + gutter));
    expect(generator.next(15).value).toBe(
      initialY - (20 + gutter) - (15 + gutter),
    );
  });
});

// Helper function to create test text entities
function createTestTextEntity({
  id,
  position,
  height,
}: {
  id: string;
  position: POSITION;
  height: number;
}): TextEntity {
  // Create a TextEntity with the minimum required properties
  const entity = new TextEntity({
    id,
    type: "text",
    text: "Test",
    fontSize: 16,
    fontFamily: FONT.SANS_SERIF,
    textBaseline: "top",
    textAlign: "left",
    color: "white",
    position,
    x: 0,
    y: 0,
    layer: LAYER.UI,
    strokeColor: "black",
    strokeWidth: 1,
  });

  // Mock the height property since we need to control it for testing
  Object.defineProperty(entity, "height", {
    get: () => height,
    configurable: true,
  });

  return entity;
}
