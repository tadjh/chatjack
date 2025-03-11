import {
  ValidateAccessTokenError,
  ValidateAccessTokenFailure,
  ValidateAccessTokenSessionData,
  ValidateAccessTokenSuccess,
} from "@/lib/integrations/twitch.types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const access_token = request.nextUrl.searchParams.get("access_token");

  if (!access_token) {
    return NextResponse.json<ValidateAccessTokenFailure>(
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
      cache: "no-store",
    });

    const data = (await validateRes.json()) as
      | ValidateAccessTokenSessionData
      | ValidateAccessTokenError;

    if ("status" in data) {
      return NextResponse.json<ValidateAccessTokenFailure>(
        {
          error: data,
        },
        validateRes,
      );
    }

    const response = NextResponse.json<ValidateAccessTokenSuccess>({
      user: data,
    });

    // Add cache control headers based on token expiration
    // Twitch tokens typically expire in hours, so cache accordingly
    if ("expires_in" in data) {
      // If token has expiration info, use it (subtract a safety margin)
      const maxAge = Math.max(0, data.expires_in - 300);
      response.headers.set("Cache-Control", `private, max-age=${maxAge}`);
    } else {
      // Default cache time (1 hour)
      response.headers.set("Cache-Control", "private, max-age=3600");
    }

    // console.log("user id", data.user_id);

    return response;
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json<ValidateAccessTokenFailure>(
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
