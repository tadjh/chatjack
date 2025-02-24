import { Palette } from "./constants";
import { Debug } from "./debug";
import { Entity } from "./entity";
import {
  Vector3,
  TimerEntityProps,
  TimerEntityPhaseTypes,
  TimerEntityPhaseProps,
} from "./types";
import { easeOutBack, getPosition, lerp, radians, rgb, rgba } from "./utils";

export class TimerEntity extends Entity<
  TimerEntityPhaseTypes,
  TimerEntityPhaseProps
> {
  readonly type = "timer";
  readonly color: Vector3;
  readonly backgroundColor: Vector3 | undefined;
  readonly radius: number;
  readonly startAngle: number;
  readonly rotation: number;
  readonly backgroundScale: number = 1.15;
  readonly strokeColor?: Vector3;
  readonly strokeScale: number = 1.05;
  readonly counterclockwise: boolean = false;
  #scaledRadius: number = 0;

  constructor(
    entity: TimerEntityProps,
    scaleFactor: number,
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
    this.backgroundColor = entity.backgroundColor;
    this.backgroundScale = entity.backgroundScale ?? this.backgroundScale;
    this.radius = entity.radius;
    this.rotation = radians(entity.rotation);
    this.startAngle = radians(entity.startAngle) + this.rotation;
    this.strokeColor = entity.strokeColor;
    this.strokeScale = entity.strokeScale ?? this.strokeScale;
    this.counterclockwise = entity.counterclockwise ?? this.counterclockwise;
    this.resize(scaleFactor);
  }

  resize(scaleFactor: number) {
    this.#scaledRadius = this.radius * scaleFactor;
    const pos = getPosition(
      this.position,
      this.#scaledRadius * 2,
      this.#scaledRadius * 2
    );
    this.x = pos.x;
    this.y = pos.y + this.#scaledRadius;
  }

  easing() {
    if (!this.current) {
      throw new Error(`No current phase to ease for ${this.id}`);
    }

    if (this.current.easing) {
      this.props = this.current.easing(this.localProgress);
      return;
    }

    switch (this.current.name) {
      case "zoom-in":
        this.localProgress = easeOutBack(this.localProgress);
        break;
      case "zoom-out":
      case "countdown":
        break;
      default:
        break;
    }
  }

  interpolate() {
    if (!this.current) {
      throw new Error(`No current phase to interpolate for${this.id}`);
    }

    if (this.current.interpolate) {
      this.props = this.current.interpolate(this.localProgress);
      return;
    }

    switch (this.current.name) {
      case "zoom-in":
        this.props.angle = this.startAngle;
        this.props.radius = Math.max(
          lerp(0, this.#scaledRadius, this.localProgress),
          0
        );
        break;
      case "countdown":
        this.props.angle =
          lerp(0, Math.PI * 2, this.localProgress) + this.rotation;
        this.props.radius = this.#scaledRadius;
        break;
      case "zoom-out":
        this.props.angle = Math.PI * 2;
        this.props.radius = Math.max(
          lerp(this.#scaledRadius, 0, this.localProgress),
          0
        );
        break;
      default:
        break;
    }
  }

  update() {
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
  }

  render(ctx: CanvasRenderingContext2D) {
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
      ctx.fillStyle = rgba(this.backgroundColor);
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
      ctx.fillStyle = rgba(this.strokeColor);
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
    ctx.fillStyle = rgba(this.color);
    ctx.fill();
  }
}

