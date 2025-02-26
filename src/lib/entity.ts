import { BASELINE_PADDING, FPS, Palette } from "./constants";
import { Debug } from "./debug";
import {
  AnimationPhase,
  AnimationSpec,
  EntityProps,
  EntityType,
  LAYER,
  POSITION,
} from "./types";
import { clamp, getHorizontalScaleFactor, getScaleFactor } from "./utils";

export abstract class Entity<
  Phase extends string,
  Props extends Record<string, number>,
> implements AnimationSpec<Phase, Props>
{
  readonly id: string;
  readonly type: EntityType;
  readonly layer: LAYER;
  readonly position: POSITION;
  readonly speed: number;
  readonly offsetX: number;
  readonly offsetY: number;
  public progress: number = 0;
  public delay: number;
  public x: number;
  public y: number;
  public width: number = 0;
  public height: number = 0;
  public phases: AnimationPhase<Phase, Props>[];
  public props: Props;
  protected totalDuration: number;
  protected phaseStart: number = 0;
  protected localProgress: number = 0;
  protected current: AnimationPhase<Phase, Props> | null = null;
  protected padding: number = getScaleFactor() * BASELINE_PADDING;
  protected scaleFactor: number = getScaleFactor();
  protected debug: Debug;
  public startTime: number = 0;
  protected lastTime: number = performance.now();

  constructor(
    props: EntityProps<Phase, Props>,
    debug = new Debug("Entity", Palette.Black)
  ) {
    this.id = props.id;
    this.type = props.type;
    this.layer = props.layer;
    this.position = props.position || POSITION.TOP_LEFT;
    this.offsetX = props.offsetX ?? 0;
    this.offsetY = props.offsetY ?? 0;
    this.delay = props.delay ?? 0;
    this.x = props.x ?? 0;
    this.y = props.y ?? 0;
    this.phases = props.phases;
    this.props = props.props;
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
    this.progress = Math.min(this.progress + this.speed, 1);
    this.setPhase();
    this.setLocalProgress();
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

  protected abstract easing(): this;
  protected abstract interpolate(time?: number): this;
  public abstract render(ctx: CanvasRenderingContext2D): this;
  onBegin?: (layer: LAYER, id: string) => void | undefined;
  onEnd?: (layer: LAYER, id: string) => void | undefined;
}

