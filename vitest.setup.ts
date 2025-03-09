import { vi } from "vitest";

// Mock window.requestAnimationFrame
window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(() => callback(performance.now()), 0) as unknown as number;
};

// Mock window.cancelAnimationFrame
window.cancelAnimationFrame = (handle: number): void => {
  clearTimeout(handle);
};

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

vi.mock("next/font/google", () => ({
  Jacquard_24: () => ({
    style: {
      fontFamily: "Jacquard 24",
    },
  }),
  Press_Start_2P: () => ({
    style: {
      fontFamily: "Press Start 2P",
    },
  }),
}));

// Mock Uint8Array.from for buffer handling
const originalFrom = Uint8Array.from;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).Uint8Array.from = function (buffer: any) {
  if (buffer instanceof Buffer) {
    return originalFrom.call(this, buffer);
  }
  return new Uint8Array(buffer);
};

// Mock TextEncoder for JSX serialization if needed
if (!global.TextEncoder) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).TextEncoder = class TextEncoder {
    encode(text: string) {
      return Buffer.from(text);
    }
  };
}

// Add proper process.cwd mock
vi.mock("node:process", () => {
  return {
    cwd: () => "/mock-cwd",
    default: {
      cwd: () => "/mock-cwd",
    },
  };
});
