import { CURRENT_URL } from "@/lib/constants";
import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect(CURRENT_URL);
  response.cookies.delete(process.env.TWITCH_ACCESS_TOKEN_NAME);
  response.cookies.delete(process.env.TWITCH_REFRESH_TOKEN_NAME);
  response.cookies.delete(process.env.TWITCH_STATE_NAME);
  return response;
}
