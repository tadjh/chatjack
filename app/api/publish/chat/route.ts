import { ChatMessage, chatMessageSchema } from "@/lib/integrations/twitch";
import {
  TwitchChatResponse,
  TwitchTokenResponse,
} from "@/lib/integrations/twitch.types";
import { kv } from "@vercel/kv";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function validate(token: string) {
  const res = await fetch(process.env.TWITCH_VALIDATE_URL, {
    headers: { Authorization: `OAuth ${token}` },
  });
  return res.ok;
}

async function refresh(refreshToken: string) {
  const params = new URLSearchParams({
    client_id: process.env.TWITCH_BOT_CLIENT_ID,
    client_secret: process.env.TWITCH_BOT_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch(process.env.TWITCH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) throw new Error("Failed to refresh token");
  const tokenData = (await res.json()) as TwitchTokenResponse;
  return tokenData;
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userAccessToken = cookieStore.get(process.env.ACCESS_TOKEN_NAME);

  if (!userAccessToken) {
    return NextResponse.json(
      {
        error: `Error sending chat: You don't have permission to perform this action.`,
      },
      { status: 401 },
    );
  }

  const body = (await request.json()) as Omit<ChatMessage, "sender_id">;

  const parsed = chatMessageSchema.safeParse({
    ...body,
    sender_id: process.env.TWITCH_BOT_ID,
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: `Error sending chat: ${parsed.error.message}`,
      },
      { status: 400 },
    );
  }
  let access_token = process.env.TWITCH_BOT_OAUTH_TOKEN;
  let refresh_token = process.env.TWITCH_BOT_REFRESH_TOKEN;
  // console.log("ENV");
  const cookieAccess = cookieStore.get(process.env.BOT_ACCESS_TOKEN_NAME);
  const cookieRefresh = cookieStore.get(process.env.BOT_REFRESH_TOKEN_NAME);
  const response = NextResponse.json({ success: true });

  if (cookieRefresh && cookieAccess) {
    access_token = cookieAccess.value;
    refresh_token = cookieRefresh.value;
    // console.log("COOKIE");
  } else {
    const token = await kv.get<TwitchTokenResponse>(
      process.env.BOT_ACCESS_TOKEN_NAME,
    );

    if (token) {
      access_token = token.access_token;
      refresh_token = token.refresh_token;
      // console.log("KV");
    }
  }

  const isValid = await validate(access_token);
  if (!isValid) {
    if (cookieRefresh) {
      refresh_token = cookieRefresh.value;
    } else {
      const refreshToken = await kv.get<string>(
        process.env.BOT_REFRESH_TOKEN_NAME,
      );

      if (refreshToken) {
        refresh_token = refreshToken;
      }
    }
    try {
      const tokenData = await refresh(refresh_token);

      access_token = tokenData.access_token;
      refresh_token = tokenData.refresh_token;
      // console.log("REFERSH");

      await kv.set(process.env.BOT_ACCESS_TOKEN_NAME, tokenData, {
        ex: tokenData.expires_in,
      });
      await kv.set(
        process.env.BOT_REFRESH_TOKEN_NAME,
        tokenData.refresh_token,
        {
          ex: 30 * 24 * 60 * 60, // 30 days
        },
      );

      const cookieOptions = {
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        expires: new Date(Date.now() + tokenData.expires_in * 1000),
      };
      response.cookies.set(
        process.env.BOT_ACCESS_TOKEN_NAME,
        JSON.stringify(tokenData),
        cookieOptions,
      );
      response.cookies.set(
        process.env.BOT_REFRESH_TOKEN_NAME,
        tokenData.refresh_token,
        {
          ...cookieOptions,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      );
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to refresh bot token: ${error}` },
        { status: 500 },
      );
    }
  }

  try {
    const res = await fetch(process.env.TWITCH_CHAT_MESSAGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Client-Id": process.env.TWITCH_BOT_CLIENT_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
    });
    // if (!res.ok) throw new Error("Failed to send chat message");

    const result = (await res.json()) as TwitchChatResponse;
    // console.log("data", JSON.stringify(result, null, 2));

    if (!result.data[0].is_sent) {
      return NextResponse.json(
        {
          error: `Error [${result.data[0].drop_reason.code}] sending chat: ${result.data[0].drop_reason.message}`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error sending chat:", error);
    return NextResponse.json(
      { error: `Error sending chat: ${error}` },
      { status: 500 },
    );
  }
}
