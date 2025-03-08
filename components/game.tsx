"use client";

import { Canvas } from "@/components/canvas";
import { Debug } from "@/components/debug";
import { useSearch } from "@/components/search-provider";
import { useBlackjack } from "@/hooks/use-blackjack";
import { useEventBus } from "@/hooks/use-event-bus";
import { useMediator } from "@/hooks/use-mediator";
import { useRenderer } from "@/hooks/use-renderer";
import { useTwitch } from "@/hooks/use-twitch";
import { useMemo } from "react";

export function Game() {
  const { timer, fps, debug, deck, channel } = useSearch();
  const playerNamesMemo = useMemo(() => ["Chat"], []);
  useEventBus(channel);
  const renderer = useRenderer({
    mode: "moderator",
    fps,
    channel,
    caption: "connecting...",
  });
  const blackjack = useBlackjack({
    deck,
    playerCount: 1,
    playerNames: playerNamesMemo,
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
