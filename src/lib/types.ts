export type Vector3 = [number, number, number];

interface BaseAnim {
  id: string;
  type: "text" | "loop" | "sprite";
  progress?: number;
  easing: "linear" | "easeOutCubic" | "easeOutQuint";
  speed?: number;
  delay?: number;
  translateX?: { start: number; end: number };
  translateY?: { start: number; end: number };
  float?: {
    x: number;
    y: number;
    speed: number;
  };
}

export interface TextAnim extends BaseAnim {
  type: "text";
  text: string;
  style: {
    color: [number, number, number];
    maxWidth: string;
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    position: "center" | "left" | "right" | "top" | "bottom";
    shadow?: {
      color: [number, number, number];
      x: number;
      y: number;
      size: number;
    };
    stroke?: { color: [number, number, number]; width: number };
  };
  kerning?: { start: number; end: number };
  index: number;
}

export interface SpriteAnim extends BaseAnim {
  type: "sprite";
  playback?: "once" | "loop";
  x?: number;
  y?: number;
  spriteProgress?: number;
  spriteDuration?: number;
  currentSprite?: number;
  sprites: { x: number; y: number; flipX?: boolean; flipY?: boolean }[];
  scale?: number;
  angle?: number;
  opacity?: { start: number; end: number };
}

export type Anim = TextAnim | SpriteAnim;

