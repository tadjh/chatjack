import { Debug } from "@/components/debug";
import { useBlackjack } from "@/hooks/use-blackjack";
import { useCanvas } from "@/hooks/use-canvas";
import { useMediator } from "@/hooks/use-mediator";
import { useTwitch } from "@/hooks/use-twtich";

export interface CanvasProps {
  fixedDeck: string | null;
  channel: string | null;
  debug: string | null;
}

export function Canvas({ fixedDeck, channel, debug }: CanvasProps) {
  const isDebug = debug !== null && debug !== "false";
  const { bgRef, gameRef, uiRef } = useCanvas();
  const blackjack = useBlackjack({
    fixedDeck,
    playerCount: 1,
    playerNames: ["Chat"],
  });
  useMediator();
  useTwitch({ channel: channel ?? "", voteDuration: 10, debug: isDebug });

  return (
    <>
      <canvas ref={bgRef} />
      <canvas ref={gameRef} />
      <canvas ref={uiRef} />
      <Debug blackjack={blackjack} disabled={!isDebug} />
    </>
  );
}

