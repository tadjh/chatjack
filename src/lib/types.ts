import { IMAGE } from "./constants";
import { SpriteEntity } from "./entity.sprite";
import { TextEntity } from "./entity.text";
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

export enum POSITION {
  CENTER = "center",
  EYELINE = "eyeline",
  LEFT = "left",
  RIGHT = "right",
  TOP = "top",
  BOTTOM = "bottom",
  TOP_LEFT = "top left",
  TOP_RIGHT = "top right",
  BOTTOM_LEFT = "bottom left",
  BOTTOM_RIGHT = "bottom right",
}

export interface SpriteCoordinates {
  x: number;
  y: number;
  flipX?: boolean;
  flipY?: boolean;
}

type Shadow =
  | {
      shadowColor: string;
      shadowOffsetX: number;
      shadowOffsetY: number;
      shadowBlur: number;
    }
  | {
      shadowColor?: string;
      shadowOffsetX?: number;
      shadowOffsetY?: number;
      shadowBlur?: number;
    };

type Stroke =
  | {
      strokeColor: string;
      strokeWidth: number;
    }
  | { strokeColor: undefined; strokeWidth?: number };

export type Playback = "once" | "loop";

export type EntityTypes = SpriteEntity | TextEntity | TimerEntity;
export type EntityProps =
  | SpriteEntityProps
  | TextEntityProps
  | TimerEntityProps;

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
  magnitude?: number;
  loop?: boolean;
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

export type BaseEntityType = "text" | "sprite" | "timer";
export type BaseEntityProps<
  Phase extends string,
  Props extends Record<string, number>,
> = AnimationSpec<Phase, Props> & {
  id: string;
  type: BaseEntityType;
  layer: LAYER;
  position?: POSITION;
  delay?: number;
  x?: number;
  y?: number;
  offsetX?: number;
  offsetY?: number;
  opacity?: number;
} & Shadow;

export type BaseEntityAnimationTypes =
  | "slide-in-top"
  | "slide-in-right"
  | "slide-in-bottom"
  | "slide-in-left"
  | "slide-out-top"
  | "slide-out-right"
  | "slide-out-bottom"
  | "slide-out-left"
  | "fade-slide-in-top"
  | "fade-slide-in-right"
  | "fade-slide-in-bottom"
  | "fade-slide-in-left"
  | "fade-slide-out-top"
  | "fade-slide-out-right"
  | "fade-slide-out-bottom"
  | "fade-slide-out-left"
  | "float-x"
  | "float-y";

export type BaseAnimationProps = {
  opacity: number;
  offsetX: number;
  offsetY: number;
};

export type TextEntityAnimationTypes =
  | BaseEntityAnimationTypes
  | "fade-slide-kerning-in-bottom";
export type TextEntityAnimationProps = BaseAnimationProps & {
  kerning: number;
};

type BaseEntityNoProps<
  AnimationTypes extends BaseEntityAnimationTypes | string,
  AnimationProps extends BaseAnimationProps & Record<string, number>,
> = Omit<BaseEntityProps<AnimationTypes, AnimationProps>, "props">;

export type TextEntityProps = BaseEntityNoProps<
  TextEntityAnimationTypes,
  TextEntityAnimationProps
> & {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  textBaseline: CanvasTextBaseline;
  textAlign: CanvasTextAlign;
  color: string | CanvasGradient | CanvasPattern;
} & Stroke;

export type TimerEntityAnimationTypes = "zoom-in" | "countdown" | "zoom-out";
export type TimerEntityAnimationProps = BaseAnimationProps & {
  angle: number;
  radius: number;
};
export type TimerEntityProps = BaseEntityNoProps<
  TimerEntityAnimationTypes,
  TimerEntityAnimationProps
> & {
  type: "timer";
  color: string | CanvasGradient | CanvasPattern;
  backgroundColor: string | CanvasGradient | CanvasPattern;
  backgroundScale?: number;
  strokeColor?: string | CanvasGradient | CanvasPattern;
  strokeWidth?: number;
  counterclockwise?: boolean;
  radius: number;
  startAngle: number;
  rotation: number;
};

export type SpriteEntityAnimationTypes =
  | BaseEntityAnimationTypes
  | "flip-over"
  | "animated-float-y";
export type SpriteEntityAnimationProps = BaseAnimationProps & {
  spriteIndex: number;
};

export type SpriteEntityProps = BaseEntityNoProps<
  SpriteEntityAnimationTypes,
  SpriteEntityAnimationProps
> & {
  type: "sprite";
  src: IMAGE;
  sprites: [SpriteCoordinates, ...SpriteCoordinates[]];
  spriteWidth: number;
  spriteHeight: number;
  scale?: number;
  angle?: number;
  spriteElapsed?: number;
  spriteDuration?: number;
};
