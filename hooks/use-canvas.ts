"use client";

import { Renderer } from "@/lib/canvas/renderer";
import { useEffect, useRef } from "react";

export function useCanvas(renderer: Renderer) {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<HTMLCanvasElement>(null);
  const uiRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!renderer.isLayersLoaded) {
      renderer.loadLayers([bgRef.current, gameRef.current, uiRef.current]);
    }
  }, []);

  return {
    bgRef,
    gameRef,
    uiRef,
  };
}
