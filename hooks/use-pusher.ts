"use client";

import { RendererOptions } from "@/lib/canvas/renderer";
import {
  AnimationEvent,
  ChatEvent,
  EventBus,
  EventMap,
  GameEvent,
  MediatorAnimationEvent,
  NETWORKED_UPDATE_EVENT,
} from "@/lib/event-bus";
import { COMMAND, EVENT } from "@/lib/types";
import { parseDebug } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import Pusher from "pusher-js";
import { useEffect, useState } from "react";
export function usePusher(channelName: string, eventBus: EventBus) {
  const searchParams = useSearchParams();
  const debug = searchParams.get("debug");
  const params = {
    debug: parseDebug(debug),
  };
  const [state, setState] = useState<RendererOptions>({
    ...params,
    channel: channelName,
    mode: "spectator",
    caption: "Loading...",
  });

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe(channelName);
    channel.bind("gamestate", (args: GameEvent) => {
      eventBus.emit("gamestate", args);
      if ("data" in args) {
        setState((prev) => ({ ...prev, ...args.data }));
      }
    });

    channel.bind("chat", (args: ChatEvent) => {
      eventBus.emit("chat", args);
      if ("data" in args) {
        setState((prev) => ({ ...prev, ...args.data }));
      }
    });

    channel.bind("mediator", (args: MediatorAnimationEvent) => {
      eventBus.emit("mediator", args);
      if ("data" in args) {
        setState((prev) => ({ ...prev, ...args.data }));
      }
    });

    channel.bind("state-snapshot", (snapshot: RendererOptions) => {
      // setState(snapshot);
    });

    return () => {
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, []);

  return state;
}
