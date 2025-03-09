import { BASELINE_PADDING, FPS } from "@/lib/canvas/constants";
import { LAYER, POSITION } from "@/lib/canvas/types";
import {
  clamp,
  easeOutBack,
  easeOutBounce,
  easeOutCubic,
  getHorizontalScaleFactor,
  getScaleFactor,
  lerp,
} from "@/lib/canvas/utils";
import { Debug } from "@/lib/debug";
export interface AnimationPhase<
  Phase extends string,
  Props extends Record<string, number>,
> {
  name: Phase;
  duration: number; // seconds
  magnitude?: number;
  loop?: boolean;
  easing?: (t: number) => Props;
  interpolate?: (t: number) => Props;
}
export interface AnimationSpec<
  Phase extends string,
  Props extends Record<string, number>,
> {
  phases: AnimationPhase<Phase, Props>[];
  props: Props;
  onBegin?: (layer: LAYER, id: string) => void;
  onEnd?: (layer: LAYER, id: string) => void;
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

export type BaseEntityProps<
  Phase extends string,
  Props extends Record<string, number>,
> = AnimationSpec<Phase, Props> & {
  id: string;
  type: string;
  layer: LAYER;
  position?: POSITION;
  delay?: number;
  x?: number;
  y?: number;
  offsetX?: number;
  offsetY?: number;
  opacity?: number;
  animationSpeed?: number;
} & Shadow;

export type BaseAnimationTypes =
  | "idle"
  | "fade-in"
  | "fade-out"
  | "fade-slide-in-top"
  | "fade-slide-in-right"
  | "fade-slide-in-bottom"
  | "fade-slide-in-left"
  | "fade-slide-out-top"
  | "fade-slide-out-right"
  | "fade-slide-out-bottom"
  | "fade-slide-out-left"
  | "float-x"
  | "float-y"
  | "slide-in-top"
  | "slide-in-right"
  | "slide-in-bottom"
  | "slide-in-left"
  | "slide-out-top"
  | "slide-out-right"
  | "slide-out-bottom"
  | "slide-out-left"
  | "zoom-in"
  | "zoom-out"
  | "zoom-shake";

export type BaseAnimationProps = {
  opacity: number;
  offsetX: number;
  offsetY: number;
  scale: number;
};
export type BaseEntityOptionalAnimations<
  AnimationTypes extends BaseAnimationTypes | string,
  AnimationProps extends BaseAnimationProps & Record<string, number>,
> = Omit<BaseEntityProps<AnimationTypes, AnimationProps>, "props" | "phases"> &
  Partial<
    Pick<BaseEntityProps<AnimationTypes, AnimationProps>, "props" | "phases">
  >;

export abstract class Entity<
  Phase extends string,
  Props extends Record<string, number>,
> implements
    AnimationSpec<Phase | BaseAnimationTypes, Props & BaseAnimationProps>
{
  public static readonly defaultProps: BaseAnimationProps = {
    offsetX: 0,
    offsetY: 0,
    opacity: 1,
    scale: 1,
  };
  readonly id: string;
  readonly type: string;
  readonly layer: LAYER;
  readonly position: POSITION;
  readonly speed: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly shadowColor?: string;
  readonly shadowOffsetX: number;
  readonly shadowOffsetY: number;
  readonly shadowBlur: number;
  readonly animationSpeed: number;
  public progress: number = 0;
  public delay: number;
  public x: number;
  public y: number;
  public width: number = 0;
  public height: number = 0;
  public phases: AnimationPhase<
    Phase | BaseAnimationTypes,
    Props & BaseAnimationProps
  >[];
  public props: Props & BaseAnimationProps;
  public opacity: number;
  public startTime: number = 0;
  protected totalDuration: number;
  protected phaseStart: number = 0;
  protected phaseIndex: number = -1;
  protected localProgress: number = 0;
  protected current: AnimationPhase<
    Phase | BaseAnimationTypes,
    Props & BaseAnimationProps
  > | null = null;
  protected padding: number = getScaleFactor() * BASELINE_PADDING;
  protected scaleFactor: number = getScaleFactor();
  protected debug: Debug;
  protected hasBeginFired: boolean = false;
  protected hasEndFired: boolean = false;
  onBegin: ((layer: LAYER, id: string) => void) | undefined;
  onEnd: ((layer: LAYER, id: string) => void) | undefined;

  constructor(
    props: BaseEntityProps<
      Phase | BaseAnimationTypes,
      Props & BaseAnimationProps
    >,
    debug = new Debug(Entity.name, "Black"),
  ) {
    this.id = props.id;
    this.type = props.type;
    this.layer = props.layer;
    this.position = props.position || POSITION.TOP_LEFT;
    this.offsetX = props.offsetX ?? 0;
    this.offsetY = props.offsetY ?? 0;
    this.shadowColor = props.shadowColor;
    this.shadowOffsetX = props.shadowOffsetX ?? 0;
    this.shadowOffsetY = props.shadowOffsetY ?? 0;
    this.shadowBlur = props.shadowBlur ?? 0;
    this.animationSpeed = props.animationSpeed ?? 1 / FPS;
    this.opacity = props.opacity ?? 1;
    this.delay = props.delay ?? 0;
    this.x = props.x ?? 0;
    this.y = props.y ?? 0;
    this.phases = props.phases ?? [];
    this.props = { ...props.props };
    this.onBegin = props.onBegin;
    this.onEnd = props.onEnd;
    this.debug = debug;

    this.totalDuration = this.phases.reduce(
      (sum, phase) => sum + phase.duration,
      0,
    );

    this.speed =
      this.totalDuration > 0 ? this.animationSpeed / this.totalDuration : 1;
    this.init();
  }

  public get currentPhase() {
    return this.current;
  }

  public get currentPhaseIndex() {
    return this.phaseIndex;
  }

  protected init(): this {
    this.debug.log("Creating:", this.id);
    return this;
  }

  protected setPhase(): this {
    let count = 0;
    let timeSpent = 0;
    let index = 0;
    let current = this.phases[this.phases.length - 1];
    for (const p of this.phases) {
      count += p.duration;
      if (this.progress * this.totalDuration <= count) {
        current = p;
        break;
      }
      index++;
      timeSpent = count;
    }
    this.current = current;
    this.phaseStart = timeSpent;
    this.phaseIndex = index;
    return this;
  }

  public advancePhase(name?: string): this {
    if (!this.phases.length) {
      throw new Error("No phases to advance");
    }

    if (name) {
      let timeSpent = 0;
      let index = 0;
      for (const p of this.phases) {
        if (p.name === name) {
          this.current = p;
          break;
        }
        timeSpent += p.duration;
        index++;
      }
      this.phaseStart = timeSpent;
      this.phaseIndex = index;
    } else {
      this.phaseIndex =
        this.phaseIndex === this.phases.length - 1 ? 0 : this.phaseIndex + 1;
      this.current = this.phases[this.phaseIndex];
      this.phaseStart += this.current.duration;
    }

    this.progress = this.phaseStart / this.totalDuration;
    return this;
  }

  protected setLocalProgress(): this {
    if (this.current === null) {
      throw new Error("No current phase for local progress");
    }

    if (this.current.loop) {
      const elapsedInPhase = (performance.now() - this.startTime) / 1000;
      this.localProgress =
        (elapsedInPhase % this.current.duration) / this.current.duration;
    } else {
      const elapsedInPhase =
        this.progress * this.totalDuration - this.phaseStart;
      this.localProgress = clamp(elapsedInPhase / this.current.duration, 0, 1);
    }
    return this;
  }

  protected getPosition(): {
    x: number;
    y: number;
  } {
    switch (this.position) {
      case POSITION.CENTER:
        return {
          x: (window.innerWidth - this.width) / 2,
          y: (window.innerHeight - this.height) / 2,
        };
      case POSITION.EYELINE:
        return {
          x: (window.innerWidth - this.width) / 2,
          y: window.innerHeight / 4 - this.height / 2,
        };
      case POSITION.TOP:
        return { x: (window.innerWidth - this.width) / 2, y: this.padding };
      case POSITION.RIGHT:
        return {
          x: window.innerWidth - this.width - this.padding,
          y: (window.innerHeight - this.height) / 2,
        };
      case POSITION.BOTTOM:
        return {
          x: (window.innerWidth - this.width) / 2,
          y: window.innerHeight - this.height - this.padding,
        };
      case POSITION.LEFT:
        return {
          x: this.padding,
          y: (window.innerHeight - this.height) / 2,
        };
      case POSITION.TOP_LEFT:
        return { x: this.padding, y: this.padding };
      case POSITION.TOP_RIGHT:
        return {
          x: window.innerWidth - this.width - this.padding,
          y: this.padding,
        };
      case POSITION.BOTTOM_LEFT:
        return {
          x: this.padding,
          y: window.innerHeight - this.height - this.padding,
        };
      case POSITION.BOTTOM_RIGHT:
        return {
          x: window.innerWidth - this.width - this.padding,
          y: window.innerHeight - this.height - this.padding,
        };
      default:
        return { x: this.x, y: this.y };
    }
  }

  public update(): this {
    if (this.progress === 0 && this.onBegin && !this.hasBeginFired) {
      this.debug.log(`Calling onBegin from: ${this.id}`);
      this.onBegin(this.layer, this.id);
      this.hasBeginFired = true; // Set flag to prevent firing again
    }

    this.progress = Math.min(this.progress + this.speed, 1);
    this.setPhase();
    this.setLocalProgress();

    if (!this.current) {
      throw new Error(`No current phase to update for ${this.id}`);
    }

    this.easing();
    this.interpolate();

    // Only fire the onEnd callback once when progress reaches 1
    if (this.progress === 1 && this.onEnd && !this.hasEndFired) {
      this.debug.log(`Calling onEnd from: ${this.id}`);
      this.onEnd(this.layer, this.id);
      this.hasEndFired = true; // Set flag to prevent firing again
    }
    return this;
  }

  public resize(): this {
    // this.debug.log("Resizing:", this.id);
    this.scaleFactor = getScaleFactor();
    this.padding = getHorizontalScaleFactor() * BASELINE_PADDING;
    return this;
  }

  protected easing(): this {
    if (!this.current) {
      throw new Error(`No current phase to ease for ${this.id}`);
    }

    if (this.current.easing) {
      this.props = this.current.easing(this.localProgress);
    } else {
      switch (this.current.name) {
        case "fade-in":
        case "fade-out":
        case "float-x":
        case "float-y":
          // linear easing
          break;
        case "fade-slide-in-top":
        case "fade-slide-in-right":
        case "fade-slide-in-bottom":
        case "fade-slide-in-left":
        case "fade-slide-out-top":
        case "fade-slide-out-right":
        case "fade-slide-out-bottom":
        case "fade-slide-out-left":
        case "slide-in-top":
        case "slide-in-bottom":
          this.localProgress = easeOutCubic(this.localProgress);
          break;
        case "zoom-in":
        case "zoom-out":
          this.localProgress = easeOutBack(this.localProgress);
          break;
        case "zoom-shake":
          this.localProgress = easeOutBounce(this.localProgress);
          break;
        default:
          break;
      }
    }

    return this;
  }

  protected interpolate(): this {
    if (!this.current) {
      throw new Error(`No current phase to interpolate for${this.id}`);
    }

    if (this.current.interpolate) {
      this.props = this.current.interpolate(this.localProgress);
    } else {
      const magnitude = this.current.magnitude ?? 64;
      switch (this.current.name) {
        case "fade-in":
          this.props.opacity = lerp(0, 1, this.localProgress);
          break;
        case "fade-out":
          this.props.opacity = lerp(1, 0, this.localProgress);
          break;
        case "float-x":
          this.props.opacity = 1;
          this.props.offsetX =
            Math.sin(2 * Math.PI * this.localProgress + Math.PI / 2) *
            magnitude;
          break;
        case "float-y":
          this.props.opacity = 1;
          this.props.offsetY =
            Math.sin(2 * Math.PI * this.localProgress + Math.PI / 2) *
            magnitude;
          break;
        case "slide-in-top":
          this.props.opacity = 1;
          this.props.offsetY = lerp(-magnitude, 0, this.localProgress);
          break;
        case "slide-in-right":
          this.props.opacity = 1;
          this.props.offsetX = lerp(magnitude, 0, this.localProgress);
          break;
        case "slide-in-bottom":
          this.props.opacity = 1;
          this.props.offsetY = lerp(magnitude, 0, this.localProgress);
          break;
        case "slide-in-left":
          this.props.opacity = 1;
          this.props.offsetX = lerp(-magnitude, 0, this.localProgress);
          break;
        case "slide-out-top":
          this.props.opacity = 1;
          this.props.offsetY = lerp(0, -magnitude, this.localProgress);
          break;
        case "slide-out-bottom":
          this.props.opacity = 1;
          this.props.offsetY = lerp(0, magnitude, this.localProgress);
          break;
        case "slide-out-left":
          this.props.opacity = 1;
          this.props.offsetX = lerp(0, -magnitude, this.localProgress);
          break;
        case "slide-out-right":
          this.props.opacity = 1;
          this.props.offsetX = lerp(0, magnitude, this.localProgress);
          break;
        case "fade-slide-in-top":
          this.props.offsetY = lerp(-magnitude, 0, this.localProgress);
          this.props.opacity = lerp(0, 1, this.localProgress);
          break;
        case "fade-slide-in-right":
          this.props.offsetX = lerp(magnitude, 0, this.localProgress);
          this.props.opacity = lerp(0, 1, this.localProgress);
          break;
        case "fade-slide-in-bottom":
          this.props.offsetY = lerp(magnitude, 0, this.localProgress);
          this.props.opacity = lerp(0, 1, this.localProgress);
          break;
        case "fade-slide-in-left":
          this.props.offsetX = lerp(-magnitude, 0, this.localProgress);
          this.props.opacity = lerp(0, 1, this.localProgress);
          break;
        case "fade-slide-out-top":
          this.props.offsetY = lerp(0, -magnitude, this.localProgress);
          this.props.opacity = lerp(1, 0, this.localProgress);
          break;
        case "fade-slide-out-bottom":
          this.props.offsetY = lerp(0, magnitude, this.localProgress);
          this.props.opacity = lerp(1, 0, this.localProgress);
          break;
        case "fade-slide-out-left":
          this.props.offsetX = lerp(0, -magnitude, this.localProgress);
          this.props.opacity = lerp(1, 0, this.localProgress);
          break;
        case "fade-slide-out-right":
          this.props.offsetX = lerp(0, magnitude, this.localProgress);
          this.props.opacity = lerp(1, 0, this.localProgress);
          break;
        case "zoom-in":
          this.props.opacity = 1;
          this.props.scale = lerp(0, 1, this.localProgress);
          break;
        case "zoom-out":
          this.props.opacity = 1;
          this.props.scale = lerp(1, 0, this.localProgress);
          break;
        case "zoom-shake":
          this.props.opacity = 1;
          this.props.scale = lerp(1.25, 1, this.localProgress);
          break;
        default:
          break;
      }
    }
    return this;
  }
  public abstract render(ctx: CanvasRenderingContext2D): this;

  public reset(): this {
    this.progress = 0;
    this.startTime = 0;
    this.hasBeginFired = false;
    this.hasEndFired = false;
    this.localProgress = 0;
    this.phaseStart = 0;
    this.current = null;
    return this;
  }

  public destroy(): this {
    this.debug.log("Destroying", this.id);
    this.current = null;
    this.phases = [];
    this.props = {} as Props & BaseAnimationProps;
    this.opacity = 0;
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.startTime = 0;
    this.totalDuration = 0;
    this.phaseStart = 0;
    this.localProgress = 0;
    this.onBegin = undefined;
    this.onEnd = undefined;
    this.hasBeginFired = false;
    this.hasEndFired = false;
    return this;
  }
}
