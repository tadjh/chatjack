import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(process.env.REFRESH_TOKEN_NAME);

  if (!refreshToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken.value,
  });

  try {
    const tokenRes = await fetch(process.env.TWITCH_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: tokenRes.statusText },
        { status: tokenRes.status },
      );
    }

    const tokenData = await tokenRes.json();

    const response = NextResponse.redirect(new URL("/", request.url));

    response.cookies.set(
      process.env.ACCESS_TOKEN_NAME,
      tokenData.access_token,
      {
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        expires: new Date(Date.now() + tokenData.expires_in * 1000),
      },
    );

    if (tokenData.refresh_token) {
      response.cookies.set(
        process.env.REFRESH_TOKEN_NAME,
        tokenData.refresh_token,
        {
          httpOnly: true,
          path: "/",
          secure: process.env.NODE_ENV === "production",
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      );
    }

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
