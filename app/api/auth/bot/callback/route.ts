import { CURRENT_URL } from "@/lib/constants";
import { TwitchTokenResponse } from "@/lib/integrations/twitch.types";
import { kv } from "@vercel/kv";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  if (error && error_description) {
    return NextResponse.json(
      { error: error, error_description: error_description },
      { status: 500 },
    );
  }

  const cookieState = request.cookies.get(
    process.env.BOT_STATE_TOKEN_NAME,
  )?.value;

  if (!state || state !== cookieState) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 404 });
  }

  const params = new URLSearchParams({
    client_id: process.env.TWITCH_BOT_CLIENT_ID,
    client_secret: process.env.TWITCH_BOT_CLIENT_SECRET,
    code: code,
    grant_type: "authorization_code",
    redirect_uri: `${CURRENT_URL}${process.env.BOT_CALLBACK_URL}`,
  });

  try {
    const tokenRes = await fetch(process.env.TWITCH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: tokenRes.statusText },
        { status: tokenRes.status },
      );
    }

    const tokenData = (await tokenRes.json()) as TwitchTokenResponse;

    await kv.set(process.env.BOT_ACCESS_TOKEN_NAME, tokenData, {
      ex: tokenData.expires_in,
    });
    await kv.set(process.env.BOT_REFRESH_TOKEN_NAME, tokenData.refresh_token, {
      ex: 30 * 24 * 60 * 60, // 30 days
    });

    const response = NextResponse.redirect(new URL("/", request.url));
    const cookieOptions = {
      httpOnly: true,
      path: "/",
      // secure: process.env.NODE_ENV === "production",
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

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
