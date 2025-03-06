import { RendererOptions, rendererOptionsSchema } from "@/lib/canvas/renderer";
import { EventMap } from "@/lib/event-bus";
import { NextResponse } from "next/server";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export async function POST(request: Request) {
  const { channel, event, data } = (await request.json()) as {
    channel: string;
    event: keyof EventMap;
    data: EventMap[keyof EventMap];
  };

  try {
    // TODO: parse the data based on the data.type
    // const parsedData = rendererOptionsSchema.parse(data);
    await pusher.trigger(channel, event, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pusher error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pusher error" },
      { status: 500 },
    );
  }
}
