import { bustedAnimation, titleAnimation } from "./animations";
import { Card } from "./card";
import {
  ANIMATION_SPEED,
  Palette,
  SPRITE_FRAME_HEIGHT,
  SPRITE_FRAME_WIDTH,
  SPRITE_SCALE,
  State,
  TICK_RATE,
} from "./constants";
import { Dealer } from "./dealer";
import { Player } from "./player";
import { Anim, SpriteAnim, TextAnim } from "./types";
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
  private dealer = new Dealer();
  private players: Player[] = [];
  private state: State = State.ReadyToDeal;

  constructor(
    canvas: HTMLCanvasElement,
    private animations = titleAnimation,
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

  private drawTitleText() {
    const baseMaxWidth = window.innerWidth * 0.8;
    const baseFontSize = window.innerWidth * 0.025;

    this.ctx.textAlign = "center";
    this.ctx.fillStyle = rgb(Palette.White);

    this.animations.forEach((anim, index) => {
      if (anim.type !== "text") return;
      let fontSize = baseFontSize * anim.fontSize;
      this.ctx.font = font(fontSize, anim.fontFamily);
      const textWidth = this.ctx.measureText(anim.text).width;
      let maxWidth = baseMaxWidth;
      if (anim.maxWidth !== "full") {
        maxWidth = this.widthMap.get(anim.maxWidth) || maxWidth;
      }
      if (textWidth > maxWidth) {
        fontSize *= maxWidth / textWidth;
        this.ctx.font = font(fontSize, anim.fontFamily);
      }
      const easing = easeOutCubic(anim.progress);
      const slideX = this.lerp(anim.slideX.start, anim.slideX.end, easing);
      const kerning = this.lerp(anim.kerning.start, anim.kerning.end, easing);
      let slideY = this.lerp(anim.slideY.start, anim.slideY.end, easing);
      slideY += Math.sin(this.time * this.floatSpeed) * this.floatAmplitude;
      const lineHeight = fontSize * anim.lineHeight;
      const centerX = this.centerX + slideX;

      let centerY = this.centerY;
      if (anim.position === "bottom") {
        centerY = window.innerHeight - 40 - lineHeight * 0.5;
      } else {
        centerY =
          Math.floor(window.innerHeight / 3) + slideY + index * lineHeight;
      }

      this.ctx.letterSpacing = `${kerning}px`;

      this.widthMap.set(anim.id, this.ctx.measureText(anim.text).width);

      this.drawTextShadow(anim, easing, fontSize, centerX, centerY, slideY);

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

  private drawCardLoop() {
    this.animations.forEach((anim) => {
      if (anim.type !== "loop") return;
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

  drawCard(anim: Anim, x: number, y: number) {
    if (anim.type !== "sprite") return;
    if (!this.spriteSheet) return;
    const sourceX = anim.sprite.x;
    const sourceY = anim.sprite.y;
    const spriteWidth = SPRITE_FRAME_WIDTH * SPRITE_SCALE;
    const spriteHeight = SPRITE_FRAME_HEIGHT * SPRITE_SCALE;

    const easing = easeOutCubic(anim.progress);
    const offsetY = this.lerp(anim.offsetY.start, anim.offsetY.end, easing);
    const scale = (window.innerWidth * 0.2 * anim.scale) / spriteWidth;
    const destWidth = spriteWidth * scale;
    const destHeight = spriteHeight * scale;
    const destX = x - destWidth / 2;
    const destY = offsetY + y - destHeight / 2;
    this.ctx.save();
    this.ctx.translate(0, 0);
    this.ctx.rotate(anim.angle);
    this.ctx.globalAlpha = anim.opacity.end;
    this.ctx.drawImage(
      this.spriteSheet,
      sourceX,
      sourceY,
      spriteWidth,
      spriteHeight,
      destX,
      destY,
      destWidth,
      destHeight
    );
    this.ctx.restore();
  }

  drawCards() {
    this.animations.forEach((card, index) => {
      const isDealer = card.id.includes("Dealer");
      const x = this.centerX - 80 + index * (isDealer ? -64 : 82);
      const y = isDealer
        ? 0 - index * 5
        : window.innerHeight - window.innerHeight * 0.2 + index * 5;
      this.drawCard(card, x, y);
    });
  }

  private drawCanvas() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.drawBackground();

    switch (this.state) {
      case State.PlayerBust:
      case State.Init:
        this.drawCardLoop();
        this.drawTitleText();
        break;
      case State.ReadyToDeal:
      case State.PlayerTurn:
      case State.DealerTurn:
        this.drawCards();
        break;
      default:
        break;
    }
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

          if (anim.type === "loop") {
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

  reset() {
    this.animations = titleAnimation;
    this.dealer = new Dealer();
    this.players = [];
    this.state = State.Init;
    this.drawCanvas();
  }

  public update({
    dealer,
    players,
    state,
  }: {
    dealer: Dealer;
    players: Player[];
    state: State;
  }) {
    this.dealer = dealer;
    this.players = players;
    this.state = state;

    console.log("State:", State[state]);

    switch (this.state) {
      case State.Init:
        this.reset();
        break;
      case State.ReadyToDeal:
        {
          // TODO support split hands
          let maxLength = this.dealer.hand.length;

          this.players.forEach((player) => {
            // TODO Support split hands
            maxLength = Math.max(maxLength, player.hand.length);
          });

          const cards: Card[] = [];

          for (let i = 0; i < maxLength; i++) {
            cards.push(
              ...this.players
                .map((player) => {
                  if (player.hand.length <= i) return undefined;
                  return player.hand[i];
                })
                .filter((card) => card !== undefined)
            );
            if (this.dealer.hand.length > i) {
              cards.push(this.dealer.hand[i]);
            }
          }

          const spriteWidth = SPRITE_FRAME_WIDTH * SPRITE_SCALE;
          const spriteHeight = SPRITE_FRAME_HEIGHT * SPRITE_SCALE;
          this.animations = cards.map((card, index) => ({
            id: `${card.owner}'s ${card.name} ${index}`,
            type: "sprite",
            progress: 0,
            sprite: {
              x: card.isHidden ? 0 : spriteWidth * 2,
              y: card.isHidden
                ? spriteHeight * 52
                : spriteHeight * card.valueOf(),
            },
            fadeInDelay: index * 12,
            maxWidth: "full",
            scale: card.owner === "Dealer" ? 0.75 : 1,
            angle: ((Math.random() * 16 - 8) * Math.PI) / 180,
            opacity: { start: 0, end: card.isBusted ? 0.5 : 1 },
            offsetX: { start: 0, end: 0 },
            offsetY: {
              start:
                card.owner === "Dealer" ? -spriteHeight * 0.75 : spriteHeight,
              end: 0,
            },
          }));
        }
        break;
      case State.PlayerTurn:
        {
          // TODO support split hands
          let maxLength = this.dealer.hand.length;

          this.players.forEach((player) => {
            // TODO Support split hands
            maxLength = Math.max(maxLength, player.hand.length);
          });

          const cards: Card[] = [];

          for (let i = 0; i < maxLength; i++) {
            cards.push(
              ...this.players
                .map((player) => {
                  if (player.hand.length <= i) return undefined;
                  return player.hand[i];
                })
                .filter((card) => card !== undefined)
            );
            if (this.dealer.hand.length > i) {
              cards.push(this.dealer.hand[i]);
            }
          }

          for (let i = 0; i < cards.length; i++) {
            const cardId = `${cards[i].owner}'s ${cards[i].name} ${i}`;
            if (this.animations[i] && this.animations[i].id === cardId) {
              (this.animations[i] as SpriteAnim).opacity.end = cards[i].isBusted
                ? 0.5
                : 1;
              continue;
            }

            const spriteWidth = SPRITE_FRAME_WIDTH * SPRITE_SCALE;
            const spriteHeight = SPRITE_FRAME_HEIGHT * SPRITE_SCALE;
            const newAnimation: SpriteAnim = {
              id: cardId,
              type: "sprite",
              progress: 0,
              sprite: {
                x: cards[i].isHidden ? 0 : spriteWidth * 2,
                y: cards[i].isHidden
                  ? spriteHeight * 52
                  : spriteHeight * cards[i].valueOf(),
              },
              fadeInDelay: 0,
              scale: cards[i].owner === "Dealer" ? 0.75 : 1,
              angle: ((Math.random() * 16 - 8) * Math.PI) / 180,
              opacity: { start: 0, end: cards[i].isBusted ? 0.5 : 1 },
              offsetX: { start: 0, end: 0 },
              offsetY: {
                start:
                  cards[i].owner === "Dealer"
                    ? -spriteHeight * 0.75
                    : spriteHeight,

                end: 0,
              },
            };

            if (this.animations[i]) {
              this.animations.splice(i, 0, newAnimation);
            } else {
              this.animations.push(newAnimation);
            }
          }
        }
        break;
      case State.DealerTurn:
        break;
      case State.PlayerBust:
        this.animations = bustedAnimation;
        break;
      default:
        break;
    }

    this.drawCanvas();
  }

  private lerp(start: number, end: number, easing: number) {
    let result = end;
    if (start !== end) {
      result = start + (end - start) * easing;
    }
    return result;
  }
}

