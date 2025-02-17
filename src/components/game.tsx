import { fonts, spriteSheet } from "@/lib/constants";
import { Renderer } from "@/lib/renderer";
import { useEffect, useRef } from "react";

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new Renderer(canvasRef.current);

    const loadAssets = async () => {
      [...fonts.entries()].forEach(async ([name, url]) => {
        await renderer.loadFont(name, url);
      });
      await renderer.createSpriteSheet(spriteSheet);
    };

    loadAssets().then(() => {
      renderer.start();
    });

    return () => {
      renderer.stop();
    };
  }, []);

  return <canvas id="canvas" ref={canvasRef}></canvas>;
}

