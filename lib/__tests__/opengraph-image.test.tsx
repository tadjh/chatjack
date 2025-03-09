import { describe, it, expect, vi, beforeEach } from "vitest";
import OpenGraphImage, {
  loadAssets,
  alt,
  size,
  contentType,
} from "../opengraph-image";
import { ImageResponse } from "next/og";
import React from "react";

// Define type for mocked ImageResponse result
interface MockedImageResponseResult {
  element: React.ReactElement;
  options: {
    width: number;
    height: number;
    fonts: Array<{
      name: string;
      data: Buffer;
      style: string;
      weight: number;
    }>;
    [key: string]: unknown;
  };
}

// Mock the next/og module
vi.mock("next/og", () => ({
  ImageResponse: vi.fn().mockImplementation((element, options) => {
    return { element, options } as MockedImageResponseResult;
  }),
}));

describe("OpenGraph Image Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have correct metadata", () => {
    expect(alt).toBe("ChatJack - Twitch Chat plays BlackJack");
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe("image/png");
  });

  it("should load assets correctly", async () => {
    const assets = await loadAssets();
    expect(assets).toHaveProperty("pressStart2P");
    expect(assets).toHaveProperty("bgImageSrc");
  });

  it("should render with channel name", async () => {
    const result = (await OpenGraphImage({
      params: { channel: "testchannel" },
    })) as unknown as MockedImageResponseResult;

    expect(ImageResponse).toHaveBeenCalled();

    // Check the options passed to ImageResponse
    expect(result.options).toEqual(
      expect.objectContaining({
        width: 1200,
        height: 630,
        fonts: expect.arrayContaining([
          expect.objectContaining({
            name: "Press Start 2P",
          }),
        ]),
      }),
    );

    // Fix JSX element inspection - handle React elements more carefully
    const jsxElement = result.element;

    // Alternative approach to check channel name without navigating the React element tree
    const jsxString = JSON.stringify(jsxElement);
    expect(jsxString).toContain("testchannel");

    // If the above doesn't work and you need to navigate React elements properly:
    // This is a more resilient approach that doesn't rely on specific element structure
    function findTextContent(element: React.JSX.Element): string[] {
      // Base case for text nodes or primitives
      if (
        typeof element === "string" ||
        typeof element === "number" ||
        typeof element === "boolean"
      ) {
        return [String(element)];
      }

      // Skip null/undefined
      if (!element) {
        return [];
      }

      // Handle arrays (like children arrays)
      if (Array.isArray(element)) {
        return element.flatMap((child) => findTextContent(child));
      }

      // Handle React elements with props and children
      if (element && typeof element === "object" && "props" in element) {
        // Check children prop which could be string, array, or object
        return findTextContent(element.props.children);
      }

      return [];
    }

    const textContent = findTextContent(jsxElement);
    expect(textContent).toContain("testchannel");
  });
});
