"use client";

import { Canvas } from "@/components/canvas";
import { Debug } from "@/components/debug";
import { useSearch } from "@/components/search-provider";
import { useBlackjack } from "@/hooks/use-blackjack";
import { useEventBus } from "@/hooks/use-event-bus";
import { useMediator } from "@/hooks/use-mediator";
import { useTwitch } from "@/hooks/use-twtich";

export function Game() {
  const { timer, fps, debug, deck, channel } = useSearch();
  const eventBus = useEventBus(channel);
  const blackjack = useBlackjack(
    {
      deck,
      playerCount: 1,
      playerNames: ["Chat"],
    },
    eventBus,
  );
  useMediator({ buffer: 100, timer }, eventBus);
  const chat = useTwitch(
    {
      channel,
    },
    eventBus,
  );

  return (
    <>
      <Canvas channel={channel} fps={fps} mode="moderator" />
      <Debug blackjack={blackjack} enabled={debug} chat={chat} />
    </>
  );
}
