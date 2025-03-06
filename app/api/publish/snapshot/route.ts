import { RendererOptions, rendererOptionsSchema } from "@/lib/canvas/renderer";
import { getSnapshotKey } from "@/lib/utils";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel");
  if (!channel) {
    return NextResponse.json(
      { message: "A channel name is required" },
      { status: 400 },
    );
  }

  const key = getSnapshotKey(channel);
  const snapshot = await kv.get<RendererOptions>(key);
  if (!snapshot) {
    return NextResponse.json({ message: "No snapshot found" }, { status: 404 });
  }
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  try {
    const state = rendererOptionsSchema.parse(await request.json());

    const key = getSnapshotKey(state.channel);
    await kv.set<RendererOptions>(key, state);
    return NextResponse.json({ message: `${state.channel} snapshot set` });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid state", errors: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Failed to set snapshot" },
      { status: 500 },
    );
  }
}
