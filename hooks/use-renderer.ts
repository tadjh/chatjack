"use client";

import { Renderer, RendererOptions } from "@/lib/canvas/renderer";
import { useEffect, useRef } from "react";

export function useRenderer({ channel, mode, fps, caption }: RendererOptions) {
  const rendererRef = useRef<Renderer | null>(null);

  if (!rendererRef.current) {
    rendererRef.current = Renderer.create({ channel, mode, fps, caption });
  }

  useEffect(() => {
    if (!rendererRef.current) {
      rendererRef.current = Renderer.create({ channel, mode, fps, caption });
    }

    const setupRenderer = async () => {
      await rendererRef.current?.setup();
      rendererRef.current?.updateOptions({ channel, mode, fps, caption });

      if (rendererRef.current && !rendererRef.current.isRunning) {
        rendererRef.current.start();
      }
    };

    setupRenderer();

    return () => {
      if (rendererRef.current?.isRunning) {
        rendererRef.current.stop();
        rendererRef.current.teardown();
      }
    };
  }, [channel, mode, fps, caption]);

  return rendererRef.current;
}
