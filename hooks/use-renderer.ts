"use client";

import { Renderer, RenderMode } from "@/lib/canvas/renderer";
import { RefObject, useEffect, useRef } from "react";

export function useRenderer(
  bgRef: RefObject<HTMLCanvasElement | null>,
  gameRef: RefObject<HTMLCanvasElement | null>,
  uiRef: RefObject<HTMLCanvasElement | null>,
  channel: string,
  mode: RenderMode,
  fps?: number,
  caption?: string,
) {
  const rendererRef = useRef<Renderer | null>(null);

  useEffect(() => {
    if (!rendererRef.current) {
      rendererRef.current = Renderer.create({ channel, mode, fps, caption });
    }

    const setupRenderer = async () => {
      rendererRef.current?.updateOptions({ channel, mode, fps, caption });

      if (!rendererRef.current?.isSetup && bgRef && gameRef && uiRef) {
        await rendererRef.current?.setup([
          bgRef.current,
          gameRef.current,
          uiRef.current,
        ]);
        if (!rendererRef.current?.isRunning) {
          rendererRef.current?.start();
        }
      }
    };

    setupRenderer();

    return () => {
      if (rendererRef.current?.isRunning) {
        rendererRef.current.stop();
        rendererRef.current.teardown();
      }
    };
  }, [channel, mode, fps, caption, bgRef, gameRef, uiRef]);

  return rendererRef.current;
}
