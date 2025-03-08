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

    rendererRef.current.setup();
    rendererRef.current.updateOptions({ channel, mode, fps, caption });

    if (!rendererRef.current.isRunning) {
      rendererRef.current.start();
    }

    return () => {
      if (rendererRef.current?.isRunning) {
        rendererRef.current.stop();
        rendererRef.current.teardown();
        rendererRef.current = null;
      }
    };
  }, [channel, mode, fps, caption]);

  return rendererRef.current;
}
