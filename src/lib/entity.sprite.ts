import { IMAGE, Palette } from "./constants";
import { Debug } from "./debug";
import { Entity } from "./entity";
import {
  POSITION,
  SpriteCoordinates,
  SpriteEntityAnimationProps,
  SpriteEntityAnimationTypes,
  SpriteEntityProps,
} from "./types";
import {
  getHorizontalScaleFactor,
  getVerticalScaleFactor,
  lerp,
} from "./utils";

export class SpriteEntity extends Entity<
  SpriteEntityAnimationTypes,
  SpriteEntityAnimationProps
> {
  readonly type = "sprite";
  readonly src: IMAGE;
  sprites: [SpriteCoordinates, ...SpriteCoordinates[]];
  readonly spriteWidth: number;
  readonly spriteHeight: number;
  readonly scale: number;
  readonly angle: number;
  #bitmaps: ImageBitmap[] = [];
  #x: number = 0;
  #y: number = 0;
  #offsetX: number = 0;
  #offsetY: number = 0;
  #halfWidth: number = 0;
  #halfHeight: number = 0;
  #spriteProgress: number = 0;
  constructor(
    props: SpriteEntityProps,
    debug = new Debug("SpriteEntity", Palette.Pink)
  ) {
    super(
      {
        ...props,
        type: "sprite",
        props: {
          spriteIndex: 0,
          offsetX: 0,
          offsetY: 0,
          opacity: 1,
        },
      },
      debug
    );
    this.src = props.src;
    this.sprites = props.sprites;
    this.spriteWidth = props.spriteWidth;
    this.spriteHeight = props.spriteHeight;
    this.scale = props.scale ?? 1;
    this.angle = props.angle ?? 0;
    this.resize();
  }

  /**
   * Set all bitmaps for this entity at once
   */
  public setBitmaps(bitmaps: ImageBitmap[]): this {
    this.#bitmaps = bitmaps;
    return this;
  }

  /**
   * Create an image bitmap for a specific sprite index
   * This is now only used by the Engine to create and cache bitmaps
   */
  public createImageBitmap(
    spritesheets: Map<string, HTMLImageElement>,
    index: number
  ): ImageBitmap {
    const image = spritesheets.get(this.src);
    if (!image) {
      throw new Error(`Image not found: ${this.src}`);
    }

    const offscreenCanvas = new OffscreenCanvas(
      this.spriteWidth,
      this.spriteHeight
    );
    const offCtx = offscreenCanvas.getContext("2d");
    if (!offCtx) {
      throw new Error("2d rendering context not supported");
    }
    offCtx.imageSmoothingEnabled = false;
    const { x, y } = this.sprites[index];
    offCtx.drawImage(
      image,
      x,
      y,
      this.spriteWidth,
      this.spriteHeight,
      0,
      0,
      this.spriteWidth,
      this.spriteHeight
    );
    const bitmap = offscreenCanvas.transferToImageBitmap();
    return bitmap;
  }

  /**
   * Get a unique ID for a sprite
   */
  static getSpriteId(src: IMAGE, x: number, y: number) {
    return `${src}-sprite-x-${x}-y-${y}`;
  }

  setY(y: number): this {
    switch (this.position) {
      case POSITION.TOP:
        this.y = y - this.#halfHeight;
        break;
      case POSITION.BOTTOM:
        this.y = y + this.#halfHeight;
        break;
      case POSITION.CENTER:
        this.y = y;
        break;
      default:
        this.y = y;
        break;
    }

    return this;
  }

  public resize(): this {
    super.resize();
    this.width = this.spriteWidth * this.scaleFactor * this.scale;
    this.height = this.spriteHeight * this.scaleFactor * this.scale;
    this.#halfWidth = this.width / 2;
    this.#halfHeight = this.height / 2;
    const pos = this.getPosition();
    this.x = pos.x;
    this.setY(pos.y);
    this.#offsetX = getHorizontalScaleFactor() * this.offsetX;
    this.#offsetY = getVerticalScaleFactor() * this.offsetY;
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
        case "animated-float-y":
        case "flip-over":
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
        case "animated-float-y":
          {
            this.props.opacity = 1;
            this.props.offsetY =
              Math.sin(2 * Math.PI * this.localProgress + Math.PI / 4) *
              (this.current.magnitude ?? 1);

            this.#spriteProgress =
              (this.#spriteProgress + this.baseAnimSpeed / 6) % 1;

            this.props.spriteIndex = Math.floor(
              lerp(0, this.sprites.length - 1, this.#spriteProgress)
            );
          }
          break;
        case "flip-over":
          this.props.spriteIndex = Math.floor(
            lerp(0, this.sprites.length - 1, this.localProgress)
          );
          // this.props.spriteIndex = this.props.spriteIndex === 0 ? 1 : 0;
          break;
        default:
          super.interpolate();
          break;
      }
    }
    return this;
  }

  public render(ctx: CanvasRenderingContext2D): this {
    // Ensure we have bitmaps to render
    if (this.#bitmaps.length === 0) {
      this.debug.log(`No bitmaps available for ${this.id}`);
      return this;
    }

    // Get the current bitmap based on sprite index
    const spriteIndex = Math.min(
      this.props.spriteIndex,
      this.#bitmaps.length - 1
    );
    const currentBitmap = this.#bitmaps[spriteIndex];

    if (!currentBitmap) {
      this.debug.log(`Bitmap not found for sprite index ${spriteIndex}`);
      return this;
    }

    this.#x = this.x + this.#offsetX + this.props.offsetX;
    this.#y = this.y + this.#offsetY + this.props.offsetY;

    const { flipX, flipY } = this.sprites[spriteIndex];

    ctx.save();

    ctx.translate(this.#x + this.#halfWidth, this.#y + this.#halfHeight);

    if (flipX || flipY) {
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    }

    if (this.angle) {
      ctx.rotate(this.angle);
    }

    if (this.shadowColor) {
      ctx.shadowColor = this.shadowColor;
      ctx.shadowBlur = this.shadowBlur;
      ctx.shadowOffsetX = this.shadowOffsetX * this.scaleFactor;
      ctx.shadowOffsetY = this.shadowOffsetY * this.scaleFactor;
    }

    ctx.globalAlpha = this.opacity * this.props.opacity;

    ctx.drawImage(
      currentBitmap,
      -this.#halfWidth,
      -this.#halfHeight,
      this.width,
      this.height
    );
    ctx.restore();
    return this;
  }
}

