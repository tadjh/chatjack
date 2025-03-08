"use client";

import { useCanvas } from "@/hooks/use-canvas";
import { Renderer } from "@/lib/canvas/renderer";

export function Canvas({ renderer }: { renderer: Renderer }) {
  const { bgRef, gameRef, uiRef } = useCanvas(renderer);

  return (
    <>
      <canvas ref={bgRef} className="absolute" />
      <canvas ref={gameRef} className="absolute" />
      <canvas ref={uiRef} className="absolute" />
    </>
  );
}
