import {
  AnimationPhase,
  BaseAnimationProps,
  BaseAnimationTypes,
  BaseEntityOptionalAnimations,
  Entity,
} from "@/lib/canvas/entity";
import { lerp, radians } from "@/lib/canvas/utils";
import { Debug } from "@/lib/debug";

type TimerEntityAnimationTypes = BaseAnimationTypes | "countdown";
type TimerEntityAnimationProps = BaseAnimationProps & {
  angle: number;
};

export type TimerEntityProps = BaseEntityOptionalAnimations<
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
  public static readonly epsilon = 0.0872665; // 5 degrees in radians
  public static readonly defaultPhases: AnimationPhase<
    TimerEntityAnimationTypes,
    TimerEntityAnimationProps
  >[] = [
    {
      name: "zoom-in",
      duration: 0.75,
    },
    {
      name: "countdown",
      duration: 30,
    },
    {
      name: "zoom-out",
      duration: 0.75,
    },
  ];
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
    debug = new Debug(TimerEntity.name, "LightGrey"),
  ) {
    super(
      {
        ...props,
        type: "timer",
        phases: props.phases ?? TimerEntity.defaultPhases,
        props: {
          ...Entity.defaultProps,
          angle: 0,
          ...props.props,
        },
      },
      debug,
    );
    this.color = props.color;
    this.radius = props.radius;
    this.rotation = radians(props.rotation);
    this.startAngle = radians(props.startAngle) + this.rotation;
    this.props.angle = this.startAngle;
    this.backgroundColor = props.backgroundColor;
    this.backgroundScale = props.backgroundScale ?? this.backgroundScale;
    this.strokeColor = props.strokeColor;
    this.strokeScale = props.strokeWidth ?? this.strokeScale;
    this.counterclockwise = props.counterclockwise ?? this.counterclockwise;
    this.#radius = this.radius;
    this.resize();
  }

  public static zoomInDuration() {
    return TimerEntity.defaultPhases[0].duration * 1000;
  }

  public static zoomOutDuration() {
    return TimerEntity.defaultPhases[2].duration * 1000;
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

  protected setLocalProgress(): this {
    if (this.current === null) {
      throw new Error("No current phase for local progress");
    }

    // Special handling for countdown phase to ensure it ignores zoom-out duration
    if (this.current.name === "countdown") {
      const elapsedInPhase =
        (performance.now() - this.startTime) / 1000 + this.phaseStart;

      this.localProgress = Math.min(elapsedInPhase / this.current.duration, 1);
      return this;
    }

    return super.setLocalProgress();
  }

  protected interpolate(): this {
    if (!this.current) {
      throw new Error(`No current phase to interpolate for${this.id}`);
    }

    if (this.current.interpolate) {
      this.props = this.current.interpolate(this.localProgress);
    } else {
      switch (this.current.name) {
        case "countdown":
          // Use a more precise calculation that ensures we reach the full circle
          const fullCircle = Math.PI * 2 + TimerEntity.epsilon;
          this.props.angle =
            Math.min(fullCircle, lerp(0, fullCircle, this.localProgress)) +
            this.rotation;
          break;
        default:
          super.interpolate();
          break;
      }
    }
    return this;
  }

  public render(ctx: CanvasRenderingContext2D): this {
    const scale = Math.max(this.props.scale, 0);

    if (this.backgroundColor) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.arc(
        this.x,
        this.y,
        this.#radius * this.backgroundScale * scale,
        0,
        2 * Math.PI,
        false,
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
        this.#radius * this.strokeScale * scale,
        this.startAngle,
        this.props.angle,
        this.counterclockwise,
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
      this.#radius * scale,
      this.startAngle,
      this.props.angle,
      this.counterclockwise || false,
    );
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    return this;
  }

  public destroy(): this {
    super.destroy();
    this.props.scale = 0;
    this.props.angle = 0;
    this.#radius = 0;
    return this;
  }
}
