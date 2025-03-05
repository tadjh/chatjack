"use client";

import { Canvas, CanvasProps } from "@/components/canvas";
import { useSearchParams } from "next/navigation";

export function Game() {
  const searchParams = useSearchParams();

  const props: CanvasProps = {
    deck: searchParams.get("deck"),
    debug: searchParams.get("debug"),
    channel: searchParams.get("channel"),
    timer: searchParams.get("timer"),
    fps: searchParams.get("fps"),
  };

  return <Canvas {...props} />;
}
