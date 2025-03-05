import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect(process.env.VERCEL_URL);
  response.cookies.delete(process.env.TWITCH_ACCESS_TOKEN_NAME);
  response.cookies.delete(process.env.TWITCH_REFRESH_TOKEN_NAME);
  return response;
}
