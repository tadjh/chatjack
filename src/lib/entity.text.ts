import { Palette } from "./constants";
import { Debug } from "./debug";
import { Entity } from "./entity";
import {
  TextEntityAnimationTypes,
  TextEntityAnimationProps,
  TextEntityProps,
} from "./types";
import { easeOutCubic, font, lerp } from "./utils";

export class TextEntity extends Entity<
  TextEntityAnimationTypes,
  TextEntityAnimationProps
> {
  readonly type = "text";
  readonly fontSize: number;
  readonly fontFamily: string;
  readonly textBaseline: CanvasTextBaseline;
  readonly textAlign: CanvasTextAlign;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly shadowColor?: string;
  readonly shadowOffsetX: number;
  readonly shadowOffsetY: number;
  readonly shadowBlur: number;
  readonly strokeColor?: string | CanvasGradient | CanvasPattern;
  readonly strokeWidth?: number;
  public text: string;
  public color: string | CanvasGradient | CanvasPattern;
  #fontSize: number;
  #offsetX: number;
  #offsetY: number;
  #offCtx: OffscreenCanvasRenderingContext2D;
  #strokeWidth: number = 0;

  constructor(
    entity: TextEntityProps,
    debug = new Debug("TextEntity", Palette.LightGrey)
  ) {
    super(
      {
        ...entity,
        type: "text",
        props: {
          opacity: 1,
          kerning: 0,
          offsetX: 0,
          offsetY: 0,
        },
      },
      debug
    );
    this.text = entity.text;
    this.color = entity.color;
    this.fontSize = entity.fontSize;
    this.fontFamily = entity.fontFamily;
    this.textBaseline = entity.textBaseline;
    this.textAlign = entity.textAlign;
    this.offsetX = entity.offsetX;
    this.offsetY = entity.offsetY;
    this.shadowColor = entity.shadowColor;
    this.shadowOffsetX = entity.shadowOffsetX ?? 0;
    this.shadowOffsetY = entity.shadowOffsetY ?? 0;
    this.shadowBlur = entity.shadowBlur ?? 0;
    this.strokeColor = entity.strokeColor;
    this.strokeWidth = entity.strokeWidth;
    this.#fontSize = entity.fontSize;
    this.#offsetX = entity.offsetX;
    this.#offsetY = entity.offsetY;
    this.#strokeWidth = entity.strokeWidth ?? 0;
    const offCanvas = new OffscreenCanvas(1, 1);
    const offCtx = offCanvas.getContext("2d");
    if (!offCtx) {
      throw new Error("2d context not supported");
    }
    this.#offCtx = offCtx;
    this.debug.log(`Creating ${this.id}`);
    this.resize();
  }

  public update(time: number): this {
    super.update(time);

    if (!this.current) {
      throw new Error(`No current phase to update for ${this.id}`);
    }

    this.easing();
    this.interpolate(time);

    if (this.progress === 1 && this.onEnd) {
      this.debug.log(`Calling onEnd from: ${this.id}`);
      this.onEnd(this.layer, this.id);
    }
    return this;
  }

  public resize(): this {
    this.#fontSize = this.getFontSize();
    const { width, height } = this.getDimensions();
    this.width = width;
    this.height = height;
    const pos = this.getPosition();
    this.x =
      this.textAlign === "start" || this.textAlign === "left"
        ? pos.x
        : this.textAlign === "center"
          ? pos.x + this.width / 2
          : pos.x + this.width;
    this.y =
      this.textBaseline === "top"
        ? pos.y
        : this.textBaseline === "middle"
          ? pos.y + this.height / 2
          : pos.y + this.height;
    this.#offsetX = this.offsetX > 0 ? window.innerWidth / this.offsetX : 0;
    this.#offsetY = this.offsetY > 0 ? window.innerHeight / this.offsetY : 0;
    if (this.strokeWidth !== undefined) {
      this.#strokeWidth = this.strokeWidth * this.scaleFactor;
    }
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
        case "fade-slide-in-top":
        case "fade-slide-in-bottom":
        case "fade-slide-out-top":
        case "fade-slide-out-bottom":
        case "fade-slide-kerning-in-bottom":
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

  protected interpolate(time: number): this {
    if (!this.current) {
      throw new Error(`No current phase to interpolate for${this.id}`);
    }

    if (this.current.interpolate) {
      this.props = this.current.interpolate(this.localProgress);
    } else {
      const slide = 300 * this.scaleFactor;

      switch (this.current.name) {
        case "float-x":
          this.props.offsetX = Math.sin(time / 6) * 3;
          break;
        case "float-y":
          this.props.offsetY = Math.sin(time / 6) * 3;
          break;
        case "fade-slide-in-top":
          this.props.offsetY = lerp(-slide, 0, this.localProgress);
          this.props.opacity = lerp(0, 1, this.localProgress);
          break;
        case "fade-slide-in-right":
          this.props.offsetX = lerp(slide, 0, this.localProgress);
          this.props.opacity = lerp(0, 1, this.localProgress);
          break;
        case "fade-slide-in-bottom":
          this.props.offsetY = lerp(slide, 0, this.localProgress);
          this.props.opacity = lerp(0, 1, this.localProgress);
          break;
        case "fade-slide-in-left":
          this.props.offsetX = lerp(-slide, 0, this.localProgress);
          this.props.opacity = lerp(0, 1, this.localProgress);
          break;
        case "fade-slide-out-top":
          this.props.offsetY = lerp(0, -slide, this.localProgress);
          this.props.opacity = lerp(1, 0, this.localProgress);
          break;
        case "fade-slide-out-bottom":
          this.props.offsetY = lerp(0, slide, this.localProgress);
          this.props.opacity = lerp(1, 0, this.localProgress);
          break;
        case "fade-slide-out-left":
          this.props.offsetX = lerp(0, -slide, this.localProgress);
          this.props.opacity = lerp(1, 0, this.localProgress);
          break;
        case "fade-slide-out-right":
          this.props.offsetX = lerp(0, slide, this.localProgress);
          this.props.opacity = lerp(1, 0, this.localProgress);
          break;
        case "fade-slide-kerning-in-bottom":
          this.props.kerning = lerp(40, 0, this.localProgress);
          this.props.offsetY = lerp(slide, 0, this.localProgress);
          this.props.opacity = lerp(0, 1, this.localProgress);
          break;
        default:
          break;
      }
    }
    return this;
  }

  public render(ctx: CanvasRenderingContext2D): this {
    ctx.save();
    // if (entity.style.maxWidth !== "full") {
    //     const dimensions = this.#sizeMap.get(entity.style.maxWidth)!;
    //     pos.y = dimensions.y + dimensions.height * entity.style.lineHeight;
    //   }
    this.x += this.props.offsetX + this.#offsetX;
    this.y += this.props.offsetY + this.#offsetY;
    ctx.textBaseline = this.textBaseline;
    ctx.textAlign = this.textAlign;
    ctx.globalAlpha = this.props.opacity;
    ctx.letterSpacing = `${this.props.kerning}px`;
    ctx.font = font(this.#fontSize, this.fontFamily);

    if (this.shadowColor) {
      ctx.shadowColor = this.shadowColor;
      ctx.shadowOffsetX =
        this.shadowOffsetX * this.scaleFactor - this.props.offsetX;
      ctx.shadowOffsetY =
        this.shadowOffsetY * this.scaleFactor - this.props.offsetY;
      ctx.shadowBlur = this.shadowBlur;
    }

    if (this.strokeColor) {
      ctx.strokeStyle = this.strokeColor;
      ctx.fillStyle = this.strokeColor;
      ctx.lineWidth = this.#strokeWidth * this.scaleFactor;
      ctx.fillText(this.text, this.x, this.y);
      ctx.strokeText(this.text, this.x, this.y);
    }

    if (this.shadowColor) {
      ctx.shadowColor = "";
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);

    ctx.restore();
    return this;
  }

  private getFontSize(): number {
    let fontSize = this.scaleFactor * this.fontSize;
    this.#offCtx.font = font(fontSize, this.fontFamily);
    const textWidth = this.#offCtx.measureText(this.text).width;
    const maxWidth = window.innerWidth - this.padding * 2;
    if (textWidth > maxWidth) {
      fontSize *= maxWidth / textWidth;
    }
    return fontSize;
  }

  private getDimensions(): {
    width: number;
    height: number;
  } {
    const { width, actualBoundingBoxAscent, actualBoundingBoxDescent } =
      this.#offCtx.measureText(this.text);
    return {
      width,
      height: actualBoundingBoxAscent + actualBoundingBoxDescent,
    };
  }
}

