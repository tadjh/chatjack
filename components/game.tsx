"use client";

import { Canvas } from "@/components/canvas";
import { Debug } from "@/components/debug";
import { useSearch } from "@/components/search-provider";
import { useBlackjack } from "@/hooks/use-blackjack";
import { useEventBus } from "@/hooks/use-event-bus";
import { useMediator } from "@/hooks/use-mediator";
import { useTwitch } from "@/hooks/use-twitch";
import { useMemo } from "react";

export function Game({
  channel,
  broadcaster_id,
}: {
  channel: string;
  broadcaster_id: string;
}) {
  const { timer, fps, debug, deck } = useSearch();
  const playerNamesMemo = useMemo(() => ["Chat"], []);
  useEventBus(channel);
  const blackjack = useBlackjack({
    deck,
    playerCount: 1,
    playerNames: playerNamesMemo,
  });
  useMediator({ buffer: 100, timer });
  const chat = useTwitch({
    channel,
    broadcaster_id,
  });

  return (
    <>
      <Canvas mode="play" channel={channel} fps={fps} caption="connecting..." />
      <Debug blackjack={blackjack} enabled={debug} chat={chat} />
    </>
  );
}
