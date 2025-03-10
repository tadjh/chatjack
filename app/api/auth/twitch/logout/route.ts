import { CURRENT_URL } from "@/lib/constants";
import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect(CURRENT_URL);
  response.cookies.delete(process.env.ACCESS_TOKEN_NAME);
  response.cookies.delete(process.env.REFRESH_TOKEN_NAME);
  response.cookies.delete(process.env.STATE_TOKEN_NAME);
  return response;
}
