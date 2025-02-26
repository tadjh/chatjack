import { BASELINE_PADDING, FPS, Palette } from "./constants";
import { Debug } from "./debug";
import {
  AnimationPhase,
  AnimationSpec,
  BaseAnimationProps,
  BaseEntityAnimationTypes,
  BaseEntityProps,
  BaseEntityType,
  LAYER,
  POSITION,
} from "./types";
import {
  clamp,
  easeOutCubic,
  getHorizontalScaleFactor,
  getScaleFactor,
  lerp,
} from "./utils";

export abstract class Entity<
  Phase extends string,
  Props extends Record<string, number>,
> implements
    AnimationSpec<Phase | BaseEntityAnimationTypes, Props & BaseAnimationProps>
{
  readonly id: string;
  readonly type: BaseEntityType;
  readonly layer: LAYER;
  readonly position: POSITION;
  readonly speed: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly shadowColor?: string;
  readonly shadowOffsetX: number;
  readonly shadowOffsetY: number;
  readonly shadowBlur: number;
  readonly baseAnimSpeed: number;
  public progress: number = 0;
  public delay: number;
  public x: number;
  public y: number;
  public width: number = 0;
  public height: number = 0;
  public phases: AnimationPhase<
    Phase | BaseEntityAnimationTypes,
    Props & BaseAnimationProps
  >[];
  public props: Props & BaseAnimationProps;
  public opacity: number;
  protected totalDuration: number;
  protected phaseStart: number = 0;
  protected localProgress: number = 0;
  protected current: AnimationPhase<
    Phase | BaseEntityAnimationTypes,
    Props & BaseAnimationProps
  > | null = null;
  protected padding: number = getScaleFactor() * BASELINE_PADDING;
  protected scaleFactor: number = getScaleFactor();
  protected debug: Debug;
  public startTime: number = 0;
  protected lastTime: number = performance.now();
  protected hasBeginFired: boolean = false;
  protected hasEndFired: boolean = false;
  onBegin: ((layer: LAYER, id: string) => void) | undefined;
  onEnd: ((layer: LAYER, id: string) => void) | undefined;

  constructor(
    props: BaseEntityProps<
      Phase | BaseEntityAnimationTypes,
      Props & BaseAnimationProps
    >,
    debug = new Debug("Entity", Palette.Black)
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
    this.baseAnimSpeed = 1 / FPS;
    this.opacity = props.opacity ?? 1;
    this.delay = props.delay ?? 0;
    this.x = props.x ?? 0;
    this.y = props.y ?? 0;
    this.phases = props.phases.map((phase) => ({
      ...phase,
    }));
    this.props = { ...props.props };
    this.onBegin = props.onBegin;
    this.onEnd = props.onEnd;
    this.debug = debug;

    this.totalDuration = this.phases.reduce(
      (sum, phase) => sum + phase.duration,
      0
    );

    this.speed =
      this.totalDuration > 0 ? 1 / (this.totalDuration * FPS) : 1 / 12;
  }

  protected setPhase(): this {
    let count = 0;
    let timeSpent = 0;
    let current = this.phases[this.phases.length - 1];
    for (const p of this.phases) {
      count += p.duration;
      if (this.progress * this.totalDuration <= count) {
        current = p;
        break;
      }
      timeSpent = count;
    }
    this.current = current;
    this.phaseStart = timeSpent;
    return this;
  }

  protected setLocalProgress(): this {
    if (this.current === null) {
      throw new Error("No current phase for local progress");
    }

    const elapsedInPhase = this.progress * this.totalDuration - this.phaseStart;
    if (this.current.loop) {
      // For looping animations, use performance.now() to keep progressing after progress hits 1
      const now = (performance.now() - this.startTime) / 1000; // Convert to seconds
      this.localProgress =
        (now % this.current.duration) / this.current.duration;
    } else {
      this.localProgress = elapsedInPhase / this.current.duration;
      this.localProgress = clamp(this.localProgress, 0, 1);
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
    this.debug.log("Resizing", this.id);
    this.scaleFactor = getScaleFactor();
    this.padding = getHorizontalScaleFactor() * BASELINE_PADDING;
    return this;
  }

  public destroy(): this {
    this.debug.log("Destroying", this.id);
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
        case "slide-in-top":
        case "slide-in-bottom":
        case "fade-slide-in-top":
        case "fade-slide-in-right":
        case "fade-slide-in-bottom":
        case "fade-slide-in-left":
        case "fade-slide-out-top":
        case "fade-slide-out-right":
        case "fade-slide-out-bottom":
        case "fade-slide-out-left":
          this.localProgress = easeOutCubic(this.localProgress);
          break;
        case "float-x":
        case "float-y":
          // linear easing
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
}

