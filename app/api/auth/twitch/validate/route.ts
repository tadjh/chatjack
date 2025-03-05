import { InvalidAuthStatus } from "@/lib/types";
import { ValidAuthStatus } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const access_token = request.cookies.get(
    process.env.TWITCH_ACCESS_TOKEN_NAME,
  )?.value;

  if (!access_token) {
    return NextResponse.json<InvalidAuthStatus>({
      error: {
        status: 404,
        message: "No access token found",
      },
    });
  }

  try {
    const validateRes = await fetch(process.env.TWITCH_VALIDATE_URL, {
      headers: {
        Authorization: `OAuth ${access_token}`,
      },
    });

    const data = await validateRes.json();

    if (validateRes.status === 401) {
      return NextResponse.json<InvalidAuthStatus>({
        error: data,
      });
    }

    return NextResponse.json<ValidAuthStatus>({
      user: data,
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json<InvalidAuthStatus>({
      error: {
        status: 500,
        message: `Token validation error: ${JSON.stringify(error)}`,
      },
    });
  }
}
