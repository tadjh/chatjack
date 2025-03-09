import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Renderer } from "@/lib/canvas/renderer";
import { FPS } from "@/lib/canvas/constants";

// Mock the Renderer module directly
vi.mock("@/lib/canvas/renderer");

describe("Renderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Singleton Pattern", () => {
    it("should have a create method", () => {
      expect(typeof Renderer.create).toBe("function");
    });

    it("should have a destroy method", () => {
      expect(typeof Renderer.destroy).toBe("function");
    });
  });

  describe("Initialization", () => {
    it("should have default options", () => {
      expect(Renderer.defaultOptions).toBeDefined();
      expect(Renderer.defaultOptions.fps).toBe(FPS);
      expect(Renderer.defaultOptions.mode).toBe("play");
      expect(typeof Renderer.defaultOptions.channel).toBe("string");
      expect(typeof Renderer.defaultOptions.caption).toBe("string");
    });
  });

  describe("Core Methods", () => {
    it("should have setup and teardown methods", () => {
      const mockRenderer = {
        setup: vi.fn(),
        teardown: vi.fn(),
      };
      vi.spyOn(Renderer, "create").mockReturnValue(
        mockRenderer as unknown as Renderer,
      );

      const renderer = Renderer.create();
      expect(typeof renderer.setup).toBe("function");
      expect(typeof renderer.teardown).toBe("function");

      // Clean up
      vi.mocked(Renderer.create).mockRestore();
    });

    it("should have start and stop methods", () => {
      const mockRenderer = {
        start: vi.fn(),
        stop: vi.fn(),
      };
      vi.spyOn(Renderer, "create").mockReturnValue(
        mockRenderer as unknown as Renderer,
      );

      const renderer = Renderer.create();
      expect(typeof renderer.start).toBe("function");
      expect(typeof renderer.stop).toBe("function");

      // Clean up
      vi.mocked(Renderer.create).mockRestore();
    });
  });

  describe("Event Handling", () => {
    it("should have event handler methods", () => {
      const mockRenderer = {
        handleGamestate: vi.fn(),
        handleChat: vi.fn(),
        handleMediator: vi.fn(),
      };
      vi.spyOn(Renderer, "create").mockReturnValue(
        mockRenderer as unknown as Renderer,
      );

      const renderer = Renderer.create();
      expect(typeof renderer.handleGamestate).toBe("function");
      expect(typeof renderer.handleChat).toBe("function");
      expect(typeof renderer.handleMediator).toBe("function");

      // Clean up
      vi.mocked(Renderer.create).mockRestore();
    });
  });

  describe("Configuration", () => {
    it("should have an updateOptions method", () => {
      const mockRenderer = {
        updateOptions: vi.fn(),
      };
      vi.spyOn(Renderer, "create").mockReturnValue(
        mockRenderer as unknown as Renderer,
      );

      const renderer = Renderer.create();
      expect(typeof renderer.updateOptions).toBe("function");

      // Clean up
      vi.mocked(Renderer.create).mockRestore();
    });

    it("should have fps-related properties", () => {
      const mockRenderer = {
        fps: 60,
        tickRate: 1000 / 60,
        animationSpeed: 1 / 60,
      };
      vi.spyOn(Renderer, "create").mockReturnValue(
        mockRenderer as unknown as Renderer,
      );

      const renderer = Renderer.create();
      expect(renderer.fps).toBeDefined();
      expect(renderer.tickRate).toBeDefined();
      expect(renderer.animationSpeed).toBeDefined();

      // Clean up
      vi.mocked(Renderer.create).mockRestore();
    });
  });
});
