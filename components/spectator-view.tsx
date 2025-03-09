"use client";

import { Canvas } from "@/components/canvas";
import { Container } from "@/components/container";
import { Footer } from "@/components/footer";
import { Header, HeaderItem } from "@/components/header";
import { Main } from "@/components/main";
import { useSearch } from "@/components/search-provider";
import { createSpectatorLink } from "@/components/spectator-link";
import { usePusher } from "@/hooks/use-pusher";

export function SpectatorView({ channel }: { channel: string }) {
  const { debug, fps } = useSearch();
  const state = usePusher({ channel, debug });
  return (
    <>
      <Canvas
        channel={channel}
        mode="spectate"
        fps={fps}
        caption="connecting..."
      />
      <Container>
        <Header>
          <HeaderItem className="cursor-none opacity-50 hover:opacity-100">
            Spectating
          </HeaderItem>
        </Header>
        <Main className="flex-start">
          {debug && <pre>{JSON.stringify(state, null, 2)}</pre>}
        </Main>
        <Footer className="opacity-50 hover:opacity-100" />
      </Container>
    </>
  );
}

export function SpectatorIFrame({ channel }: { channel: string }) {
  const spectatorLink = createSpectatorLink(channel);

  return (
    <div className="absolute right-0 bottom-0 z-10 border-2">
      <iframe
        src={spectatorLink}
        draggable
        className="aspect-video min-h-auto min-w-md"
      />
    </div>
  );
}
