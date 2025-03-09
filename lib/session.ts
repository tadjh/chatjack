"use server";

import { CURRENT_URL } from "@/lib/constants";
import {
  ValidateAccessTokenSessionData,
  ValidateAccessTokenSuccess,
} from "@/lib/integrations/twitch.types";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";

type SessionSuccessResponse = {
  success: true;
  data: {
    session: ValidateAccessTokenSessionData;
    access_token: string;
  };
};

type SessionErrorResponse = {
  success: false;
  error: {
    status: number;
    message: string;
  };
};

type SessionResponse = SessionSuccessResponse | SessionErrorResponse;

export type Session = SessionSuccessResponse["data"];

/**
 * Helper function to check if the session is valid
 */
export async function isSessionValid() {
  return (await getAuthSession()).success;
}

/**
 * Helper function to get user ID from session
 */
export async function getUserId() {
  const response = await getAuthSession();
  if (!response.success) return null;
  return response.data.session.user_id;
}

/**
 * Get expiration time for the current session
 */
export async function getSessionExpiryTime() {
  const response = await getAuthSession();
  if (!response.success) return null;
  return new Date(Date.now() + response.data.session.expires_in * 1000);
}

/**
 * Get the current session data and access token.
 * Requires authentication for a route.
 * If the session is invalid, redirects to the home page.
 * @returns The valid session data and access token
 */
export async function auth(): Promise<Session> {
  const { success, ...response } = await getAuthSession();
  if (!success || "error" in response) redirect("/");
  return response.data;
}

/**
 * Get the current session data and access token.
 * @returns The session data and access token
 */
export const getAuthSession = cache(async (): Promise<SessionResponse> => {
  const cookieStore = await cookies();
  const access_token = cookieStore.get(
    process.env.TWITCH_ACCESS_TOKEN_NAME,
  )?.value;

  if (!access_token) {
    return {
      success: false,
      error: {
        status: 404,
        message: "No token found",
      },
    };
  }

  const params = new URLSearchParams({
    access_token,
  });

  try {
    const res = await fetch(
      `${CURRENT_URL}/api/auth/twitch/validate?${params.toString()}`,
      {
        cache: "force-cache",
        next: { revalidate: 3600 },
      },
    );

    if (!res.ok) {
      return {
        success: false,
        error: {
          status: res.status,
          message: res.statusText,
        },
      };
    }

    const { user } = (await res.json()) as ValidateAccessTokenSuccess;

    return { success: true, data: { session: user, access_token } };
  } catch (err) {
    console.error("Auth validation error:", err);
    return {
      success: false,
      error: {
        status: 500,
        message: "Internal server error",
      },
    };
  }
});
