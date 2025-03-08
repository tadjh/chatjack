"use client";

import { Canvas } from "@/components/canvas";
import { useRenderer } from "@/hooks/use-renderer";
import { RendererOptions } from "@/lib/canvas/renderer";

export function Renderer(options: RendererOptions) {
  const renderer = useRenderer(options);
  return <Canvas renderer={renderer} />;
}
