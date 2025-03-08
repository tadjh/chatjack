"use client";

import { Canvas } from "@/components/canvas";
import { Footer } from "@/components/footer";
import { Header, HeaderItem } from "@/components/header";
import { useSearch } from "@/components/search-provider";
import { createSpectatorLink } from "@/components/spectator-link";
import { useEventBus } from "@/hooks/use-event-bus";
import { usePusher } from "@/hooks/use-pusher";

export function SpectatorView() {
  const { debug, channel } = useSearch();
  const eventBus = useEventBus(channel);
  const state = usePusher(channel, eventBus, debug);
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
          {debug && <pre>{JSON.stringify(state, null, 2)}</pre>}
        </div>
        <Footer className="opacity-50 hover:opacity-100" />
      </div>
    </>
  );
}

export function SpectatorIFrame({ channel }: { channel: string }) {
  const spectatorLink = createSpectatorLink(channel);

  return (
    <div className="absolute inset-0 z-10 h-full w-full overflow-hidden">
      {channel ? (
        <iframe src={spectatorLink} className="absolute right-0 bottom-0" />
      ) : (
        <div>No channel specified</div>
      )}
    </div>
  );
}
