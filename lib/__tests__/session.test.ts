import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isSessionValid,
  getUserId,
  getSessionExpiryTime,
  auth,
  getAuthSession,
} from "../session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CURRENT_URL } from "@/lib/constants";

// Mock dependencies
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("react", () => ({
  cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.error to avoid polluting test output
vi.spyOn(console, "error").mockImplementation(() => {});

describe("Session Module", () => {
  const mockAccessToken = "mock-access-token";
  const mockUserId = "12345";
  const mockExpiresIn = 3600; // 1 hour in seconds

  // Mock cookie store
  const mockCookieStore = {
    get: vi.fn(),
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup default cookie mock
    mockCookieStore.get.mockReturnValue({ value: mockAccessToken });
    (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockCookieStore,
    );

    // Setup default fetch mock for successful response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          user_id: mockUserId,
          expires_in: mockExpiresIn,
          client_id: "client-id",
          login: "user-login",
          scopes: ["user:read:email"],
        },
      }),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getAuthSession", () => {
    it("should return success response with session data when token is valid", async () => {
      const result = await getAuthSession();

      // Verify cookie was accessed with correct name
      expect(mockCookieStore.get).toHaveBeenCalledWith(
        process.env.ACCESS_TOKEN_NAME,
      );

      // Verify fetch was called with correct URL
      expect(mockFetch).toHaveBeenCalledWith(
        `${CURRENT_URL}${process.env.TWITCH_VALIDATE_URL}?access_token=${mockAccessToken}`,
        expect.objectContaining({
          cache: "force-cache",
          next: { revalidate: 3600 },
        }),
      );

      // Verify response structure
      expect(result).toEqual({
        success: true,
        data: {
          session: {
            user_id: mockUserId,
            expires_in: mockExpiresIn,
            client_id: "client-id",
            login: "user-login",
            scopes: ["user:read:email"],
          },
          access_token: mockAccessToken,
        },
      });
    });

    it("should return error response when no token is found", async () => {
      // Mock no token in cookies
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await getAuthSession();

      expect(result).toEqual({
        success: false,
        error: {
          status: 404,
          message: "No token found",
        },
      });

      // Verify fetch was not called
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should return error response when fetch fails", async () => {
      // Mock fetch failure
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      const result = await getAuthSession();

      expect(result).toEqual({
        success: false,
        error: {
          status: 401,
          message: "Unauthorized",
        },
      });
    });

    it("should return error response when fetch throws an exception", async () => {
      // Mock fetch throwing an error
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await getAuthSession();

      expect(result).toEqual({
        success: false,
        error: {
          status: 500,
          message: "Internal server error",
        },
      });

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        "Auth validation error:",
        expect.any(Error),
      );
    });
  });

  describe("isSessionValid", () => {
    it("should return true when session is valid", async () => {
      const result = await isSessionValid();
      expect(result).toBe(true);
    });

    it("should return false when session is invalid", async () => {
      // Mock invalid session
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await isSessionValid();
      expect(result).toBe(false);
    });
  });

  describe("getUserId", () => {
    it("should return user ID when session is valid", async () => {
      const result = await getUserId();
      expect(result).toBe(mockUserId);
    });

    it("should return null when session is invalid", async () => {
      // Mock invalid session
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await getUserId();
      expect(result).toBe(null);
    });
  });

  describe("getSessionExpiryTime", () => {
    it("should return expiry time when session is valid", async () => {
      // Mock Date.now() to return a fixed timestamp
      const mockNow = 1625097600000; // 2021-07-01T00:00:00.000Z
      const realDateNow = Date.now;
      Date.now = vi.fn(() => mockNow);

      try {
        const result = await getSessionExpiryTime();

        // Expected expiry time: current time + expires_in seconds
        const expectedExpiryTime = new Date(mockNow + mockExpiresIn * 1000);

        expect(result).toEqual(expectedExpiryTime);
      } finally {
        // Restore original Date.now
        Date.now = realDateNow;
      }
    });

    it("should return null when session is invalid", async () => {
      // Mock invalid session
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await getSessionExpiryTime();
      expect(result).toBe(null);
    });
  });

  describe("auth", () => {
    it("should return session data when session is valid", async () => {
      const result = await auth();

      expect(result).toEqual({
        session: {
          user_id: mockUserId,
          expires_in: mockExpiresIn,
          client_id: "client-id",
          login: "user-login",
          scopes: ["user:read:email"],
        },
        access_token: mockAccessToken,
      });

      // Verify redirect was not called
      expect(redirect).not.toHaveBeenCalled();
    });

    it("should redirect to home page when session is invalid", async () => {
      // Mock invalid session
      mockCookieStore.get.mockReturnValue(undefined);

      // We need to catch the error since redirect throws
      try {
        await auth();
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch {
        // Verify redirect was called
        expect(redirect).toHaveBeenCalledWith("/");
      }
    });
  });
});
