import { Twitch } from "@/lib/integrations/twitch.types";
import { getModeratedChannelsKey } from "@/lib/utils";
import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get("cursor");
  const user_id = request.nextUrl.searchParams.get("user_id");
  const access_token = request.nextUrl.searchParams.get("access_token");
  if (!user_id) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400, statusText: "User ID is required" },
    );
  }

  if (!access_token) {
    return NextResponse.json(
      { error: "Access token is required" },
      { status: 400, statusText: "Access token is required" },
    );
  }

  try {
    const cacheKey = getModeratedChannelsKey(user_id);

    const cachedChannels =
      await kv.get<Twitch.ModeratedChannelsResponse>(cacheKey);

    if (cachedChannels) {
      return NextResponse.json(cachedChannels);
    }

    const params = new URLSearchParams({
      user_id,
      first: "20",
    });

    if (cursor) {
      params.set("after", cursor);
    }

    const response = await fetch(
      `${process.env.TWITCH_MODERATED_CHANNELS_URL}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Client-Id": process.env.TWITCH_CLIENT_ID,
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: response.statusText },
        { status: response.status },
      );
    }

    const payload = (await response.json()) as Twitch.ModeratedChannelsResponse;

    await kv.set(cacheKey, payload, {
      ex: 60 * 60 * 24, // 24 hours
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching moderated channels:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
