"use client";

import { Canvas } from "@/components/canvas";
import { Debug } from "@/components/debug";
import { useSearch } from "@/components/search-provider";
import { useBlackjack } from "@/hooks/use-blackjack";
import { useMediator } from "@/hooks/use-mediator";
import { useRenderer } from "@/hooks/use-renderer";
import { useTwitch } from "@/hooks/use-twitch";

export function Game() {
  const { timer, fps, debug, deck, channel } = useSearch();
  const renderer = useRenderer({
    mode: "moderator",
    fps,
    channel,
    caption: "connecting...",
  });
  const blackjack = useBlackjack({
    deck,
    playerCount: 1,
    playerNames: ["Chat"],
  });
  useMediator({ buffer: 100, timer });
  const chat = useTwitch({
    channel,
  });

  return (
    <>
      <Canvas renderer={renderer} />
      <Debug blackjack={blackjack} enabled={debug} chat={chat} />
    </>
  );
}
