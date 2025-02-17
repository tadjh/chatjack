import { bustedAnimation, titleAnimation } from "./animations";
import { Card } from "./card";
import {
  ANIMATION_SPEED,
  Palette,
  SPRITE_HEIGHT,
  SPRITE_SCALE,
  SPRITE_WIDTH,
  State,
  TICK_RATE,
} from "./constants";
import { Dealer } from "./dealer";
import { Player } from "./player";
import { Anim, SpriteAnim } from "./types";
import { easeOut, font, rgb, rgba } from "./utils";

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
  private baseFontSize = window.innerWidth * 0.00125;
  private isGameover = false;

  constructor(
    canvas: HTMLCanvasElement,
    private animations = titleAnimation,
    private tickRate = TICK_RATE,
    private baseAnimSpeed = ANIMATION_SPEED,
    private spriteScale = SPRITE_SCALE,
    private spriteWidth = SPRITE_WIDTH,
    private spriteHeight = SPRITE_HEIGHT
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

    this.ctx.textAlign = "center";
    this.ctx.fillStyle = rgb(Palette.White);

    this.animations.forEach((anim, index) => {
      if (anim.type !== "text") return;
      let fontSize = this.baseFontSize * anim.style.fontSize;
      this.ctx.font = font(fontSize, anim.style.fontFamily);
      const textWidth = this.ctx.measureText(anim.text).width;
      let maxWidth = baseMaxWidth;
      if (anim.style.maxWidth !== "full") {
        maxWidth = this.widthMap.get(anim.style.maxWidth) || maxWidth;
      }
      if (textWidth > maxWidth) {
        fontSize *= maxWidth / textWidth;
        this.ctx.font = font(fontSize, anim.style.fontFamily);
      }

      let easing = 1;
      let translateX = anim.translateX?.end || 0;
      let translateY = anim.translateY?.end || 0;
      let kerning = anim.kerning?.end || 0;

      if (anim.progress < 1) {
        if (anim.easing === "linear") {
          easing = anim.progress;
        } else if (anim.easing === "easeOutCubic") {
          easing = easeOut(anim.progress, 3);
        } else if (anim.easing === "easeOutQuint") {
          easing = easeOut(anim.progress, 5);
        }

        if (anim.translateX) {
          translateX = this.lerp(
            anim.translateX.start,
            anim.translateX.end,
            easing
          );
        }

        if (anim.translateY) {
          translateY = this.lerp(
            anim.translateY.start,
            anim.translateY.end,
            easing
          );
        }

        if (anim.kerning) {
          kerning = this.lerp(anim.kerning.start, anim.kerning.end, easing);
        }
      }

      if (anim.float && anim.float.x !== 0) {
        translateX += Math.sin(this.time * anim.float.speed) * anim.float.x;
      }

      if (anim.float && anim.float.y !== 0) {
        translateY += Math.sin(this.time * anim.float.speed) * anim.float.y;
      }

      const lineHeight = fontSize * anim.style.lineHeight;
      const centerX = this.centerX + translateX;
      let centerY = this.centerY;

      if (anim.style.position === "bottom") {
        centerY =
          translateY +
          Math.floor(window.innerHeight - window.innerHeight * 0.025) -
          lineHeight;
      } else {
        centerY =
          Math.floor(window.innerHeight / 3) + translateY + index * lineHeight;
      }

      this.ctx.letterSpacing = `${kerning}px`;

      this.widthMap.set(anim.id, this.ctx.measureText(anim.text).width);

      if (anim.style.shadow) {
        const shadowOffset = anim.progress >= 1 ? translateY : 0;

        this.ctx.strokeStyle = rgba(anim.style.shadow.color, easing);
        this.ctx.lineWidth = fontSize / anim.style.shadow.size;
        this.ctx.fillStyle = rgba(anim.style.shadow.color, easing);
        this.ctx.fillText(
          anim.text,
          centerX + anim.style.shadow.x,
          centerY + anim.style.shadow.y - shadowOffset
        );
        this.ctx.strokeText(
          anim.text,
          centerX + anim.style.shadow.x,
          centerY + anim.style.shadow.y - shadowOffset
        );
      }

      if (anim.style.stroke) {
        this.ctx.strokeStyle = rgba(anim.style.stroke.color, easing);
        this.ctx.lineWidth = fontSize / anim.style.stroke.width;
        this.ctx.strokeText(anim.text, centerX, centerY);
      }

      this.ctx.fillStyle = rgba(anim.style.color, easing);
      this.ctx.fillText(anim.text, centerX, centerY);
    });
  }

  private loopSprite() {
    this.animations.forEach((anim) => {
      if (anim.type !== "loop") return;
      if (!this.spriteSheet) return;

      const scale = (window.innerWidth * 0.2) / this.spriteWidth;

      const destWidth = this.spriteWidth * scale;
      const destHeight = this.spriteHeight * scale;

      const sourceX = anim.steps[anim.currentStep].x * this.spriteScale;
      const sourceY = anim.steps[anim.currentStep].y * this.spriteScale;

      let easing = 1;
      let offsetY = anim.translateY?.end || 0;
      let offsetX = anim.translateX?.end || 0;

      if (anim.progress < 1) {
        if (anim.easing === "linear") {
          easing = anim.progress;
        } else if (anim.easing === "easeOutCubic") {
          easing = easeOut(anim.progress, 3);
        } else if (anim.easing === "easeOutQuint") {
          easing = easeOut(anim.progress, 5);
        }

        if (anim.translateX) {
          offsetX = this.lerp(
            anim.translateX.start,
            anim.translateX.end,
            easing
          );
        }

        if (anim.translateY) {
          offsetY = this.lerp(
            anim.translateY.start,
            anim.translateY.end,
            easing
          );
        }
      }

      if (anim.float && anim.float.y !== 0) {
        offsetX += Math.sin(this.time * anim.float.speed) * anim.float.x * 2;
        offsetY += Math.sin(this.time * anim.float.speed) * anim.float.y * 2;
      }

      let centerX = offsetX + this.centerX - destWidth / 2;
      let centerY = offsetY + this.centerY - destHeight / 2;

      this.ctx.save();
      this.ctx.globalAlpha = easing;

      if (anim.steps[anim.currentStep].flipX) {
        this.ctx.scale(-1, 1);
        centerX = offsetX - this.centerX - destWidth / 2;
      } else if (anim.steps[anim.currentStep].flipY) {
        this.ctx.scale(1, -1);
        centerY = offsetY - this.centerY - destHeight / 2;
      }

      this.ctx.drawImage(
        this.spriteSheet,
        sourceX,
        sourceY,
        this.spriteWidth,
        this.spriteHeight,
        centerX,
        centerY,
        destWidth,
        destHeight
      );
      this.ctx.restore();
    });
  }

  drawSprite(anim: Anim, x: number, y: number) {
    if (anim.type !== "sprite") return;
    if (!this.spriteSheet) return;

    let easing = 1;
    let offsetX = anim.translateX?.end || 0;
    let offsetY = anim.translateY?.end || 0;

    if (anim.progress < 1) {
      if (anim.easing === "linear") {
        easing = anim.progress;
      } else if (anim.easing === "easeOutCubic") {
        easing = easeOut(anim.progress, 3);
      } else if (anim.easing === "easeOutQuint") {
        easing = easeOut(anim.progress, 5);
      }

      if (anim.translateX) {
        offsetX = this.lerp(anim.translateX.start, anim.translateX.end, easing);
      }

      if (anim.translateY) {
        offsetY = this.lerp(anim.translateY.start, anim.translateY.end, easing);
      }
    }

    const scale = (window.innerWidth * 0.2 * anim.scale) / this.spriteWidth;
    const destWidth = this.spriteWidth * scale;
    const destHeight = this.spriteHeight * scale;
    const destX = offsetX + x - destWidth / 2;
    const destY = offsetY + y - destHeight / 2;
    this.ctx.save();
    this.ctx.translate(0, 0);
    this.ctx.rotate(anim.angle);
    this.ctx.globalAlpha = anim.opacity.end;
    this.ctx.drawImage(
      this.spriteSheet,
      anim.sprite.x,
      anim.sprite.y,
      this.spriteWidth,
      this.spriteHeight,
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
      this.drawSprite(card, x, y);
    });
  }

  createCardAnim = (card: Card, index: number, delay?: number): SpriteAnim => {
    const isDealer = card.owner === "Dealer";
    const angle = 8;
    const anim: SpriteAnim = {
      id: `${card.owner}'s ${card.name} ${index}`,
      type: "sprite",
      progress: 0,
      easing: "easeOutQuint",
      speed: 1 / 16,
      sprite: {
        x: card.isHidden ? 0 : this.spriteWidth * 2,
        y: card.isHidden
          ? this.spriteHeight * 52
          : this.spriteHeight * card.valueOf(),
      },
      delay: delay !== undefined ? delay : index * 10,
      scale: isDealer ? 0.75 : 1,
      angle: ((Math.random() * angle * 2 - angle) * Math.PI) / 180,
      opacity: { start: 0, end: card.isBusted ? 0.5 : 1 },
      translateY: {
        start: isDealer ? -this.spriteHeight * 0.75 : this.spriteHeight,
        end: 0,
      },
    };

    return anim;
  };

  private drawCanvas() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.drawBackground();

    switch (this.state) {
      case State.Init:
        this.loopSprite();
        this.drawText();
        break;
      case State.ReadyToDeal:
      case State.PlayerTurn:
      case State.DealerTurn:
        this.drawCards();
        break;
      case State.PlayerBust:
        if (this.isGameover) {
          this.loopSprite();
          this.drawText();
        } else {
          this.drawCards();
          if (this.animations.every((anim) => anim.progress === 1)) {
            this.animations = bustedAnimation;
            this.isGameover = true;
          }
        }
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
    this.baseFontSize = window.innerWidth * 0.00125;
    this.ctx.scale(dpr, dpr);
    this.drawCanvas();
  }

  // The game loop updates animation progress and redraws the canvas.
  private gameLoop = (timestamp: number) => {
    if (timestamp - this.lastTick >= this.tickRate) {
      this.lastTick = timestamp;
      this.time += 1;
      this.animations.forEach((anim) => {
        if (anim.delay && anim.delay > 0) {
          anim.delay -= 1;
        } else {
          if (anim.progress < 1) {
            anim.progress +=
              anim.speed !== undefined ? anim.speed : this.baseAnimSpeed;
            if (anim.progress > 1) anim.progress = 1;
          }

          if (anim.type === "loop") {
            anim.stepProgress += 1;
            if (anim.stepProgress >= anim.stepDuration) {
              anim.stepProgress = 0;
              anim.currentStep = (anim.currentStep + 1) % anim.steps.length;
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

          this.animations = cards.map((card, index) =>
            this.createCardAnim(card, index)
          );
        }
        break;
      case State.PlayerTurn:
      case State.PlayerBust:
        this.createPlayerTurnAnimations();
        break;
      case State.DealerTurn:
        break;
        break;
      default:
        break;
    }

    this.drawCanvas();
  }

  private createPlayerTurnAnimations() {
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

      const cardAnim = this.createCardAnim(cards[i], i, 0);

      if (this.animations[i]) {
        this.animations.splice(i, 0, cardAnim);
      } else {
        this.animations.push(cardAnim);
      }
    }
  }

  private lerp(start: number, end: number, easing: number) {
    let result = end;
    if (start !== end) {
      result = start + (end - start) * easing;
    }
    return result;
  }
}

