import { vi } from "vitest";

// Mock for OffscreenCanvas
class MockOffscreenCanvas {
  width: number;
  height: number;
  context: {
    drawImage: ReturnType<typeof vi.fn>;
    imageSmoothingEnabled: boolean;
  };

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.context = {
      drawImage: vi.fn(),
      imageSmoothingEnabled: false,
    };
  }

  getContext() {
    return this.context;
  }

  transferToImageBitmap() {
    return {} as ImageBitmap;
  }
}

// Setup global mocks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).OffscreenCanvas = MockOffscreenCanvas;

// Mock for ImageBitmap
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ImageBitmap = class {};

// Ensure window dimensions are set
Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
Object.defineProperty(window, "innerHeight", { value: 768, writable: true });

