export type Vector3 = [number, number, number];

interface BaseAnim {
  id: string;
  type: "text" | "loop" | "sprite";
  progress: number;
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
}

export interface LoopAnim extends BaseAnim {
  type: "loop";
  stepProgress: number;
  stepDuration: number;
  currentStep: number;
  steps: { x: number; y: number; flipX?: boolean; flipY?: boolean }[];
  opacity: { start: number; end: number };
}

export interface SpriteAnim extends BaseAnim {
  type: "sprite";
  sprite: { x: number; y: number };
  scale: number;
  angle: number;
  opacity: { start: number; end: number };
}

export type Anim = TextAnim | LoopAnim | SpriteAnim;

