"use server";

import { Twitch } from "@/lib/integrations/twitch.types";
import { cookies } from "next/headers";

export async function getModeratedChannels(): Promise<Twitch.ModeratedChannelsResponse> {
  const errorResult: Twitch.ModeratedChannelsResponse = {
    data: [],
    pagination: {},
  };

  const { session, access_token, error } = await auth();

  if (error) {
    return errorResult;
  }

  const params = new URLSearchParams({
    user_id: session.user_id,
    access_token,
  });

  try {
    const data = await fetch(
      `${process.env.VERCEL_URL}/api/auth/twitch/channels?${params.toString()}`,
    );

    if (!data.ok) {
      return errorResult;
    }

    const payload = (await data.json()) as Twitch.ModeratedChannelsResponse;

    return {
      data: [
        {
          broadcaster_id: session.user_id,
          broadcaster_login: session.login,
          broadcaster_name: session.login,
        },
        ...payload.data,
      ],
      pagination: payload.pagination,
    };
  } catch (err) {
    console.error("Error fetching moderated channels:", err);
    return errorResult;
  }
}

export async function auth(): Promise<
  | {
      session: Twitch.ValidateAccessTokenSessionData;
      access_token: string;
      error?: never;
    }
  | {
      session?: never;
      access_token?: never;
      error: {
        status: number;
        message: string;
      };
    }
> {
  const cookieStore = await cookies();
  const access_token = cookieStore.get(
    process.env.TWITCH_ACCESS_TOKEN_NAME,
  )?.value;

  if (!access_token) {
    return {
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
      `${process.env.VERCEL_URL}/api/auth/twitch/validate?${params.toString()}`,
      {
        // cache: "no-store",
      },
    );

    if (!res.ok) {
      return {
        error: {
          status: res.status,
          message: res.statusText,
        },
      };
    }

    const { user } = (await res.json()) as Twitch.ValidateAccessTokenSuccess;

    return { session: user, access_token };
  } catch (err) {
    console.error("Auth validation error:", err);
    return {
      error: {
        status: 500,
        message: "Internal server error",
      },
    };
  }
}
