import { BASELINE_WIDTH, PADDING, Palette } from "./constants";
import { Debug } from "./debug";
import {
  AnimatedSpriteEntity,
  EntityInterface,
  LAYER,
  SpriteEntity,
  TextEntity,
} from "./types";
import { rgb, font, easeOut, lerp, clamp, rgba, getPosition } from "./utils";

export class Layer extends Map<string, EntityInterface> {
  #ctx: CanvasRenderingContext2D;
  #scaleFactor = window.innerWidth / BASELINE_WIDTH;
  #padding = window.innerWidth * PADDING;
  #sizeMap: Map<
    string,
    { width: number; height: number; x: number; y: number }
  > = new Map();
  #cache = new Map<string, ImageBitmap>();

  constructor(
    private id: LAYER,
    private canvas: HTMLCanvasElement,
    private spritesheets: Map<string, HTMLImageElement>,
    private debug = new Debug(id, rgb(Palette.Tan))
  ) {
    super();
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("2d rendering context not supported");
    }
    this.#ctx = ctx;
    this.#ctx.imageSmoothingEnabled = false;
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.zIndex = id;
    this.resize(0);
  }

  render(time: number) {
    this.clearRect();

    let action;

    this.forEach((entity) => {
      if (entity.id === "action") {
        action = entity;
        return;
      }
      switch (entity.type) {
        case "text":
          this.renderText(entity, time);
          break;
        case "sprite":
        case "animated-sprite":
          this.renderSprite(entity, time);
          break;
        case "timer":
          entity.render(this.#ctx);
          break;
        default:
          break;
      }
    });

    if (action) {
      this.renderText(action, time);
    }
  }

  getFontSize(entity: TextEntity) {
    let fontSize = this.#scaleFactor * entity.style.fontSize;
    this.#ctx.font = font(fontSize, entity.style.fontFamily);
    const textWidth = this.#ctx.measureText(entity.text).width;
    let maxWidth = window.innerWidth - this.#padding * 2;
    if (entity.style.maxWidth !== "full") {
      const dimensions = this.#sizeMap.get(entity.style.maxWidth);
      maxWidth = dimensions?.width || maxWidth;
    }
    if (textWidth > maxWidth) {
      fontSize *= maxWidth / textWidth;
    }
    return fontSize;
  }

  renderText(entity: TextEntity, time: number) {
    this.#ctx.textBaseline = "top";
    this.#ctx.textAlign = "center";
    this.#ctx.fillStyle = rgb(Palette.White);

    const fontSize = this.getFontSize(entity);
    this.#ctx.font = font(fontSize, entity.style.fontFamily);

    let easing = 1;
    entity.progress = entity.progress ?? 0;
    let opacity = entity.opacity?.end ?? 1;
    let translateX = entity.translateX?.end ?? 0;
    let translateY = entity.translateY?.end ?? 0;
    let kerning = entity.kerning?.end ?? 0;

    if (entity.progress < 1) {
      if (entity.easing === "linear") {
        easing = entity.progress;
      } else if (entity.easing === "easeOutCubic") {
        easing = easeOut(entity.progress, 3);
      } else if (entity.easing === "easeOutQuint") {
        easing = easeOut(entity.progress, 5);
      }
      if (entity.translateX) {
        translateX = lerp(
          entity.translateX.start,
          entity.translateX.end,
          easing
        );
      }
      if (entity.translateY) {
        translateY = lerp(
          entity.translateY.start,
          entity.translateY.end,
          easing
        );
      }
      if (entity.opacity) {
        opacity = lerp(entity.opacity.start, entity.opacity.end, easing);
      }
      if (entity.kerning) {
        kerning = lerp(entity.kerning.start, entity.kerning.end, easing);
      }
    }

    const { width, height } = this.getTextDimensions(entity.text, this.#ctx);
    const pos = getPosition(entity.position, width, height);

    if (entity.style.maxWidth !== "full") {
      const dimensions = this.#sizeMap.get(entity.style.maxWidth)!;
      pos.y = dimensions.y + dimensions.height * entity.style.lineHeight;
    }

    entity.x = pos.x;
    entity.y = pos.y;

    if (entity.style.textAlign !== "left") {
      entity.x += width / 2;
    }

    if (entity.float && entity.float.x !== 0) {
      translateX += Math.sin(time * entity.float.speed) * entity.float.x;
    }
    if (entity.float && entity.float.y !== 0) {
      translateY += Math.sin(time * entity.float.speed) * entity.float.y;
    }

    entity.x += (entity.offsetX ?? 0) * window.innerWidth;
    entity.y += (entity.offsetY ?? 0) * window.innerHeight;

    if (entity.clamp) {
      entity.x = clamp(
        entity.x,
        this.#padding + width / 2,
        window.innerWidth - width
      );
      entity.y = clamp(
        entity.y,
        this.#padding,
        window.innerHeight - height - this.#padding
      );
    }

    this.#sizeMap.set(entity.id, { width, height, x: entity.x, y: entity.y });

    entity.x += translateX;
    entity.y += translateY;

    this.#ctx.letterSpacing = `${kerning}px`;

    if (entity.style.shadow) {
      const shadowOffset = entity.progress < 1 ? 0 : translateY;
      this.#ctx.strokeStyle = rgba(entity.style.shadow.color, opacity);
      this.#ctx.lineWidth = fontSize / entity.style.shadow.size;
      this.#ctx.fillStyle = rgba(entity.style.shadow.color, opacity);
      this.#ctx.fillText(
        entity.text,
        entity.x + entity.style.shadow.x,
        entity.y + entity.style.shadow.y - shadowOffset
      );
      this.#ctx.strokeText(
        entity.text,
        entity.x + entity.style.shadow.x,
        entity.y + entity.style.shadow.y - shadowOffset
      );
    }

    if (entity.style.stroke) {
      this.#ctx.strokeStyle = rgba(entity.style.stroke.color, opacity);
      this.#ctx.lineWidth = fontSize / entity.style.stroke.width;
      this.#ctx.strokeText(entity.text, entity.x, entity.y);
    }

    this.#ctx.fillStyle = rgba(entity.style.color, opacity);
    this.#ctx.fillText(entity.text, entity.x, entity.y);
  }

  getCachedSprite(entity: SpriteEntity | AnimatedSpriteEntity) {
    const image = this.spritesheets.get(entity.src);
    if (!image) {
      throw new Error(`Image not found: ${entity.src}`);
    }

    const id = this.getSpriteId(entity);
    if (this.#cache.has(id)) {
      return this.#cache.get(id)!;
    }

    const offscreenCanvas = new OffscreenCanvas(
      entity.spriteWidth,
      entity.spriteHeight
    );
    const offCtx = offscreenCanvas.getContext("2d");
    if (!offCtx) {
      throw new Error("2d rendering context not supported");
    }
    offCtx.imageSmoothingEnabled = false;

    const coords = entity.sprites[entity.spriteIndex ?? 0];

    offCtx.drawImage(
      image,
      coords.x,
      coords.y,
      entity.spriteWidth,
      entity.spriteHeight,
      0,
      0,
      entity.spriteWidth,
      entity.spriteHeight
    );
    const bitmap = offscreenCanvas.transferToImageBitmap();
    this.#cache.set(id, bitmap);
    return bitmap;
  }

  getSpriteId(entity: SpriteEntity | AnimatedSpriteEntity) {
    return `${entity.id}-frame-${entity.spriteIndex ?? 0}`;
  }

  renderSprite(entity: SpriteEntity | AnimatedSpriteEntity, time: number) {
    let easing = 1;
    let translateX = entity.translateX?.end ?? 0;
    let translateY = entity.translateY?.end ?? 0;
    let opacity = entity.opacity?.end ?? 1;
    entity.progress = entity.progress ?? 0;

    if (entity.progress < 1) {
      if (entity.easing === "linear") {
        easing = entity.progress;
      } else if (entity.easing === "easeOutCubic") {
        easing = easeOut(entity.progress, 3);
      } else if (entity.easing === "easeOutQuint") {
        easing = easeOut(entity.progress, 5);
      }

      if (entity.translateX) {
        translateX = lerp(
          entity.translateX.start,
          entity.translateX.end,
          easing
        );
      }

      if (entity.translateY) {
        translateY = lerp(
          entity.translateY.start,
          entity.translateY.end,
          easing
        );
      }

      if (entity.opacity) {
        opacity = lerp(entity.opacity.start, entity.opacity.end, easing);
      }
    }

    if (entity.float) {
      if (entity.float.x !== 0) {
        translateX += Math.sin(time * entity.float.speed) * entity.float.x;
      }

      if (entity.float.y !== 0) {
        translateY += Math.sin(time * entity.float.speed) * entity.float.y;
      }
    }

    const scaleFactor =
      ((entity.scale ?? 1) * (window.innerWidth * 0.2)) / entity.spriteWidth;

    const scaledWidth = entity.spriteWidth * scaleFactor;
    const scaledHeight = entity.spriteHeight * scaleFactor;

    const pos = getPosition(entity.position, scaledWidth, scaledHeight);
    entity.x = pos.x + translateX + (entity.offsetX ?? 0) * scaleFactor;
    entity.y = pos.y + translateY + (entity.offsetY ?? 0) * scaleFactor;

    const sprite = this.getCachedSprite(entity);
    const coords = entity.sprites[entity.spriteIndex ?? 0];

    this.#ctx.save();

    this.#ctx.globalAlpha = opacity;

    this.#ctx.translate(
      entity.x + scaledWidth / 2,
      entity.y + scaledHeight / 2
    );

    if (coords.flipX || coords.flipY) {
      this.#ctx.scale(coords.flipX ? -1 : 1, coords.flipY ? -1 : 1);
    }

    if (entity.angle) {
      this.#ctx.rotate(entity.angle);
    }

    if (entity.shadow) {
      this.#ctx.shadowColor = rgba(entity.shadow.color, entity.shadow.opacity);
      this.#ctx.shadowBlur = entity.shadow.blur;
      this.#ctx.shadowOffsetX = entity.shadow.offsetX;
      this.#ctx.shadowOffsetY = entity.shadow.offsetY;
    }

    this.#ctx.drawImage(
      sprite,
      -scaledWidth / 2,
      -scaledHeight / 2,
      scaledWidth,
      scaledHeight
    );

    this.#ctx.restore();
  }

  clearRect() {
    this.#ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  getTextDimensions(
    text: string,
    ctx: CanvasRenderingContext2D
  ): { width: number; height: number } {
    const metrics = ctx.measureText(text);
    const width = metrics.width;
    // Use actual bounding box values if available (supported in many modern browsers)
    const height =
      metrics.actualBoundingBoxAscent && metrics.actualBoundingBoxDescent
        ? metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        : parseInt(ctx.font, 10); // fallback to using the font size as an approximation
    return { width, height };
  }

  resize(time: number) {
    this.debug.log(`Resizing ${this.id}`);
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * ratio;
    this.canvas.height = window.innerHeight * ratio;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.#scaleFactor = window.innerWidth / BASELINE_WIDTH;
    this.#padding = Math.floor(window.innerWidth * PADDING);
    this.#ctx.scale(ratio, ratio);
    this.render(time);
  }
}
