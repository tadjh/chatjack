import { Engine } from "@/lib/canvas/engine";
import { useEffect, useRef, useState } from "react";

export function useEngine() {
  const engineRef = useRef(Engine.create());
  const bgRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<HTMLCanvasElement>(null);
  const uiRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const engine = engineRef.current;

    async function setup() {
      // Only load layers if they haven't been loaded yet
      if (!engine.isLayersLoaded) {
        engine.loadLayers([bgRef.current, gameRef.current, uiRef.current]);
      }

      // Only start if not already running
      if (!engine.isRunning) {
        try {
          await engine.start();
          if (isMounted) {
            setIsReady(true);
          }
        } catch (error) {
          console.error("Failed to start engine:", error);
        }
      }
    }

    setup();

    return () => {
      isMounted = false;
      // Don't stop the engine on unmount in development
      // This prevents the double-start issue in React strict mode
      if (process.env.NODE_ENV === "production" && engine.isRunning) {
        engine.stop();
      }
    };
  }, []);

  return {
    bgRef,
    gameRef,
    uiRef,
    engine: engineRef.current,
    isReady,
  };
}
