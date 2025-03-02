import {
  BaseAnimationProps,
  BaseEntityAnimationTypes,
  BaseEntityNoProps,
  Entity,
} from "@/lib/canvas/entity";
import { Debug } from "@/lib/debug";
import { POSITION } from "@/lib/canvas/types";
import {
  getHorizontalScaleFactor,
  getVerticalScaleFactor,
  lerp,
} from "@/lib/canvas/utils";
import { IMAGE } from "@/lib/canvas/constants";

type SpriteEntityAnimationTypes =
  | BaseEntityAnimationTypes
  | "flip-over"
  | "animated-float-y";
type SpriteEntityAnimationProps = BaseAnimationProps & {
  spriteIndex: number;
};

interface SpriteCoordinates {
  x: number;
  y: number;
  flipX?: boolean;
  flipY?: boolean;
}

export type SpriteEntityProps = BaseEntityNoProps<
  SpriteEntityAnimationTypes,
  SpriteEntityAnimationProps
> & {
  type: "sprite";
  src: IMAGE;
  sprites: [SpriteCoordinates, ...SpriteCoordinates[]];
  spriteWidth: number;
  spriteHeight: number;
  scale?: number;
  angle?: number;
  spriteElapsed?: number;
  spriteDuration?: number;
};

export class SpriteEntity extends Entity<
  SpriteEntityAnimationTypes,
  SpriteEntityAnimationProps
> {
  readonly type = "sprite";
  readonly src: IMAGE;
  readonly spriteWidth: number;
  readonly spriteHeight: number;
  readonly scale: number;
  readonly angle: number;
  #sprites: [SpriteCoordinates, ...SpriteCoordinates[]];
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
    debug = new Debug("SpriteEntity", "Pink")
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
    this.#sprites = props.sprites;
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
    const { x, y } = this.#sprites[index];
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
  static formatSpriteId(src: IMAGE, x: number, y: number) {
    return `${src}-sprite-x-${x}-y-${y}`;
  }

  public addSprite(coords: SpriteCoordinates, setActive = false): this {
    this.debug.log(
      `Updating ${this.id}: { x: ${this.#sprites[this.#sprites.length - 1].x}, y: ${this.#sprites[this.#sprites.length - 1].y} }`
    );
    this.#sprites.push(coords);
    if (setActive) {
      this.props.spriteIndex = this.#sprites.length - 1;
    }

    return this;
  }

  public getSprite(index: number): SpriteCoordinates {
    if (index >= this.#sprites.length) {
      throw new Error(`Sprite index out of bounds: ${index}`);
    }
    return this.#sprites[index];
  }

  public setSprite(index: number, coords: SpriteCoordinates): this {
    if (index >= this.#sprites.length) {
      throw new Error(`Sprite index out of bounds: ${index}`);
    }
    this.#sprites[index] = coords;
    return this;
  }

  public getSpriteCount(): number {
    return this.#sprites.length;
  }

  private setY(y: number): this {
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
              lerp(0, this.#sprites.length - 1, this.#spriteProgress)
            );
          }
          break;
        case "flip-over":
          this.props.spriteIndex = Math.floor(
            lerp(0, this.#sprites.length - 1, this.localProgress)
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

    const { flipX, flipY } = this.#sprites[spriteIndex];

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

  public destroy(): this {
    super.destroy();
    this.#bitmaps = [];
    this.#x = 0;
    this.#y = 0;
    this.#offsetX = 0;
    this.#offsetY = 0;
    this.#halfWidth = 0;
    this.#halfHeight = 0;
    this.#spriteProgress = 0;
    this.#sprites = [{} as SpriteCoordinates];
    return this;
  }
}

