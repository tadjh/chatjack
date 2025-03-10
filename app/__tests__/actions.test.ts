/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getModeratedChannels } from "@/app/actions";
import { auth } from "@/lib/session";
import { CURRENT_URL } from "@/lib/constants";

// Mock dependencies
vi.mock("@/lib/session", () => ({
  auth: vi.fn(),
}));

// Mock fetch globally
global.fetch = vi.fn();

describe("getModeratedChannels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return broadcaster and moderated channels when successful", async () => {
    // Mock auth return value
    const mockSession = {
      session: {
        user_id: "user123",
        login: "testuser",
        expires_in: 3600,
      },
      access_token: "test-token",
    };
    (auth as any).mockResolvedValue(mockSession);

    // Mock fetch return value
    const mockResponse = {
      data: [
        {
          broadcaster_id: "other123",
          broadcaster_login: "otherchannel",
          broadcaster_name: "Other Channel",
        },
      ],
      pagination: { cursor: "abc123" },
    };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    // Call the function
    const result = await getModeratedChannels();

    // Assertions
    expect(auth).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      `${CURRENT_URL}${process.env.AUTH_CHANNELS_URL}?user_id=user123&access_token=test-token`,
      { cache: "force-cache" },
    );
    expect(result).toEqual({
      data: [
        {
          broadcaster_id: "user123",
          broadcaster_login: "testuser",
          broadcaster_name: "testuser",
        },
        {
          broadcaster_id: "other123",
          broadcaster_login: "otherchannel",
          broadcaster_name: "Other Channel",
        },
      ],
      pagination: { cursor: "abc123" },
    });
  });

  it("should return error result when auth fails", async () => {
    // Mock auth to throw an error
    (auth as any).mockRejectedValue(new Error("Authentication failed"));

    // Call the function
    const result = await getModeratedChannels();

    // Assertions
    expect(auth).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result).toEqual({
      data: [],
      pagination: {},
    });
  });

  it("should return error result when fetch fails", async () => {
    // Mock auth return value
    const mockSession = {
      session: {
        user_id: "user123",
        login: "testuser",
        expires_in: 3600,
      },
      access_token: "test-token",
    };
    (auth as any).mockResolvedValue(mockSession);

    // Mock fetch to return error
    (global.fetch as any).mockResolvedValue({
      ok: false,
    });

    // Call the function
    const result = await getModeratedChannels();

    // Assertions
    expect(auth).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalled();
    expect(result).toEqual({
      data: [],
      pagination: {},
    });
  });

  it("should handle fetch throwing an exception", async () => {
    // Mock auth return value
    const mockSession = {
      session: {
        user_id: "user123",
        login: "testuser",
        expires_in: 3600,
      },
      access_token: "test-token",
    };
    (auth as any).mockResolvedValue(mockSession);

    // Mock fetch to throw an error
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    // Call the function
    const result = await getModeratedChannels();

    // Assertions
    expect(auth).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalled();
    expect(result).toEqual({
      data: [],
      pagination: {},
    });
  });
});
