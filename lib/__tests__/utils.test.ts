import {
  cn,
  getCacheKey,
  getModeratedChannelsKey,
  getSnapshotKey,
  parseBoolean,
  parseNumber,
  capitalize,
  formatMetadata,
} from "../utils";
import { RenderMode } from "@/lib/canvas/renderer";
import { CURRENT_URL } from "@/lib/constants";
import { describe, it, expect, vi } from "vitest";

// Simple mock setup
vi.mock("../utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils")>();
  return {
    ...actual,
    getCacheKey: vi.fn((...args: [string, string]) =>
      actual.getCacheKey(...args),
    ),
  };
});

describe("cn", () => {
  it("should merge class names correctly", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
    expect(cn("class1", { class2: true, class3: false })).toBe("class1 class2");
    expect(cn("p-4", "bg-red-500", "text-white")).toBe(
      "p-4 bg-red-500 text-white",
    );

    // Test with Tailwind class merging
    expect(cn("p-4", "p-8")).toBe("p-8");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});

describe("getCacheKey", () => {
  it("should return a properly formatted cache key", () => {
    expect(getCacheKey("users", "123")).toBe("users:123");
    expect(getCacheKey("posts", "abc")).toBe("posts:abc");
    expect(getCacheKey("", "")).toBe(":");
  });
});

describe("getModeratedChannelsKey", () => {
  it("should return a properly formatted moderated channels key", () => {
    expect(getModeratedChannelsKey("user123")).toBe(
      "moderatedChannels:user123",
    );
    expect(getModeratedChannelsKey("")).toBe("moderatedChannels:");
  });
});

describe("getSnapshotKey", () => {
  it("should return a properly formatted snapshot key", () => {
    expect(getSnapshotKey("channel1")).toBe("snapshot:channel1");
    expect(getSnapshotKey("")).toBe("snapshot:");
  });
});

describe("parseBoolean", () => {
  it("should parse string values to boolean correctly", () => {
    expect(parseBoolean("true")).toBe(true);
    expect(parseBoolean("false")).toBe(true); // Any non-empty string is truthy
    expect(parseBoolean("0")).toBe(true);
    expect(parseBoolean("1")).toBe(true);
    expect(parseBoolean(null)).toBe(false);
    expect(parseBoolean("")).toBe(true); // Empty string is a special case
  });
});

describe("parseNumber", () => {
  it("should parse string values to numbers correctly", () => {
    expect(parseNumber("123")).toBe(123);
    expect(parseNumber("0")).toBe(0);
    expect(parseNumber("-10")).toBe(-10);
  });

  it("should return fallback value for invalid inputs", () => {
    expect(parseNumber(null)).toBe(0); // Default fallback
    expect(parseNumber("")).toBe(0);
    expect(parseNumber("abc")).toBe(0);
    expect(parseNumber(null, 5)).toBe(5); // Custom fallback
    expect(parseNumber("abc", 10)).toBe(10);
  });
});

describe("capitalize", () => {
  it("should capitalize the first letter of a string", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("world")).toBe("World");
    expect(capitalize("a")).toBe("A");
  });

  it("should handle edge cases", () => {
    expect(capitalize("")).toBe("");
    expect(capitalize("ALREADY_CAPITALIZED")).toBe("ALREADY_CAPITALIZED");
    expect(capitalize("123")).toBe("123");
  });
});

describe("formatMetadata", () => {
  it("should format metadata for play mode correctly", async () => {
    const params = Promise.resolve<{ channel: string; broadcaster_id: string }>(
      {
        channel: "testchannel",
        broadcaster_id: "someId",
      },
    );
    const mode = "play" as RenderMode;

    const result = await formatMetadata({ params }, mode);

    expect(result).toEqual({
      title: "Play - testchannel - ChatJack",
      description: "Host a ChatJack session for testchannel",
      authors: [{ name: "Tadjh", url: "https://tadjh.com" }],
      keywords: ["Twitch", "Blackjack", "Chat", "Game", "Play", "ChatJack"],
      creator: "Tadjh",
      publisher: "Tadjh",
      applicationName: "ChatJack",
      openGraph: {
        type: "website",
        url: `${CURRENT_URL}/play/testchannel`,
        title: "Play - testchannel - ChatJack",
        description: "Host a ChatJack session for testchannel",
        siteName: "ChatJack",
        images: [
          {
            url: `${CURRENT_URL}/play/testchannel/opengraph-image`,
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        site: "@tadjh_",
        creator: "@tadjh_",
      },
    });
  });

  it("should format metadata for watch mode correctly", async () => {
    const params = Promise.resolve<{ channel: string; broadcaster_id: string }>(
      {
        channel: "testchannel",
        broadcaster_id: "someId",
      },
    );
    const mode = "watch" as RenderMode;

    const result = await formatMetadata({ params }, mode);

    expect(result).toEqual({
      title: "Watch - testchannel - ChatJack",
      description: "Watch a ChatJack session for testchannel",
      authors: [{ name: "Tadjh", url: "https://tadjh.com" }],
      keywords: ["Twitch", "Blackjack", "Chat", "Game", "Play", "ChatJack"],
      creator: "Tadjh",
      publisher: "Tadjh",
      applicationName: "ChatJack",
      openGraph: {
        type: "website",
        url: `${CURRENT_URL}/watch/testchannel`,
        title: "Watch - testchannel - ChatJack",
        description: "Watch a ChatJack session for testchannel",
        siteName: "ChatJack",
        images: [
          {
            url: `${CURRENT_URL}/watch/testchannel/opengraph-image`,
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        site: "@tadjh_",
        creator: "@tadjh_",
      },
    });
  });
});
