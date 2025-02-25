import { BASELINE_WIDTH, FPS, PADDING, Palette } from "./constants";
import { Debug } from "./debug";
import {
  AnimationPhase,
  AnimationSpec,
  EntityProps,
  EntityType,
  LAYER,
  Position,
} from "./types";
import { clamp } from "./utils";

export abstract class Entity<
  Phase extends string,
  Props extends Record<string, number>,
> implements AnimationSpec<Phase, Props>
{
  readonly id: string;
  readonly type: EntityType;
  readonly layer: LAYER;
  readonly position: Position;
  readonly speed: number;
  readonly offsetX: number;
  readonly offsetY: number;
  public progress: number = 0;
  public x: number;
  public y: number;
  public width: number = 0;
  public height: number = 0;
  public phases: AnimationPhase<Phase, Props>[];
  public props: Props;
  protected totalDuration: number;
  protected elapsed: number = 0;
  protected localProgress: number = 0;
  protected current: AnimationPhase<Phase, Props> | null = null;
  protected padding: number = window.innerWidth * PADDING;
  protected scaleFactor: number = window.innerWidth / BASELINE_WIDTH;
  protected debug: Debug;

  constructor(
    entity: EntityProps<Phase, Props>,
    debug = new Debug("Entity", Palette.Black)
  ) {
    this.id = entity.id;
    this.type = entity.type;
    this.layer = entity.layer;
    this.position = entity.position || "top left";
    this.offsetX = entity.offsetX ?? 0;
    this.offsetY = entity.offsetY ?? 0;
    this.x = entity.x ?? 0;
    this.y = entity.y ?? 0;
    this.phases = entity.phases;
    this.props = entity.props;
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
    let elapsed = 0;
    let current = this.phases[this.phases.length - 1];
    for (const p of this.phases) {
      count += p.duration;
      if (this.progress * this.totalDuration <= count) {
        current = p;
        break;
      }
      elapsed = count;
    }
    this.current = current;
    this.elapsed = elapsed;
    return this;
  }

  protected setLocalProgress(): this {
    if (this.current === null) {
      throw new Error("No current phase for local progress");
    }
    const localProgress =
      (this.progress * this.totalDuration - this.elapsed) /
      this.current.duration;
    this.localProgress = clamp(localProgress, 0, 1);
    return this;
  }

  protected getPosition(): {
    x: number;
    y: number;
  } {
    switch (this.position) {
      case "center":
        return {
          x: (window.innerWidth - this.width) / 2,
          y: (window.innerHeight - this.height) / 2,
        };
      case "eyeline":
        return {
          x: (window.innerWidth - this.width) / 2,
          y: window.innerHeight / 3 - this.height,
        };
      case "top":
        return { x: (window.innerWidth - this.width) / 2, y: this.padding };
      case "right":
        return {
          x: window.innerWidth - this.width - this.padding,
          y: (window.innerHeight - this.height) / 2,
        };
      case "bottom":
        return {
          x: (window.innerWidth - this.width) / 2,
          y: window.innerHeight - this.height - this.padding,
        };
      case "left":
        return {
          x: this.padding,
          y: (window.innerHeight - this.height) / 2,
        };
      case "top left":
        return { x: this.padding, y: this.padding };
      case "top right":
        return {
          x: window.innerWidth - this.width - this.padding,
          y: this.padding,
        };
      case "bottom left":
        return {
          x: this.padding,
          y: window.innerHeight - this.height - this.padding,
        };
      case "bottom right":
        return {
          x: window.innerWidth - this.width - this.padding,
          y: window.innerHeight - this.height - this.padding,
        };
      default:
        return { x: this.x, y: this.y };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time?: number): this {
    this.progress = Math.min(this.progress + this.speed, 1);
    this.setPhase();
    this.setLocalProgress();
    return this;
  }

  public abstract resize(): this;
  protected abstract easing(): this;
  protected abstract interpolate(time?: number): this;
  public abstract render(ctx: CanvasRenderingContext2D): this;
  onBegin?: (layer: LAYER, id: string) => void | undefined;
  onEnd?: (layer: LAYER, id: string) => void | undefined;
}

