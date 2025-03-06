import { Twitch } from "@/lib/integrations/twitch.types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const access_token = request.nextUrl.searchParams.get("access_token");

  if (!access_token) {
    return NextResponse.json<Twitch.ValidateAccessTokenFailure>(
      {
        error: {
          status: 404,
          message: "No access token found",
        },
      },
      { status: 404, statusText: "No access token found" },
    );
  }

  try {
    const validateRes = await fetch(process.env.TWITCH_VALIDATE_URL, {
      headers: {
        Authorization: `OAuth ${access_token}`,
      },
    });

    const data = (await validateRes.json()) as
      | Twitch.ValidateAccessTokenSessionData
      | Twitch.ValidateAccessTokenError;

    if ("status" in data) {
      return NextResponse.json<Twitch.ValidateAccessTokenFailure>(
        {
          error: data,
        },
        validateRes,
      );
    }

    const response = NextResponse.json<Twitch.ValidateAccessTokenSuccess>({
      user: data,
    });

    return response;
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json<Twitch.ValidateAccessTokenFailure>(
      {
        error: {
          status: 500,
          message: `Token validation error: ${JSON.stringify(error)}`,
        },
      },
      { status: 500, statusText: "Token validation error" },
    );
  }
}
