import { Renderer } from "@/lib/renderer";
import { useEffect, useRef } from "react";

const renderer = new Renderer();

export function useRenderer() {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<HTMLCanvasElement>(null);
  const uiRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer>(renderer);

  useEffect(() => {
    const renderer = rendererRef.current;
    renderer.start([bgRef.current, gameRef.current, uiRef.current]);
    return () => {
      renderer.stop();
    };
  }, [bgRef, gameRef, uiRef]);

  return { bgRef, gameRef, uiRef, rendererRef };
}
