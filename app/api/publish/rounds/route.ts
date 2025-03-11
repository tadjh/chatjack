import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { cookies } from "next/headers";

const KEY = "__rounds_chatjack";

export async function GET() {
  try {
    const count = await kv.get<number>(KEY);

    if (count === null) {
      await kv.set(KEY, 0);
      return NextResponse.json({ rounds: 0 });
    }

    const rounds = count ? Number(count) : 0;
    return NextResponse.json({ rounds });
  } catch (error) {
    console.error("Error fetching round count:", error);
    return NextResponse.json(
      { error: "Failed to fetch round count" },
      { status: 500 },
    );
  }
}

export async function POST() {
  const cookieStore = await cookies();
  const userAccessToken = cookieStore.get(process.env.ACCESS_TOKEN_NAME);

  if (!userAccessToken) {
    return NextResponse.json(
      {
        error: `You don't have permission to perform this action.`,
      },
      { status: 401 },
    );
  }

  try {
    const rounds = await kv.incr(KEY);
    return NextResponse.json({ rounds });
  } catch (error) {
    console.error("Error incrementing round count:", error);
    return NextResponse.json(
      { error: "Failed to increment round count" },
      { status: 500 },
    );
  }
}
