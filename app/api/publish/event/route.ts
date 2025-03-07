import { EventBusData, eventBusDataSchema } from "@/lib/event-bus";
import { NextResponse } from "next/server";
import Pusher from "pusher";
import { ZodError } from "zod";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export async function POST(request: Request) {
  const body = (await request.json()) as EventBusData;

  try {
    const { channel, eventName, args } = eventBusDataSchema.parse(body);
    await pusher.trigger(channel, eventName, args);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pusher error", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join("\n") },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pusher error" },
      { status: 500 },
    );
  }
}
