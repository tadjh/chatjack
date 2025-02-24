import { IMAGE } from "./constants";
import { TimerEntity } from "./entity.timer";

export type Vector3 = [number, number, number];

export enum LAYER {
  BG = "Background",
  GAME = "Game",
  UI = "Ui",
}

export type Canvases = [
  HTMLCanvasElement | null,
  HTMLCanvasElement | null,
  HTMLCanvasElement | null,
];

export type Position =
  | "center"
  | "eyeline"
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "top left"
  | "top right"
  | "bottom left"
  | "bottom right";

interface BaseEntity {
  id: string;
  type: "text" | "sprite" | "animated-sprite" | "timer";
  progress?: number;
  easing: "linear" | "easeOutCubic" | "easeOutQuint";
  layer: LAYER;
  speed?: number;
  delay?: number;
  offsetX?: number;
  offsetY?: number;
  x?: number;
  y?: number;
  translateX?: { start: number; end: number };
  translateY?: { start: number; end: number };
  opacity?: { start: number; end: number };
  float?: {
    x: number;
    y: number;
    speed: number;
  };
  position?: Position;
  onBeing?: () => void;
  onEnd?: () => void;
}

export interface TextEntity extends BaseEntity {
  type: "text";
  text: string;
  style: {
    textAlign?: CanvasTextAlign;
    color: [number, number, number];
    maxWidth: string;
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    shadow?: {
      color: [number, number, number];
      x: number;
      y: number;
      size: number;
    };
    stroke?: { color: [number, number, number]; width: number };
  };
  kerning?: { start: number; end: number };
  index?: number;
  clamp?: boolean;
}

interface SpriteCoordinates {
  x: number;
  y: number;
  flipX?: boolean;
  flipY?: boolean;
}

interface BaseSprite extends BaseEntity {
  src: IMAGE;
  sprites: [SpriteCoordinates, ...SpriteCoordinates[]];
  x?: number;
  y?: number;
  spriteWidth: number;
  spriteHeight: number;
  spriteIndex?: number;
  scale?: number;
  angle?: number;
  shadow?: {
    color: [number, number, number];
    opacity: number;
    offsetX: number;
    offsetY: number;
    blur: number;
  };
}

export interface SpriteEntity extends BaseSprite {
  type: "sprite";
}

export type Playback = "once" | "loop";

export interface AnimatedSpriteEntity extends BaseSprite {
  type: "animated-sprite";
  playback: Playback;
  spriteElapsed?: number;
  spriteDuration: number;
  spriteIndex: number;
}

export type EntityInterface =
  | TextEntity
  | SpriteEntity
  | AnimatedSpriteEntity
  | TimerEntity;

export enum State {
  Init,
  Dealing,
  PlayerHit,
  PlayerStand,
  PlayerSplit,
  RevealHoleCard,
  DealerHit,
  DealerStand,
  PlayerBust,
  DealerBust,
  Push,
  PlayerBlackjack,
  DealerBlackjack,
  PlayerWin,
  DealerWin,
}

export interface AnimationPhase<
  Phase extends string,
  Props extends Record<string, number>,
> {
  name: Phase;
  duration: number; // in seconds or ticks
  easing?: (t: number) => Props;
  // Function to compute the property value from a local progress (0 to 1)
  interpolate?: (t: number) => Props;
}

export interface AnimationSpec<
  Phase extends string,
  Props extends Record<string, number>,
> {
  phases: AnimationPhase<Phase, Props>[];
  props: Props;
  // Optional overall callbacks:
  onBegin?: (layer: LAYER, id: string) => void;
  onEnd?: (layer: LAYER, id: string) => void;
}
export type TimerEntityPhaseTypes = "zoom-in" | "countdown" | "zoom-out";

export type TimerEntityPhaseProps = {
  angle: number;
  radius: number;
};

interface AnimationPhases<T extends string, P extends Record<string, number>> {
  phases: AnimationPhase<T, P>[];
  props?: P;
  // Optional overall callbacks:
  onBegin?: (layer: LAYER, id: string) => void;
  onEnd?: (layer: LAYER, id: string) => void;
}

export interface TimerEntityProps
  extends AnimationPhases<TimerEntityPhaseTypes, TimerEntityPhaseProps> {
  id: string;
  layer: LAYER;
  position: Position;
  color: Vector3;
  backgroundColor?: Vector3;
  backgroundScale?: number;
  strokeColor?: Vector3;
  strokeScale?: number;
  counterclockwise?: boolean;
  radius: number;
  startAngle: number;
  rotation: number;
}
