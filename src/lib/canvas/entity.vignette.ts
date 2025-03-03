import {
  BaseAnimationTypes,
  BaseAnimationProps,
  BaseEntityOptionalAnimations,
  Entity,
  AnimationPhase,
} from "@/lib/canvas/entity";

type VignetteEntityAnimationTypes = BaseAnimationTypes;

type VignetteEntityAnimationProps = BaseAnimationProps;

export type VignetteEntityProps = BaseEntityOptionalAnimations<
  VignetteEntityAnimationTypes,
  VignetteEntityAnimationProps
> & {
  type: "vignette";
};

export class VignetteEntity extends Entity<
  VignetteEntityAnimationTypes,
  VignetteEntityAnimationProps
> {
  public static readonly defaultPhases: AnimationPhase<
    VignetteEntityAnimationTypes,
    VignetteEntityAnimationProps
  >[] = [
    { name: "fade-in", duration: 1 },
    { name: "idle", duration: 10, loop: true },
    { name: "fade-out", duration: 1 },
  ];
  #centerX: number = 0;
  #centerY: number = 0;
  #radius: number = 0;
  #gradient: CanvasGradient | null = null;

  constructor(props: VignetteEntityProps) {
    super({
      ...props,
      props: { ...Entity.defaultProps, opacity: 0, ...props.props },
      phases: props.phases ?? VignetteEntity.defaultPhases,
    });
    this.resize();
  }

  public fadeIn(): this {
    this.advancePhase("fade-in");
    return this;
  }

  public fadeOut(onEnd?: () => void): this {
    this.advancePhase("fade-out");
    this.onEnd = onEnd;
    return this;
  }

  private createGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
    const gradient = ctx.createRadialGradient(
      this.#centerX,
      this.#centerY,
      0,
      this.#centerX,
      this.#centerY,
      this.#radius
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(0.7, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");
    return gradient;
  }

  public resize(): this {
    super.resize();
    this.#centerX = window.innerWidth / 2;
    this.#centerY = window.innerHeight / 2;
    this.#radius = Math.sqrt(
      this.#centerX * this.#centerX + this.#centerY * this.#centerY
    );
    this.#gradient = null;
    return this;
  }

  public render(ctx: CanvasRenderingContext2D): this {
    if (!this.#gradient) {
      this.#gradient = this.createGradient(ctx);
    }

    ctx.save();
    ctx.globalAlpha = this.props.opacity;
    ctx.fillStyle = this.#gradient;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.restore();

    return this;
  }
}

