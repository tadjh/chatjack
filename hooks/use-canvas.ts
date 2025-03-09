"use client";

import { useRef } from "react";

export function useCanvas() {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<HTMLCanvasElement>(null);
  const uiRef = useRef<HTMLCanvasElement>(null);

  return {
    bgRef,
    gameRef,
    uiRef,
  };
}
