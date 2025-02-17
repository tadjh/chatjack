import { animations as anims } from "./animations";
import {
  ANIMATION_SPEED,
  FONT_FAMILY,
  Palette,
  SPRITE_FRAME_HEIGHT,
  SPRITE_FRAME_WIDTH,
  SPRITE_SCALE,
  TICK_RATE,
} from "./constants";
import { TextAnim } from "./types";
import { easeOutCubic, font, rgb, rgba } from "./utils";

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTick = 0;
  private time = 0;
  private spriteSheet: OffscreenCanvas | null = null;
  private widthMap: Map<string, number> = new Map();
  private centerX = Math.floor(window.innerWidth / 2);
  private centerY = Math.floor(window.innerHeight / 2);

  constructor(
    canvas: HTMLCanvasElement,
    private animations = anims,
    private tickRate = TICK_RATE,
    private animSpeed = ANIMATION_SPEED,
    private floatSpeed = ANIMATION_SPEED * 4,
    private floatAmplitude = 3
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to get canvas context");
    }
    ctx.imageSmoothingEnabled = false;
    this.ctx = ctx;
    this.resizeCanvas();
  }

  public async loadFont(fontName: string, fontUrl: string): Promise<void> {
    const fontFace = new FontFace(fontName, `url("${fontUrl}")`);
    if (!document.fonts.has(fontFace)) {
      await fontFace.load();
      document.fonts.add(fontFace);
    }
  }

  private loadSpriteSheet(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(error);
    });
  }

  public async createSpriteSheet(url: string): Promise<void> {
    const spriteSheet = await this.loadSpriteSheet(url);
    const scaledWidth = spriteSheet.width * SPRITE_SCALE;
    const scaledHeight = spriteSheet.height * SPRITE_SCALE;
    const offscreen = new OffscreenCanvas(scaledWidth, scaledHeight);
    const ctx = offscreen.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to get offscreen canvas context");
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      spriteSheet,
      0,
      0,
      spriteSheet.width,
      spriteSheet.height,
      0,
      0,
      scaledWidth,
      scaledHeight
    );
    this.spriteSheet = offscreen;
  }

  private drawBackground() {
    this.ctx.fillStyle = rgb(Palette.DarkGreen);
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  }

  private drawText() {
    const baseMaxWidth = window.innerWidth * 0.8;
    const baseFontSize = window.innerWidth * 0.15;

    this.ctx.textAlign = "center";
    this.ctx.fillStyle = rgb(Palette.White);

    this.animations.forEach((anim, index) => {
      if (anim.type !== "text") return;
      let fontSize = baseFontSize;
      this.ctx.font = font(fontSize, FONT_FAMILY);
      const textWidth = this.ctx.measureText(anim.text).width;
      let maxWidth = baseMaxWidth;
      if (anim.maxWidth !== "full") {
        maxWidth = this.widthMap.get(anim.maxWidth) || maxWidth;
      }
      if (textWidth > maxWidth) {
        fontSize *= maxWidth / textWidth;
        this.ctx.font = font(fontSize, FONT_FAMILY);
      }
      const easing = easeOutCubic(anim.progress);
      const offsetX = this.lerp(anim.offsetX.start, anim.offsetX.end, easing);
      const kerning = this.lerp(anim.kerning.start, anim.kerning.end, easing);
      let offsetY = this.lerp(anim.offsetY.start, anim.offsetY.end, easing);

      offsetY += Math.sin(this.time * this.floatSpeed) * this.floatAmplitude;
      const lineHeight = fontSize * 1.2;
      const centerX = this.centerX + offsetX;
      const centerY = (this.centerY * 2) / 3 + offsetY + index * lineHeight;
      this.ctx.letterSpacing = `${kerning}px`;

      this.widthMap.set(anim.id, this.ctx.measureText(anim.text).width);

      this.drawTextShadow(anim, easing, fontSize, centerX, centerY, offsetY);

      this.drawTextStroke(anim, easing, fontSize, centerX, centerY);

      this.ctx.fillStyle = rgba(anim.color, easing);
      this.ctx.fillText(anim.text, centerX, centerY);
    });
  }

  private drawTextShadow(
    anim: TextAnim,
    easing: number,
    fontSize: number,
    centerX: number,
    centerY: number,
    offsetY: number
  ) {
    if (anim.shadow) {
      const shadowOffset = anim.progress >= 1 ? offsetY : 0;

      this.ctx.strokeStyle = rgba(anim.shadow.color, easing);
      this.ctx.lineWidth = fontSize / anim.shadow.size;
      this.ctx.fillStyle = rgba(anim.shadow.color, easing);
      this.ctx.fillText(
        anim.text,
        centerX + anim.shadow.x,
        centerY + anim.shadow.y - shadowOffset
      );
      this.ctx.strokeText(
        anim.text,
        centerX + anim.shadow.x,
        centerY + anim.shadow.y - shadowOffset
      );
    }
  }

  private drawTextStroke(
    anim: TextAnim,
    easing: number,
    fontSize: number,
    centerX: number,
    centerY: number
  ) {
    if (anim.stroke) {
      this.ctx.strokeStyle = rgba(anim.stroke.color, easing);
      this.ctx.lineWidth = fontSize / anim.stroke.width;
      this.ctx.strokeText(anim.text, centerX, centerY);
    }
  }

  private drawSprite() {
    this.animations.forEach((anim) => {
      if (anim.type !== "sprite") return;
      if (!this.spriteSheet) return;

      const spriteWidth = SPRITE_FRAME_WIDTH * SPRITE_SCALE;
      const spriteHeight = SPRITE_FRAME_HEIGHT * SPRITE_SCALE;

      const scale = (window.innerWidth * 0.2) / spriteWidth;

      const destWidth = spriteWidth * scale;
      const destHeight = spriteHeight * scale;

      const sourceX = anim.frames[anim.currentFrame].x;
      const sourceY = anim.frames[anim.currentFrame].y;

      const easing = easeOutCubic(anim.progress);
      let offsetY = this.lerp(anim.offsetY.start, anim.offsetY.end, easing);
      offsetY +=
        Math.sin(this.time * this.floatSpeed) * this.floatAmplitude * 2;
      this.ctx.save();
      this.ctx.globalAlpha = easing;

      if (anim.frames[anim.currentFrame].flipX) {
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(
          this.spriteSheet,
          sourceX * SPRITE_SCALE,
          sourceY * SPRITE_SCALE,
          spriteWidth,
          spriteHeight,
          -this.centerX - destWidth / 2,
          offsetY + this.centerY - destHeight / 2,
          destWidth,
          destHeight
        );
      } else {
        this.ctx.drawImage(
          this.spriteSheet,
          sourceX * SPRITE_SCALE,
          sourceY * SPRITE_SCALE,
          spriteWidth,
          spriteHeight,
          this.centerX - destWidth / 2,
          offsetY + this.centerY - destHeight / 2,
          destWidth,
          destHeight
        );
      }
      this.ctx.restore();
    });
  }

  private drawCanvas() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.drawBackground();
    this.drawSprite();
    this.drawText();
  }

  public resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.centerX = Math.floor(window.innerWidth / 2);
    this.centerY = Math.floor(window.innerHeight / 2);
    this.ctx.scale(dpr, dpr);
    this.drawCanvas();
  }

  // The game loop updates animation progress and redraws the canvas.
  private gameLoop = (timestamp: number) => {
    if (timestamp - this.lastTick >= this.tickRate) {
      this.lastTick = timestamp;
      this.time += 1;
      this.animations.forEach((anim) => {
        if (anim.fadeInDelay > 0) {
          anim.fadeInDelay -= 1;
        } else {
          if (anim.progress < 1) {
            anim.progress += this.animSpeed;
            if (anim.progress > 1) anim.progress = 1;
          }

          if (anim.type === "sprite") {
            anim.frame += 1;
            if (anim.frame >= anim.speed) {
              anim.frame = 0;
              anim.currentFrame = (anim.currentFrame + 1) % anim.frames.length;
            }
          }
        }
      });

      this.drawCanvas();
    }
    requestAnimationFrame(this.gameLoop);
  };

  public start() {
    this.lastTick = performance.now();
    requestAnimationFrame(this.gameLoop);
    window.addEventListener("resize", this.resizeCanvas.bind(this));
  }

  public stop() {
    window.removeEventListener("resize", this.resizeCanvas.bind(this));
  }

  private lerp(start: number, end: number, easing: number) {
    let result = end;
    if (start !== end) {
      result = start + (end - start) * easing;
    }
    return result;
  }
}

