import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");

  const scopes = [
    "chat:read",
    // "channel:manage:polls"
  ].join(" ");

  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    redirect_uri: `${process.env.VERCEL_URL}${process.env.TWITCH_CALLBACK_URL}`,
    response_type: "code",
    scope: scopes,
    state: state,
  });

  const response = NextResponse.redirect(
    `${process.env.TWITCH_AUTH_URL}?${params.toString()}`,
  );

  response.cookies.set(process.env.TWITCH_STATE_NAME, state, {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
