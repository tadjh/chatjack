"use client";

import { useCanvas } from "@/hooks/use-canvas";
import { useRenderer } from "@/hooks/use-renderer";
import { RendererOptions } from "@/lib/canvas/renderer";

export function Canvas({ channel, mode, fps, caption }: RendererOptions) {
  const { bgRef, gameRef, uiRef } = useCanvas();
  useRenderer(bgRef, gameRef, uiRef, channel, mode, fps, caption);
  return (
    <>
      <canvas ref={bgRef} className="absolute" key="bg-canvas" />
      <canvas ref={gameRef} className="absolute" key="game-canvas" />
      <canvas ref={uiRef} className="absolute" key="ui-canvas" />
    </>
  );
}
