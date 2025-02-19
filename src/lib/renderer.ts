import {
  actionAnimation,
  gameoverAnimation,
  titleAnimation,
} from "./animations";
import { Card, Rank } from "./card";
import {
  ANIMATION_SPEED,
  Palette,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  State,
  TICK_RATE,
} from "./constants";
import { Dealer } from "./dealer";
import { Player, Role } from "./player";
import { Anim, SpriteAnim, TextAnim } from "./types";
import { easeOut, font, rgb, rgba } from "./utils";

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTick = 0;
  private time = 0;
  private spriteSheet: OffscreenCanvas | HTMLImageElement | null = null;
  private widthMap: Map<string, number> = new Map();
  private centerX = Math.floor(window.innerWidth / 2);
  private centerY = Math.floor(window.innerHeight / 2);
  private dealer = new Dealer();
  private players: Player[] = [];
  private state: State = State.Dealing;
  private playerTurn = 0;
  private baseFontSize = window.innerWidth * 0.00125;
  private showActionText: "in" | "out" | "done" = "done";
  private isHole = true;
  #foreground: Map<string, Anim> = new Map();
  #background: Map<string, Anim> = new Map();

  constructor(
    canvas: HTMLCanvasElement,
    private tickRate = TICK_RATE,
    private baseAnimSpeed = ANIMATION_SPEED,
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
    titleAnimation.forEach(this.setAnimLayer);
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
    this.spriteSheet = spriteSheet;
  }

  private setAnimLayer = (anim: Anim | Anim[]) => {
    if (Array.isArray(anim)) {
      anim.forEach(this.setAnimLayer);
      return;
    }

    if (anim.layer === "foreground") {
      this.#foreground.set(anim.id, anim);
    } else if (anim.layer === "background") {
      this.#background.set(anim.id, anim);
    }
  };

  private getAnimLayer = (layer: "foreground" | "background") => {
    return layer === "foreground" ? this.#foreground : this.#background;
  };

  private clearAnimLayer = (layer: "foreground" | "background" | "both") => {
    if (layer === "foreground" || layer === "both") {
      this.#foreground.clear();
    }
    if (layer === "background" || layer === "both") {
      this.#background.clear();
    }
  };

  private drawBackground() {
    this.ctx.fillStyle = rgb(Palette.DarkGreen);
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  }

  private drawText(anim: TextAnim) {
    const baseMaxWidth = window.innerWidth * 0.8;

    this.ctx.textAlign = "center";
    this.ctx.fillStyle = rgb(Palette.White);

    anim.progress = anim.progress ?? 0;

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
    let opacity = anim.opacity?.end ?? 1;
    let translateX = anim.translateX?.end ?? 0;
    let translateY = anim.translateY?.end ?? 0;
    let kerning = anim.kerning?.end ?? 0;

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

      if (anim.opacity) {
        opacity = this.lerp(anim.opacity.start, anim.opacity.end, easing);
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

    if (anim.position === "bottom") {
      centerY =
        translateY +
        Math.floor(window.innerHeight - window.innerHeight * 0.025) -
        lineHeight;
    } else if (anim.position === "top") {
      centerY =
        Math.floor(window.innerHeight * 0.025) + translateY + lineHeight;
    } else {
      centerY =
        Math.floor(window.innerHeight / 3) +
        translateY +
        anim.index * lineHeight;
    }

    this.ctx.letterSpacing = `${kerning}px`;

    this.widthMap.set(anim.id, this.ctx.measureText(anim.text).width);

    if (anim.style.shadow) {
      const shadowOffset = anim.progress >= 1 ? translateY : 0;

      this.ctx.strokeStyle = rgba(anim.style.shadow.color, opacity);
      this.ctx.lineWidth = fontSize / anim.style.shadow.size;
      this.ctx.fillStyle = rgba(anim.style.shadow.color, opacity);
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
      this.ctx.strokeStyle = rgba(anim.style.stroke.color, opacity);
      this.ctx.lineWidth = fontSize / anim.style.stroke.width;
      this.ctx.strokeText(anim.text, centerX, centerY);
    }

    this.ctx.fillStyle = rgba(anim.style.color, opacity);
    this.ctx.fillText(anim.text, centerX, centerY);
  }

  drawSprite(anim: SpriteAnim) {
    if (!this.spriteSheet) return;

    let easing = 1;
    let translateX = anim.translateX?.end ?? 0;
    let translateY = anim.translateY?.end ?? 0;
    let opacity = anim.opacity?.end ?? 1;
    const anchorX = anim.x ?? this.centerX;
    const anchorY = anim.y ?? this.centerY;
    anim.progress = anim.progress ?? 0;

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

      if (anim.opacity) {
        opacity = this.lerp(anim.opacity.start, anim.opacity.end, easing);
      }
    }

    const sprite = anim.sprites[anim.currentSprite ?? 0];

    const sourceX = sprite.x;
    const sourceY = sprite.y;

    const scale =
      (window.innerWidth * 0.2 * (anim.scale ?? 1)) / this.spriteWidth;

    const destWidth = this.spriteWidth * scale;
    const destHeight = this.spriteHeight * scale;

    if (anim.float) {
      if (anim.float.x !== 0) {
        translateX += Math.sin(this.time * anim.float.speed) * anim.float.x;
      }

      if (anim.float.y !== 0) {
        translateY += Math.sin(this.time * anim.float.speed) * anim.float.y;
      }
    }

    let destX = translateX + anchorX - destWidth / 2;
    let destY = translateY + anchorY - destHeight / 2;

    this.ctx.save();

    if (anim.angle) {
      this.ctx.translate(0, 0);
      this.ctx.rotate(anim.angle);
    }

    this.ctx.globalAlpha = opacity;

    if (sprite.flipX) {
      this.ctx.scale(-1, 1);
      destX = translateX - anchorX - destWidth / 2;
    } else if (sprite.flipY) {
      this.ctx.scale(1, -1);
      destY = translateY - anchorY - destHeight / 2;
    }

    if (anim.shadow) {
      this.ctx.shadowColor = rgba(anim.shadow.color, anim.shadow.opacity);
      this.ctx.shadowBlur = anim.shadow.blur;
      this.ctx.shadowOffsetX = anim.shadow.offsetX;
      this.ctx.shadowOffsetY = anim.shadow.offsetY;
    }

    this.ctx.drawImage(
      this.spriteSheet,
      sourceX,
      sourceY,
      this.spriteWidth,
      this.spriteHeight,
      destX,
      destY,
      destWidth,
      destHeight
    );

    this.ctx.restore();
  }

  private drawCanvas() {
    // this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.drawBackground();

    this.#background.forEach((anim) => {
      if (anim.type === "text") this.drawText(anim);
      if (anim.type === "sprite") this.drawSprite(anim);
    });

    if (
      this.showActionText !== "done" &&
      this.#foreground.has(actionAnimation.id) &&
      this.#foreground.get(actionAnimation.id)!.progress === 1
    ) {
      this.updateActionText();
    }

    this.#foreground.forEach((anim) => {
      if (anim.type === "text") this.drawText(anim);
      if (anim.type === "sprite") this.drawSprite(anim);
    });
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

  private advance = (anim: Anim) => {
    if (anim.delay && anim.delay > 0) {
      anim.delay -= 1;
    } else {
      anim.progress = anim.progress ?? 0;
      if (anim.progress < 1) {
        anim.progress +=
          anim.speed !== undefined ? anim.speed : this.baseAnimSpeed;
        if (anim.progress > 1) anim.progress = 1;
      }

      if (anim.type === "sprite" && anim.playback) {
        anim.currentSprite = anim.currentSprite ?? 0;
        anim.spriteDuration = anim.spriteDuration ?? 6;
        anim.spriteProgress = anim.spriteProgress ?? 0;
        if (anim.playback === "loop") {
          anim.spriteProgress += 1;
          if (anim.spriteProgress >= anim.spriteDuration) {
            anim.spriteProgress = 0;
            anim.currentSprite = (anim.currentSprite + 1) % anim.sprites.length;
          }
        } else if (
          anim.playback === "once" &&
          anim.currentSprite < anim.sprites.length - 1
        ) {
          anim.spriteProgress += 1;
          if (anim.spriteProgress >= anim.spriteDuration) {
            anim.spriteProgress = 0;
            anim.currentSprite = (anim.currentSprite + 1) % anim.sprites.length;
          }
        }
      }
    }
  };

  // The game loop updates animation progress and redraws the canvas.
  private gameLoop = (timestamp: number) => {
    if (timestamp - this.lastTick >= this.tickRate) {
      this.lastTick = timestamp;
      this.time += 1;
      this.#background.forEach(this.advance);
      this.#foreground.forEach(this.advance);
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
    this.setAnimLayer(titleAnimation);
    this.clearAnimLayer("both");
    this.#foreground = new Map<string, Anim>(
      titleAnimation.map((anim) => [anim.id, anim])
    );
    this.dealer = new Dealer();
    this.players = [];
    this.state = State.Init;
    this.isHole = true;
    this.playerTurn = 0;
    this.showActionText = "done";
    this.drawCanvas();
  }

  public update({
    dealer,
    players,
    state,
    playerTurn,
    isGameover,
  }: {
    dealer: Dealer;
    players: Player[];
    state: State;
    playerTurn: number;
    isGameover: boolean;
  }) {
    this.dealer = dealer;
    this.players = players;
    this.state = state;
    this.playerTurn = playerTurn;

    // TODO Remove
    console.log("State:", State[state]);

    if (isGameover) {
      this.createGameoverAnimations();
    } else {
      switch (this.state) {
        case State.Init:
          this.reset();
          break;
        case State.Dealing:
          this.createDealingAnimations();
          break;
        case State.PlayerHit:
        case State.PlayerBust:
        case State.PlayerStand:
        case State.PlayerBlackJack:
          this.createPlayerCardsAnimations();
          this.createActionText(Role.Player);
          break;
        case State.DealerTurn:
        case State.DealerWin:
          this.createDealerTurnAnimations();
          this.createActionText(Role.Dealer);
          break;
        default:
          break;
      }
    }

    this.drawCanvas();
  }

  createCardAnim = (card: Card, delay = 0): SpriteAnim => {
    const isDealer = card.owner === "Dealer";
    const anim: SpriteAnim = {
      id: this.getCardId(card),
      type: "sprite",
      progress: 0,
      easing: "easeOutQuint",
      layer: "background",
      speed: 1 / 16,
      x: this.centerX - 80 + card.index * (isDealer ? -64 : 82),
      y: isDealer
        ? 0 - card.index * 5
        : window.innerHeight - window.innerHeight * 0.2 + card.index * 5,
      sprites: [
        {
          x: card.isHidden ? 0 : (card.suit % 12) * 1024 + this.spriteWidth * 2,
          y: card.isHidden ? 4992 : card.rank * this.spriteHeight,
        },
      ],
      delay,
      scale: isDealer ? 0.75 : 1,
      angle: ((Math.random() * 8 * 2 - 8) * Math.PI) / 180,
      opacity: { start: 1, end: card.isBusted ? 0.5 : 1 },
      translateY: {
        start: isDealer ? -this.spriteHeight * 0.75 : this.spriteHeight,
        end: 0,
      },
      shadow: {
        color: Palette.DarkestGreen,
        opacity: 1,
        offsetX: 4,
        offsetY: 4,
        blur: 0,
      },
    };

    console.log("Card animation created:", anim.id);
    return anim;
  };

  private createDealingAnimations() {
    this.clearAnimLayer("both");
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

    const delay = 10;

    for (let i = 0; i < cards.length; i++) {
      const cardAnim = this.createCardAnim(cards[i], i * delay);
      this.setAnimLayer(cardAnim);
    }
  }

  createActionText(role: Role) {
    this.showActionText = "in";
    const anim = actionAnimation;
    anim.progress = 0;
    anim.opacity = { start: 0, end: 1 };
    anim.kerning = { start: 40, end: 0 };

    if (role === Role.Player) {
      anim.position = "bottom";
      anim.translateY = { start: 50, end: 0 };
      anim.style.fontSize = 60;
      anim.style.color = Palette.Yellow;
    } else if (role === Role.Dealer) {
      anim.position = "top";
      anim.translateY = { start: -50, end: 0 };
      anim.style.fontSize = 48;
      anim.style.color = Palette.White;
    }

    if (this.state === State.PlayerHit) {
      anim.text = "Hit!";
    } else if (this.state === State.PlayerStand) {
      anim.text = "Stand!";
    } else if (this.state === State.PlayerBust) {
      anim.text = "Bust!";
    } else if (this.state === State.PlayerBlackJack) {
      anim.text = "Blackjack!";
    } else if (this.state === State.DealerTurn) {
      anim.text = Rank[this.dealer.hand[1].rank];
    }

    this.setAnimLayer(anim);
  }

  updateActionText() {
    switch (this.showActionText) {
      case "in": {
        const layer = this.getAnimLayer(actionAnimation.layer);
        const anim = layer.get(actionAnimation.id) as TextAnim;
        if (!anim) return;
        this.showActionText = "out";
        anim.progress = 0;
        anim.opacity = { start: 1, end: 0 };
        if (anim.position === "bottom") {
          anim.translateY = { start: 0, end: 50 };
        } else if (anim.position === "top") {
          anim.translateY = { start: 0, end: -50 };
        }
        anim.kerning = { start: 0, end: 40 };
        this.setAnimLayer(anim);
        break;
      }
      case "out":
        this.showActionText = "done";
        break;
      case "done":
      default:
        break;
    }
  }

  private createPlayerCardsAnimations() {
    this.players[this.playerTurn - 1].hand.forEach((card) => {
      const cardId = this.getCardId(card);
      // TODO if createCardAnim layer is background, then this should be too
      const layer = this.getAnimLayer("background");

      if (layer.has(cardId)) {
        if (card.isBusted) {
          const anim = layer.get(cardId) as SpriteAnim;
          anim.opacity = { start: 1, end: card.isBusted ? 0.5 : 1 };
          layer.set(cardId, anim);
        } else if (card.isStand) {
          const anim = layer.get(cardId) as SpriteAnim;
          anim.sprites[0] = {
            x: anim.sprites[0].x + this.spriteWidth,
            y: anim.sprites[0].y,
          };
          layer.set(cardId, anim);
        }
        return;
      }
      const cardAnim = this.createCardAnim(card, 0);

      this.setAnimLayer(cardAnim);
    });
  }

  private createDealerTurnAnimations() {
    if (this.isHole) {
      this.isHole = false;
      const holeCard = this.dealer.hand[1];
      const cardId = this.getCardId(holeCard, "Hidden");
      // TODO if createCardAnim layer is background, then this should be too
      const layer = this.getAnimLayer("background");

      if (layer.has(cardId)) {
        const cardAnim = layer.get(cardId) as SpriteAnim;
        const cardX = (holeCard.suit % 12) * 1024;
        const cardY = holeCard.rank * this.spriteHeight;
        cardAnim.sprites = [
          { x: 0, y: 4992 },
          { x: 256, y: 4992 },
          { x: 512, y: 4992 },
          { x: cardX, y: cardY },
          { x: cardX + 256, y: cardY },
          { x: cardX + 512, y: cardY },
        ];
        cardAnim.playback = "once";
        cardAnim.spriteDuration = 1;
        layer.set(cardId, cardAnim);
      } else {
        throw new Error("Cannot create animation. Dealer card not found");
      }
    } else {
      this.dealer.hand.forEach((card) => {
        const cardId = this.getCardId(card);
        // TODO if createCardAnim layer is background, then this should be too
        const layer = this.getAnimLayer("background");

        if (layer.has(cardId)) {
          if (card.isBusted) {
            const anim = layer.get(cardId) as SpriteAnim;
            anim.opacity = { start: 1, end: card.isBusted ? 0.5 : 1 };
            layer.set(cardId, anim);
          }
          return;
        }

        const cardAnim = this.createCardAnim(card, 0);

        this.setAnimLayer(cardAnim);
      });
    }
  }

  createGameoverAnimations() {
    let title = "";
    let subtitle = "";
    switch (this.state) {
      case State.Push:
        title = "Push!";
        subtitle = "No winner this time...";
        break;
      case State.BothBust:
        title = "Both Bust!";
        subtitle = "No winner this time...";
        break;
      case State.PlayerBlackJack:
        title = "Blackjack!";
        subtitle = "Chat Wins!";
        break;
      case State.DealerBlackJack:
        title = "Dealer hit 21!";
        subtitle = "Better luck next time!";
        break;
      case State.PlayerBust:
        title = "Player Bust!";
        subtitle = "Better luck next time!";
        break;
      case State.DealerBust:
        title = "Dealer Bust!";
        subtitle = "How unfortunate...";
        break;
      case State.PlayerWin:
        title = "Player Wins!";
        subtitle = "You hand is stronger!";
        break;
      case State.DealerWin:
        title = "Dealer Wins!";
        subtitle = "Better luck next time!";
        break;
      default:
        break;
    }

    for (let i = 0; i < gameoverAnimation.length; i++) {
      const anim = gameoverAnimation[i];
      if (anim.id === "title") {
        anim.text = title;
      } else if (anim.id === "subtitle") {
        anim.text = subtitle;
      }
      this.setAnimLayer(anim);
    }
  }

  private getCardId(card: Card, name = card.name) {
    return `[${card.index}] ${card.owner}'s ${name}`;
  }

  private lerp(start: number, end: number, easing: number) {
    let result = end;
    if (start !== end) {
      result = start + (end - start) * easing;
    }
    return result;
  }
}

