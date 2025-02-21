export type Vector3 = [number, number, number];

export enum LayerOrder {
  Background,
  Foreground,
  _ALL,
}

interface BaseEntity {
  id: string;
  type: "text" | "sprite" | "animated-sprite";
  progress?: number;
  easing: "linear" | "easeOutCubic" | "easeOutQuint";
  layer: LayerOrder;
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
  position?:
    | "center"
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "top left"
    | "top right"
    | "bottom left"
    | "bottom right";
  onBeing?: () => void;
  onEnd?: () => void;
}

export interface Text extends BaseEntity {
  type: "text";
  text: string;
  style: {
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

interface Spritesheet {
  x: number;
  y: number;
  flipX?: boolean;
  flipY?: boolean;
}

interface BaseSprite extends BaseEntity {
  sprites: [Spritesheet, ...Spritesheet[]];
  spriteWidth: number;
  spriteHeight: number;
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

export interface Sprite extends BaseSprite {
  type: "sprite";
}

export type Playback = "once" | "loop";

export interface AnimatedSprite extends BaseSprite {
  type: "animated-sprite";
  playback: Playback;
  spriteElapsed?: number;
  spriteDuration: number;
  spriteIndex: number;
}

export type Entity = Text | Sprite | AnimatedSprite;

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
  PlayerBlackJack,
  DealerBlackJack,
  PlayerWin,
  DealerWin,
}

export type GameoverStates =
  | State.PlayerBust
  | State.DealerBust
  | State.Push
  | State.PlayerBlackJack
  | State.DealerBlackJack
  | State.PlayerWin
  | State.DealerWin;

