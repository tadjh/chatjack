import { Debug } from "@/components/debug";
import { useBlackjack } from "@/hooks/use-blackjack";
import { useCanvas } from "@/hooks/use-canvas";
import { useMediator } from "@/hooks/use-mediator";
import { useTwitch } from "@/hooks/use-twtich";

export interface CanvasProps {
  deck: string | null;
  channel: string | null;
  debug: string | null;
  timer: string | null;
  fps: string | null;
}

export function Canvas({ deck, channel, debug, timer, fps }: CanvasProps) {
  const timerValue = parseTimer(timer);
  const fpsValue = parseFps(fps);
  const isDebug = debug !== null && debug !== "false";
  const { bgRef, gameRef, uiRef } = useCanvas({
    timer: timerValue,
    fps: fpsValue,
  });
  const blackjack = useBlackjack({
    deck,
    playerCount: 1,
    playerNames: ["Chat"],
  });
  useMediator();
  const chat = useTwitch({
    channel: channel ?? "",
    voteDuration: timerValue,
    debug: isDebug,
  });

  return (
    <>
      <canvas ref={bgRef} className="absolute" />
      <canvas ref={gameRef} className="absolute" />
      <canvas ref={uiRef} className="absolute" />
      <Debug blackjack={blackjack} disabled={!isDebug} chat={chat} />
    </>
  );
}

const parseTimer = (value: string | null) => {
  if (!value) return 10;
  const num = parseInt(value);
  return isNaN(num) ? 10 : num;
};

const parseFps = (value: string | null) => {
  if (!value) return 12;
  const num = parseInt(value);
  return isNaN(num) ? 12 : num;
};
