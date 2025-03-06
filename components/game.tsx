"use client";

import { Canvas } from "@/components/canvas";
import { Debug } from "@/components/debug";
import { useSearch } from "@/components/search-provider";
import { useBlackjack } from "@/hooks/use-blackjack";
import { useEventBus } from "@/hooks/use-event-bus";
import { useMediator } from "@/hooks/use-mediator";
import { useTwitch } from "@/hooks/use-twtich";
import { parseDebug } from "@/lib/utils";

export interface CanvasProps {
  deck: string | null;
  channel: string | null;
  debug: string | null;
  timer: string | null;
  fps: string | null;
}

export function Game() {
  const { timer, fps, debug, deck, channel } = useSearch();
  const eventBus = useEventBus(channel ?? "");
  const timerValue = parseTimer(timer);
  const fpsValue = parseFps(fps);
  const blackjack = useBlackjack(
    {
      deck,
      playerCount: 1,
      playerNames: [encodeURIComponent(channel ?? "Chat")],
    },
    eventBus,
  );
  useMediator(eventBus);
  const fallbackChannel = channel ?? "";
  const chat = useTwitch(
    {
      channel: fallbackChannel,
      timer: timerValue,
    },
    eventBus,
  );

  const isDebug = parseDebug(debug);

  return (
    <>
      <Canvas
        channel={fallbackChannel}
        fps={fpsValue}
        timer={timerValue}
        mode="moderator"
      />
      <Debug blackjack={blackjack} disabled={!isDebug} chat={chat} />
    </>
  );
}

const parseTimer = (value: string | null) => {
  if (!value) return;
  const num = parseInt(value);
  if (isNaN(num)) return;
  return num;
};

const parseFps = (value: string | null) => {
  if (!value) return;
  const num = parseInt(value);
  if (isNaN(num)) return;
  return num;
};
