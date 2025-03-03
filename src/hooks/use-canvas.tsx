import { Renderer } from "@/lib/canvas/renderer";
import { useEffect, useRef } from "react";

export function useCanvas({ timer, fps }: { timer: number; fps: number }) {
  const rendererRef = useRef(Renderer.create({ timer, fps }));
  const bgRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<HTMLCanvasElement>(null);
  const uiRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const renderer = rendererRef.current;

    async function setup() {
      // Only load layers if they haven't been loaded yet
      if (!renderer.isLayersLoaded) {
        renderer.loadLayers([bgRef.current, gameRef.current, uiRef.current]);
      }

      // Only start if not already running
      if (!renderer.isRunning) {
        try {
          await renderer.start();
        } catch (error) {
          console.error("Failed to start renderer:", error);
        }
      }
    }

    setup();

    return () => {
      // Don't stop the engine on unmount in development
      // This prevents the double-start issue in React strict mode
      if (process.env.NODE_ENV === "production" && renderer.isRunning) {
        renderer.stop();
      }
    };
  }, []);

  return {
    bgRef,
    gameRef,
    uiRef,
  };
}
