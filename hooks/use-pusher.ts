"use client";

import { PusherService, PusherState } from "@/lib/services/pusher-service";
import { useEffect, useState } from "react";

export interface UsePusherOptions {
  channel: string;
  debug?: boolean;
}

export function usePusher({ channel, debug }: UsePusherOptions): PusherState {
  const [state, setState] = useState<PusherState>(() => ({
    debug: debug ?? false,
    channel: channel,
    mode: "spectate",
    caption: "initializing...",
    update: {
      type: "",
      data: {},
    },
  }));

  useEffect(() => {
    if (!channel) return;

    const pusherService = PusherService.create();

    pusherService.connect(channel);

    setState(pusherService.getState());

    // const unsubscribe =
    pusherService.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      // unsubscribe();
      pusherService.disconnect();
    };
  }, [channel]);

  return state;
}
