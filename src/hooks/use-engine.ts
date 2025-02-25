import { Engine } from "@/lib/engine";
import { useEffect, useRef } from "react";

const engine = new Engine();

export function useEngine() {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<HTMLCanvasElement>(null);
  const uiRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine>(engine);

  useEffect(() => {
    const engine = engineRef.current;
    engine.start([bgRef.current, gameRef.current, uiRef.current]);
    return () => {
      engine.stop();
    };
  }, [bgRef, gameRef, uiRef]);

  return { bgRef, gameRef, uiRef, engineRef };
}
