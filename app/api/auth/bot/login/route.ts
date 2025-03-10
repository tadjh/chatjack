import { NextResponse } from "next/server";
import crypto from "crypto";
import { CURRENT_URL } from "@/lib/constants";

const scopes = ["user:bot", "user:read:chat", "user:write:chat"].join(" ");

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: process.env.TWITCH_BOT_CLIENT_ID,
    redirect_uri: `${CURRENT_URL}${process.env.BOT_CALLBACK_URL}`,
    response_type: "code",
    scope: scopes,
    state: state,
  });

  const response = NextResponse.redirect(
    `${process.env.TWITCH_AUTH_URL}?${params.toString()}`,
  );

  response.cookies.set(process.env.BOT_STATE_TOKEN_NAME, state, {
    httpOnly: true,
    path: "/",
  });

  return response;
}
