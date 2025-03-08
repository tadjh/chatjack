"use client";

import { useCanvas } from "@/hooks/use-canvas";
import { useRenderer } from "@/hooks/use-renderer";
import { useEventBus } from "@/hooks/use-event-bus";
import { RendererOptions } from "@/lib/canvas/renderer";
import { useEffect } from "react";

export function Canvas(options: RendererOptions) {
  const eventBus = useEventBus(options.channel);
  const renderer = useRenderer(options, eventBus);
  const { bgRef, gameRef, uiRef } = useCanvas(renderer);

  useEffect(() => {
    async function setup() {
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

  return (
    <>
      <canvas ref={bgRef} className="absolute" />
      <canvas ref={gameRef} className="absolute" />
      <canvas ref={uiRef} className="absolute" />
    </>
  );
}
