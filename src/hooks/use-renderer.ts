import { Dealer } from "@/lib/dealer";
import { Player } from "@/lib/player";
import { Renderer } from "@/lib/renderer";
import { State } from "@/lib/types";
import { useEffect, useRef } from "react";

const renderer = new Renderer();

export function useRenderer(
  bgRef: React.RefObject<HTMLCanvasElement | null>,
  gameRef: React.RefObject<HTMLCanvasElement | null>,
  uiRef: React.RefObject<HTMLCanvasElement | null>,
  dealer: Dealer,
  player: Player,
  state: State,
  isGameover: boolean
) {
  const rendererRef = useRef<Renderer>(renderer);

  useEffect(() => {
    const renderer = rendererRef.current;
    renderer.start([bgRef.current, gameRef.current, uiRef.current]);
    return () => {
      renderer.stop();
    };
  }, [bgRef, gameRef, uiRef]);

  useEffect(() => {
    rendererRef.current.update({
      dealer,
      player,
      state,
      isGameover,
    });
  }, [dealer, player, state, isGameover]);
}

