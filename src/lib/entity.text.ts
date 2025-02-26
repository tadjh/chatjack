import { Palette } from "./constants";
import { Debug } from "./debug";
import { Entity } from "./entity";
import {
  TextEntityAnimationTypes,
  TextEntityAnimationProps,
  TextEntityProps,
} from "./types";
import { easeOutCubic, font, getVerticalScaleFactor, lerp } from "./utils";

export class TextEntity extends Entity<
  TextEntityAnimationTypes,
  TextEntityAnimationProps
> {
  readonly type = "text";
  readonly fontSize: number;
  readonly fontFamily: string;
  readonly textBaseline: CanvasTextBaseline;
  readonly textAlign: CanvasTextAlign;
  readonly strokeColor?: string | CanvasGradient | CanvasPattern;
  readonly strokeWidth: number;
  public text: string;
  public color: string | CanvasGradient | CanvasPattern;
  #fontSize: number;
  #offsetX: number;
  #offsetY: number;
  #offCtx: OffscreenCanvasRenderingContext2D;
  #x: number = 0;
  #y: number = 0;
  #strokeWidth: number = 0;

  constructor(
    props: TextEntityProps,
    debug = new Debug("TextEntity", Palette.LightGrey)
  ) {
    super(
      {
        ...props,
        type: "text",
        props: {
          opacity: 0,
          kerning: 0,
          offsetX: 0,
          offsetY: 0,
        },
      },
      debug
    );
    this.text = props.text;
    this.color = props.color;
    this.fontSize = props.fontSize;
    this.fontFamily = props.fontFamily;
    this.textBaseline = props.textBaseline;
    this.textAlign = props.textAlign;
    this.strokeColor = props.strokeColor;
    this.strokeWidth = props.strokeWidth ?? 0;
    this.#fontSize = props.fontSize;
    this.#offsetX = props.offsetX ?? 0;
    this.#offsetY = props.offsetY ?? 0;
    this.#strokeWidth = this.strokeWidth;
    const offCanvas = new OffscreenCanvas(1, 1);
    const offCtx = offCanvas.getContext("2d");
    if (!offCtx) {
      throw new Error("2d context not supported");
    }
    this.#offCtx = offCtx;

    if (this.phases.length === 0) {
      this.props.opacity = 1;
    }
    this.debug.log(`Creating ${this.id}`);
    this.resize();
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
    const { width, fontBoundingBoxAscent, fontBoundingBoxDescent } =
      this.#offCtx.measureText(this.text);
    return {
      width,
      height: fontBoundingBoxAscent + fontBoundingBoxDescent,
    };
  }

  private setDimensions(): this {
    this.#fontSize = this.getFontSize();
    const { width, height } = this.getDimensions();
    this.width = width;
    this.height = height;
    return this;
  }

  setX(x: number): this {
    this.x =
      this.textAlign === "start" || this.textAlign === "left"
        ? x
        : this.textAlign === "center"
          ? x + this.width / 2
          : x + this.width;
    return this;
  }

  setY(y: number): this {
    this.y =
      this.textBaseline === "top"
        ? y
        : this.textBaseline === "middle"
          ? y + this.height / 2
          : y + this.height;
    return this;
  }

  public resize(): this {
    super.resize();
    this.setDimensions();
    const pos = this.getPosition();
    this.setX(pos.x);
    // this.setY(pos.y);
    // this.#offsetX = this.offsetX > 0 ? window.innerWidth / this.offsetX : 0;
    this.#offsetY = getVerticalScaleFactor() * this.offsetY;
    this.#strokeWidth = this.strokeWidth * this.scaleFactor;
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
        case "fade-slide-kerning-in-bottom":
          this.localProgress = easeOutCubic(this.localProgress);
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
      const slide = 50 * this.scaleFactor;

      switch (this.current.name) {
        case "fade-slide-kerning-in-bottom":
          this.props.kerning = lerp(40, 0, this.localProgress);
          this.props.offsetY = lerp(slide, 0, this.localProgress);
          this.props.opacity = lerp(0, 1, this.localProgress);
          break;
        default:
          super.interpolate();
          break;
      }
    }
    return this;
  }

  public render(ctx: CanvasRenderingContext2D): this {
    ctx.save();
    this.#x = this.x + this.props.offsetX + this.#offsetX;
    this.#y = this.y + this.props.offsetY + this.#offsetY;
    ctx.textBaseline = this.textBaseline;
    ctx.textAlign = this.textAlign;
    ctx.globalAlpha = this.props.opacity;
    ctx.letterSpacing = `${this.props.kerning}px`;
    ctx.font = font(this.#fontSize, this.fontFamily);

    if (this.shadowColor) {
      ctx.shadowColor = this.shadowColor;
      const supressX =
        this.current?.name === "float-x" ? this.props.offsetX : 0;
      const supressY =
        this.current?.name === "float-y" ? this.props.offsetY : 0;
      ctx.shadowOffsetX = this.shadowOffsetX * this.scaleFactor - supressX;
      ctx.shadowOffsetY = this.shadowOffsetY * this.scaleFactor - supressY;
      ctx.shadowBlur = this.shadowBlur;
    }

    if (this.strokeColor) {
      ctx.strokeStyle = this.strokeColor;
      ctx.fillStyle = this.strokeColor;
      ctx.lineWidth = this.#strokeWidth;
      ctx.fillText(this.text, this.#x, this.#y);
      ctx.strokeText(this.text, this.#x, this.#y);
    }

    if (this.shadowColor) {
      ctx.shadowColor = "";
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.#x, this.#y);

    // Remove debug visualization
    // ctx.fillRect(this.#x, this.#y, this.width, this.height);
    // ctx.fillStyle = "red";
    // ctx.fillRect(0, window.innerHeight / 4, window.innerWidth, 10);
    // ctx.fillRect(0, (window.innerHeight / 4) * 2, window.innerWidth, 10);
    // ctx.fillRect(0, (window.innerHeight / 4) * 3, window.innerWidth, 10);

    ctx.restore();
    return this;
  }
}

