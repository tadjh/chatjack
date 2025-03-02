import { Renderer } from "@/lib/canvas/renderer";
import { LAYER } from "@/lib/canvas/types";
import { EVENT, COMMAND } from "@/lib/types";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/canvas/layer-manager", () => {
  return {
    LayerManager: vi.fn().mockImplementation(() => {
      return {
        set: vi.fn(),
        get: vi.fn(),
        getEntityById: vi.fn(),
        hasEntityById: vi.fn(),
        setEntity: vi.fn(),
        removeEntity: vi.fn(),
        getEntitiesByType: vi.fn(),
        resize: vi.fn(),
        requestUpdate: vi.fn(),
        updateLayout: vi.fn(),
        update: vi.fn(),
        render: vi.fn(),
        clear: vi.fn(),
      };
    }),
  };
});

// Mock Renderer to expose private constructor for testing
vi.mock("@/lib/canvas/renderer", () => {
  // Create a singleton instance for testing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let instance: any = null;

  const createInstance = (options?: {
    fps?: number;
    tickRate?: number;
    animationSpeed?: number;
  }) => {
    if (!instance) {
      instance = {
        fps: options?.fps || 12,
        tickRate: options?.tickRate || 1000 / 12,
        baseAnimSpeed: options?.animationSpeed || 1 / 12,
        isReady: false,
        isRunning: false,
        isLoading: false,
        isLayersLoaded: false,
        loadLayers: vi.fn(),
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn(),
        handleGamestate: vi.fn(),
        handleChat: vi.fn(),
      };
    }
    return instance;
  };

  const destroyInstance = () => {
    instance = null;
    return Promise.resolve();
  };

  return {
    Renderer: {
      create: vi.fn().mockImplementation(createInstance),
      destroy: vi.fn().mockImplementation(destroyInstance),
    },
  };
});

// Mock global objects
global.requestAnimationFrame = vi.fn();

// Mock titleScreen and other entities
vi.mock("@/lib/canvas/entities", () => {
  return {
    titleScreen: [
      { id: "title", layer: LAYER.UI, type: "text" },
      { id: "subtitle", layer: LAYER.UI, type: "text" },
    ],
    actionText: { id: "action", layer: LAYER.UI, type: "text" },
    cardSprite: { id: "card", layer: LAYER.GAME, type: "sprite" },
    gameoverText: [
      { id: "title", layer: LAYER.UI, type: "text" },
      { id: "subtitle", layer: LAYER.UI, type: "text" },
      { id: "play-again", layer: LAYER.UI, type: "text" },
    ],
    scoreText: { id: "score", layer: LAYER.UI, type: "text" },
    turnTimer: { id: "timer", layer: LAYER.UI, type: "timer" },
  };
});

