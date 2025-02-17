export type Vector3 = [number, number, number];

export type TextAnim = {
  id: string;
  type: "text";
  text: string;
  color: [number, number, number];
  progress: number;
  fadeInDelay: number;
  maxWidth: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  position: "center" | "left" | "right" | "top" | "bottom";
  slideX: { start: number; end: number };
  slideY: { start: number; end: number };
  kerning: { start: number; end: number };
  shadow?: {
    color: [number, number, number];
    x: number;
    y: number;
    size: number;
  };
  stroke?: { width: number; color: [number, number, number] };
};

export type LoopAnim = {
  id: string;
  type: "loop";
  progress: number;
  frame: number;
  currentFrame: number;
  speed: number;
  frames: { x: number; y: number; flipX?: boolean; flipY?: boolean }[];
  fadeInDelay: number;
  maxWidth: string;
  opacity: { start: number; end: number };
  offsetX: { start: number; end: number };
  offsetY: { start: number; end: number };
};

export type SpriteAnim = {
  id: string;
  type: "sprite";
  progress: number;
  sprite: { x: number; y: number };
  fadeInDelay: number;
  scale: number;
  angle: number;
  opacity: { start: number; end: number };
  offsetX: { start: number; end: number };
  offsetY: { start: number; end: number };
};

export type Anim = TextAnim | LoopAnim | SpriteAnim;

