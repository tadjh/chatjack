import { Renderer, RendererOptions } from "@/lib/canvas/renderer";
import { EventBus } from "@/lib/event-bus";
import { useRef } from "react";

export function useRenderer(options: RendererOptions, eventBus?: EventBus) {
  const rendererRef = useRef<Renderer | null>(null);

  if (!rendererRef.current) {
    rendererRef.current = Renderer.create(options, eventBus);
  }

  return rendererRef.current;
}