describe("Renderer", () => {
  let renderer: Renderer;
  let mockCanvases: [HTMLCanvasElement, HTMLCanvasElement, HTMLCanvasElement];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock canvases
    mockCanvases = [
      { getContext: vi.fn() } as unknown as HTMLCanvasElement,
      { getContext: vi.fn() } as unknown as HTMLCanvasElement,
      { getContext: vi.fn() } as unknown as HTMLCanvasElement,
    ];

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

    // Mock performance.now()
    vi.spyOn(performance, "now").mockReturnValue(1000);

    // Create renderer instance
    renderer = Renderer.create({
      fps: 60,
      tickRate: 16.67,
      animationSpeed: 0.0167,
    });
  });

  afterEach(() => {
    // Destroy renderer instance
    Renderer.destroy();
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should create a singleton instance", () => {
      const instance1 = Renderer.create();
      const instance2 = Renderer.create();
      expect(instance1).toBe(instance2);
    });

    it("should initialize with default options if none provided", () => {
      Renderer.destroy();
      const defaultRenderer = Renderer.create();
      expect(defaultRenderer.fps).toBe(12); // Default FPS from constants
      expect(defaultRenderer.tickRate).toBe(1000 / 12);
      expect(defaultRenderer.baseAnimSpeed).toBe(1 / 12);
    });

    it("should initialize with provided options", () => {
      Renderer.destroy();
      const customRenderer = Renderer.create({
        fps: 60,
        tickRate: 16.67,
        animationSpeed: 0.0167,
      });
      expect(customRenderer.fps).toBe(60);
      expect(customRenderer.tickRate).toBe(16.67);
      expect(customRenderer.baseAnimSpeed).toBe(0.0167);
    });
  });

  describe("Asset Loading", () => {
    it("should load layers correctly", () => {
      // Load layers
      renderer.loadLayers(mockCanvases);

      // Verify loadLayers was called
      expect(renderer.loadLayers).toHaveBeenCalledWith(mockCanvases);
    });

    it("should throw an error if canvas is not found for a layer", () => {
      // Create canvases with a null element
      const invalidCanvases: [
        HTMLCanvasElement | null,
        HTMLCanvasElement | null,
        HTMLCanvasElement | null,
      ] = [mockCanvases[0], null, mockCanvases[2]];

      // Mock loadLayers to throw an error
      vi.mocked(renderer.loadLayers).mockImplementationOnce(() => {
        throw new Error("Canvas not found for layer");
      });

      // Attempt to load layers with invalid canvases
      expect(() => renderer.loadLayers(invalidCanvases)).toThrow(
        "Canvas not found for layer"
      );
    });

    it("should not reload layers if already loaded", () => {
      // Mock isLayersLoaded to return true
      Object.defineProperty(renderer, "isLayersLoaded", {
        get: vi.fn().mockReturnValue(true),
      });

      // Load layers
      renderer.loadLayers(mockCanvases);

      // Verify loadLayers was called
      expect(renderer.loadLayers).toHaveBeenCalledWith(mockCanvases);
    });
  });

  describe("Rendering and Updates", () => {
    it("should start the rendering loop", async () => {
      // Start the renderer
      await renderer.start();

      // Verify start was called
      expect(renderer.start).toHaveBeenCalled();
    });

    it("should not start if already running", async () => {
      // Mock isRunning to return true
      Object.defineProperty(renderer, "isRunning", {
        get: vi.fn().mockReturnValue(true),
      });

      // Start the renderer
      await renderer.start();

      // Verify start was called
      expect(renderer.start).toHaveBeenCalled();
    });

    it("should stop the rendering loop", () => {
      // Stop the renderer
      renderer.stop();

      // Verify stop was called
      expect(renderer.stop).toHaveBeenCalled();
    });
  });

  describe("Event Handling", () => {
    it("should handle gamestate events", () => {
      // Create a dealing event
      const dealingEvent = {
        type: EVENT.DEALING,
        data: {
          dealer: { name: "Dealer", role: "dealer", hand: [], score: 0 },
          player: { name: "Player", role: "player", hand: [], score: 0 },
        },
      };

      // Call handleGamestate with type assertion to avoid type errors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderer.handleGamestate(dealingEvent as any);

      // Verify handleGamestate was called
      expect(renderer.handleGamestate).toHaveBeenCalledWith(dealingEvent);
    });

    it("should handle chat events", () => {
      // Create a vote update event
      const voteUpdateEvent = {
        type: EVENT.VOTE_UPDATE,
        data: {
          command: COMMAND.HIT,
          count: 5,
        },
      };

      // Call handleChat with type assertion to avoid type errors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderer.handleChat(voteUpdateEvent as any);

      // Verify handleChat was called
      expect(renderer.handleChat).toHaveBeenCalledWith(voteUpdateEvent);
    });
  });

  describe("Cleanup", () => {
    it("should destroy the renderer instance", async () => {
      // Destroy the renderer
      await Renderer.destroy();

      // Verify destroy was called
      expect(Renderer.destroy).toHaveBeenCalled();
    });
  });
});

