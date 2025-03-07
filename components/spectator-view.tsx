"use client";

import { Canvas } from "@/components/canvas";
import { Footer } from "@/components/footer";
import { Header, HeaderItem } from "@/components/header";
import { useEventBus } from "@/hooks/use-event-bus";
import { usePusher } from "@/hooks/use-pusher";

export function SpectatorView({ channelName }: { channelName: string }) {
  const eventBus = useEventBus(channelName);
  const state = usePusher(channelName, eventBus);

  return (
    <>
      <Canvas {...state} mode="spectator" />
      <div className="relative z-50 flex h-full min-h-screen w-full flex-col gap-3">
        <Header>
          <HeaderItem className="opacity-50 hover:opacity-100">
            Spectating
          </HeaderItem>
        </Header>
        <div className="flex grow overflow-auto">
          <pre>{JSON.stringify(state, null, 2)}</pre>
        </div>
        <Footer className="opacity-50 hover:opacity-100" />
      </div>
    </>
  );
}
