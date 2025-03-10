import { NextResponse } from "next/server";
import crypto from "crypto";
import { CURRENT_URL } from "@/lib/constants";

const scopes = ["chat:read", "user:read:moderated_channels"].join(" ");

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    redirect_uri: `${CURRENT_URL}${process.env.AUTH_CALLBACK_URL}`,
    response_type: "code",
    scope: scopes,
    state: state,
  });

  const response = NextResponse.redirect(
    `${process.env.TWITCH_AUTH_URL}?${params.toString()}`,
  );

  response.cookies.set(process.env.STATE_TOKEN_NAME, state, {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
