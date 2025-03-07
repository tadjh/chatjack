"use client";

import { Canvas } from "@/components/canvas";
import { Header, HeaderItem } from "@/components/header";
import { useEventBus } from "@/hooks/use-event-bus";
import { usePusher } from "@/hooks/use-pusher";

export function SpectatorView({ channelName }: { channelName: string }) {
  const eventBus = useEventBus(channelName);
  const state = usePusher(channelName, eventBus);

  return (
    <>
      <Canvas {...state} mode="spectator" />
      <div className="relative z-50 flex min-h-screen flex-col gap-3">
        <Header>
          <HeaderItem className="opacity-50">Spectating</HeaderItem>
        </Header>
        <pre>{JSON.stringify(state, null, 2)}</pre>
      </div>
    </>
  );
}
