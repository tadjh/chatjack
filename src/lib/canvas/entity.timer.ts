import {
  BaseAnimationProps,
  BaseEntityNoProps,
  Entity,
} from "@/lib/canvas/entity";
import { Palette } from "@/lib/constants";
import { Debug } from "@/lib/debug";
import { easeOutBack, lerp, radians } from "@/lib/utils";

type TimerEntityAnimationTypes = "zoom-in" | "countdown" | "zoom-out";
type TimerEntityAnimationProps = BaseAnimationProps & {
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
    props: TimerEntityProps,
    debug = new Debug("TimerEntity", Palette.LightGrey)
  ) {
    super(
      {
        ...props,
        type: "timer",
        props: {
          angle: 0,
          radius: 0,
          opacity: 1,
          offsetX: 0,
          offsetY: 0,
        },
      },
      debug
    );
    this.color = props.color;
    this.radius = props.radius;
    this.rotation = radians(props.rotation);
    this.startAngle = radians(props.startAngle) + this.rotation;
    this.backgroundColor = props.backgroundColor;
    this.backgroundScale = props.backgroundScale ?? this.backgroundScale;
    this.strokeColor = props.strokeColor;
    this.strokeScale = props.strokeWidth ?? this.strokeScale;
    this.counterclockwise = props.counterclockwise ?? this.counterclockwise;
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
          super.easing();
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
          super.interpolate();
          break;
      }
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

