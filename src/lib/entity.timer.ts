import { Palette } from "./constants";
import { Debug } from "./debug";
import { Entity } from "./entity";
import {
  TimerEntityProps,
  TimerEntityAnimationTypes,
  TimerEntityAnimationProps,
} from "./types";
import { easeOutBack, lerp, radians } from "./utils";

export class TimerEntity extends Entity<
  TimerEntityAnimationTypes,
  TimerEntityAnimationProps
> {
  readonly type = "timer";
  readonly color: string | CanvasGradient | CanvasPattern;
  readonly radius: number;
  readonly startAngle: number;
  readonly rotation: number;
  readonly backgroundColor?: string | CanvasGradient | CanvasPattern;
  readonly backgroundScale: number = 1.15;
  readonly strokeColor?: string | CanvasGradient | CanvasPattern;
  readonly strokeScale: number = 1.05;
  readonly counterclockwise: boolean = false;
  #radius: number = 0;

  constructor(
    entity: TimerEntityProps,
    debug = new Debug("TimerEntity", Palette.LightGrey)
  ) {
    super(
      {
        ...entity,
        type: "timer",
        props: {
          angle: 0,
          radius: 0,
        },
      },
      debug
    );
    this.color = entity.color;
    this.radius = entity.radius;
    this.rotation = radians(entity.rotation);
    this.startAngle = radians(entity.startAngle) + this.rotation;
    this.backgroundColor = entity.backgroundColor;
    this.backgroundScale = entity.backgroundScale ?? this.backgroundScale;
    this.strokeColor = entity.strokeColor;
    this.strokeScale = entity.strokeScale ?? this.strokeScale;
    this.counterclockwise = entity.counterclockwise ?? this.counterclockwise;
    this.#radius = this.radius;
    this.resize();
  }

  public resize(): this {
    super.resize();
    this.#radius = this.radius * this.scaleFactor;
    this.width = this.#radius * 2;
    this.height = this.#radius * 2;
    const pos = this.getPosition();
    this.x = pos.x + this.#radius;
    this.y = pos.y + this.#radius;
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
        case "zoom-in":
        case "zoom-out":
          this.localProgress = easeOutBack(this.localProgress);
          break;
        case "countdown":
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
      switch (this.current.name) {
        case "zoom-in":
          this.props.angle = this.startAngle;
          this.props.radius = Math.max(
            lerp(0, this.#radius, this.localProgress),
            0
          );
          break;
        case "countdown":
          this.props.angle =
            lerp(0, Math.PI * 2, this.localProgress) + this.rotation;
          this.props.radius = this.#radius;
          break;
        case "zoom-out":
          this.props.angle = Math.PI * 2;
          this.props.radius = Math.max(
            lerp(this.#radius, 0, this.localProgress),
            0
          );
          break;
        default:
          break;
      }
    }
    return this;
  }

  public update(): this {
    super.update();

    if (!this.current) {
      throw new Error(`No current phase to update for ${this.id}`);
    }

    this.easing();
    this.interpolate();

    if (this.progress === 1 && this.onEnd) {
      this.debug.log(`Calling onEnd from: ${this.id}`);
      this.onEnd(this.layer, this.id);
    }

    return this;
  }

  public render(ctx: CanvasRenderingContext2D): this {
    if (this.backgroundColor) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.arc(
        this.x,
        this.y,
        this.props.radius * this.backgroundScale,
        0,
        2 * Math.PI,
        false
      );
      ctx.closePath();
      ctx.fillStyle = this.backgroundColor;
      ctx.fill();
    }

    if (this.strokeColor) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.arc(
        this.x,
        this.y,
        this.props.radius * this.strokeScale,
        this.startAngle,
        this.props.angle,
        this.counterclockwise
      );
      ctx.closePath();
      ctx.fillStyle = this.strokeColor;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.arc(
      this.x,
      this.y,
      this.props.radius,
      this.startAngle,
      this.props.angle,
      this.counterclockwise || false
    );
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    return this;
  }
}

