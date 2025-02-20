import {
  actionText,
  cardSprite,
  gameoverText,
  animatedCardSprite,
  titleScreen,
  scoreText,
} from "./entities";
import { Card } from "./card";
import {
  ANIMATION_SPEED,
  BASE_FONT_SCALE,
  gameoverTitles,
  PADDING,
  Palette,
  TICK_RATE,
} from "./constants";
import { Dealer } from "./dealer";
import { Layer } from "./layer";
import { Player, Role } from "./player";
import {
  AnimatedSprite,
  Entity,
  GameoverStates,
  LayerOrder,
  Sprite,
  State,
  Text,
} from "./types";
import { clamp, easeOut, font, lerp, rgb, rgba } from "./utils";

export class Renderer {
  #canvas: HTMLCanvasElement;
  #ctx: CanvasRenderingContext2D;
  #lastTick = 0;
  #time = 0;
  #spriteSheet: CanvasImageSource | null = null;
  #widthMap: Map<string, number> = new Map();
  #centerX = Math.floor(window.innerWidth / 2);
  #centerY = Math.floor(window.innerHeight / 2);
  #dealer = new Dealer();
  #players: Player[] = [];
  #state: State = State.Dealing;
  #baseFontSize = window.innerWidth * BASE_FONT_SCALE;
  #showActionText: "in" | "out" | "done" = "done";
  #isGameover = false;
  #layers: Map<LayerOrder, Layer> = new Map();
  #padding = Math.floor(window.innerWidth * PADDING);

  constructor(
    canvas: HTMLCanvasElement,
    private tickRate = TICK_RATE,
    private baseAnimSpeed = ANIMATION_SPEED,
    private titleEntities = titleScreen
  ) {
    this.#canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to get canvas context");
    }
    ctx.imageSmoothingEnabled = false;
    this.#ctx = ctx;
    this.setEntities(this.titleEntities);
    // this.resizeCanvas();
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
    this.#spriteSheet = spriteSheet;
  }

  private getLayer(layer: LayerOrder) {
    if (!this.#layers.has(layer)) {
      this.#layers.set(layer, new Layer(layer));
    }
    return this.#layers.get(layer)!;
  }

  private clearLayer(layer: LayerOrder) {
    if (layer === LayerOrder._ALL) {
      this.#layers.forEach((layer) => layer.clear());
      return;
    }
    this.#layers.get(layer)?.clear();
  }

  private getEntity<T extends Entity>(entity: T) {
    return this.getLayer(entity.layer).get(entity.id) as T | undefined;
  }

  private getEntityById(id: string, layer: LayerOrder) {
    return this.getLayer(layer).get(id);
  }

  private setEntity(entity: Entity) {
    this.getLayer(entity.layer).set(entity.id, entity);
  }

  private setEntities(entities: Entity[]) {
    for (const entity of entities) {
      this.setEntity(entity);
    }
  }

  private clearEntity(entity: Entity) {
    this.getLayer(entity.layer).delete(entity.id);
  }

  private drawBackground() {
    // this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.#ctx.fillStyle = rgb(Palette.DarkGreen);
    this.#ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  }

  private drawText(entity: Text) {
    const baseMaxWidth = window.innerWidth - this.#padding * 2;

    this.#ctx.textAlign = "center";
    this.#ctx.fillStyle = rgb(Palette.White);

    entity.progress = entity.progress ?? 0;

    if (entity.type !== "text") return;
    let fontSize = this.#baseFontSize * entity.style.fontSize;
    this.#ctx.font = font(fontSize, entity.style.fontFamily);
    let textWidth = this.#ctx.measureText(entity.text).width;
    let maxWidth = baseMaxWidth;
    if (entity.style.maxWidth !== "full") {
      maxWidth = this.#widthMap.get(entity.style.maxWidth) || maxWidth;
    }
    if (textWidth > maxWidth) {
      fontSize *= maxWidth / textWidth;
      this.#ctx.font = font(fontSize, entity.style.fontFamily);
    }

    textWidth = this.#ctx.measureText(entity.text).width;

    let easing = 1;
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

    if (entity.float && entity.float.x !== 0) {
      translateX += Math.sin(this.#time * entity.float.speed) * entity.float.x;
    }

    if (entity.float && entity.float.y !== 0) {
      translateY += Math.sin(this.#time * entity.float.speed) * entity.float.y;
    }

    const lineHeight = fontSize * entity.style.lineHeight;
    let originX = this.#centerX;
    let originY = this.#centerY;
    if (entity.position) {
      if (entity.position.includes("top")) {
        originY = this.#padding + lineHeight;
      } else if (entity.position.includes("bottom")) {
        originY = window.innerHeight - this.#padding;
      }

      if (entity.position.includes("right")) {
        originX = window.innerWidth - textWidth / 2 - this.#padding;
      } else if (entity.position.includes("left")) {
        originX = this.#padding + textWidth / 2;
      }

      if (entity.position === "center") {
        originY =
          Math.floor(window.innerHeight / 3) +
          translateY +
          (entity.index ?? 0) * lineHeight;
      }
    }

    originX += translateX + (entity.offsetX ?? 0);
    originY += translateY + (entity.offsetY ?? 0);

    if (entity.clamp) {
      originX = clamp(
        originX,
        textWidth / 2,
        window.innerWidth - textWidth / 2
      );
      originY = clamp(
        originY,
        lineHeight / 2,
        window.innerHeight - lineHeight / 2
      );
    }

    this.#ctx.letterSpacing = `${kerning}px`;

    this.#widthMap.set(entity.id, this.#ctx.measureText(entity.text).width);

    if (entity.style.shadow) {
      const shadowOffset = entity.progress >= 1 ? translateY : 0;

      this.#ctx.strokeStyle = rgba(entity.style.shadow.color, opacity);
      this.#ctx.lineWidth = fontSize / entity.style.shadow.size;
      this.#ctx.fillStyle = rgba(entity.style.shadow.color, opacity);
      this.#ctx.fillText(
        entity.text,
        originX + entity.style.shadow.x,
        originY + entity.style.shadow.y - shadowOffset
      );
      this.#ctx.strokeText(
        entity.text,
        originX + entity.style.shadow.x,
        originY + entity.style.shadow.y - shadowOffset
      );
    }

    if (entity.style.stroke) {
      this.#ctx.strokeStyle = rgba(entity.style.stroke.color, opacity);
      this.#ctx.lineWidth = fontSize / entity.style.stroke.width;
      this.#ctx.strokeText(entity.text, originX, originY);
    }

    this.#ctx.fillStyle = rgba(entity.style.color, opacity);
    this.#ctx.fillText(entity.text, originX, originY);
  }

  drawSprite(entity: Sprite | AnimatedSprite) {
    if (!this.#spriteSheet) return;

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

    let index = 0;

    if (entity.type === "animated-sprite") {
      index = entity.spriteIndex ?? 0;
    }
    const sprite = entity.sprites[index];

    const sourceX = sprite.x;
    const sourceY = sprite.y;

    const scale =
      ((entity.scale ?? 1) * (window.innerWidth * 0.2)) / entity.spriteWidth;

    const destWidth = entity.spriteWidth * scale;
    const destHeight = entity.spriteHeight * scale;
    const halfWidth = destWidth / 2;
    const halfHeight = destHeight / 2;

    if (entity.float) {
      if (entity.float.x !== 0) {
        translateX +=
          Math.sin(this.#time * entity.float.speed) * entity.float.x;
      }

      if (entity.float.y !== 0) {
        translateY +=
          Math.sin(this.#time * entity.float.speed) * entity.float.y;
      }
    }

    let originX = this.#centerX;
    let originY = this.#centerY;

    if (entity.position) {
      if (entity.position.includes("top")) {
        originY = this.#padding; // + halfHeight;
      } else if (entity.position.includes("bottom")) {
        originY = window.innerHeight - this.#padding;
      }

      if (entity.position.includes("right")) {
        originX = window.innerWidth - destWidth - this.#padding;
      } else if (entity.position.includes("left")) {
        originX = this.#padding;
      }
    }

    originX += translateX + (entity.offsetX ?? 0) * scale;
    originY += translateY + (entity.offsetY ?? 0) * scale;

    let destX = originX - halfWidth;
    let destY = originY - halfHeight;

    this.#ctx.save();

    this.#ctx.globalAlpha = opacity;

    if (sprite.flipX) {
      this.#ctx.scale(-1, 1);
      destX = translateX - originX - halfWidth;
    } else if (sprite.flipY) {
      this.#ctx.scale(1, -1);
      destY = translateY - originY - halfHeight;
    }

    if (entity.angle) {
      this.#ctx.translate(destX + halfWidth, destY + halfHeight);
      this.#ctx.rotate(entity.angle);
      destX = -halfWidth;
      destY = -halfHeight;
    }

    if (entity.shadow) {
      this.#ctx.shadowColor = rgba(entity.shadow.color, entity.shadow.opacity);
      this.#ctx.shadowBlur = entity.shadow.blur;
      this.#ctx.shadowOffsetX = entity.shadow.offsetX;
      this.#ctx.shadowOffsetY = entity.shadow.offsetY;
    }

    this.#ctx.drawImage(
      this.#spriteSheet,
      sourceX,
      sourceY,
      entity.spriteWidth - 1, // TODO 1 px bleeding
      entity.spriteHeight,
      destX,
      destY,
      destWidth,
      destHeight
    );

    this.#ctx.restore();
  }

  private drawCanvas() {
    this.drawBackground();
    for (const [, layer] of this.#layers) {
      // TODO Find a way to mathmetically determine when to reverse action text animation
      if (layer.has(actionText.id)) {
        const action = layer.get(actionText.id)! as Text;
        if (action.progress === 1 && this.#showActionText !== "done") {
          this.updateActionText();
        }
      }
      for (const [, entity] of layer) {
        if (entity.type === "text") {
          this.drawText(entity);
        } else {
          this.drawSprite(entity);
        }
      }
    }
  }

  public resizeCanvas = () => {
    const dpr = window.devicePixelRatio || 1;
    this.#canvas.width = window.innerWidth * dpr;
    this.#canvas.height = window.innerHeight * dpr;
    this.#canvas.style.width = `${window.innerWidth}px`;
    this.#canvas.style.height = `${window.innerHeight}px`;
    this.#centerX = Math.floor(window.innerWidth / 2);
    this.#centerY = Math.floor(window.innerHeight / 2);
    this.#baseFontSize = window.innerWidth * BASE_FONT_SCALE;
    this.#padding = Math.floor(window.innerWidth * PADDING);
    this.#ctx.scale(dpr, dpr);
    this.drawCanvas();
  };

  // The game loop updates animation progress and redraws the canvas.
  private step = (timestamp: number) => {
    if (timestamp - this.#lastTick >= this.tickRate) {
      this.#lastTick = timestamp;
      this.#time += 1;

      for (const [, layer] of this.#layers) {
        for (const [, entity] of layer) {
          if (entity.delay && entity.delay > 0) {
            entity.delay -= 1;
            continue;
          }

          entity.progress = entity.progress ?? 0;

          if (entity.progress < 1) {
            entity.progress += entity.speed ?? this.baseAnimSpeed;
            if (entity.progress > 1) entity.progress = 1;
          }

          if (entity.type === "animated-sprite") {
            if (
              entity.playback === "once" &&
              entity.spriteIndex === entity.sprites.length - 1
            ) {
              continue;
            }

            entity.spriteElapsed = entity.spriteElapsed ?? 0;
            entity.spriteElapsed += 1;
            if (entity.spriteElapsed >= entity.spriteDuration) {
              entity.spriteElapsed = 0;
              entity.spriteIndex =
                (entity.spriteIndex + 1) % entity.sprites.length;
            }
          }
        }
      }

      this.drawCanvas();
    }
    requestAnimationFrame(this.step);
  };

  public start() {
    this.#lastTick = performance.now();
    requestAnimationFrame(this.step);
    window.addEventListener("resize", this.resizeCanvas);
  }

  public stop() {
    window.removeEventListener("resize", this.resizeCanvas);
  }

  private reset() {
    this.clearLayer(LayerOrder._ALL);
    this.setEntities(this.titleEntities);
    this.#dealer = new Dealer();
    this.#players = [];
    this.#state = State.Init;
    this.#isGameover = false;
    this.#showActionText = "done";
    // this.drawCanvas();
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
    // Restarted game
    if (this.#isGameover && state === State.Dealing) {
      this.reset();
    }

    this.#dealer = dealer;
    this.#players = players;
    this.#state = state;
    this.#isGameover = isGameover;

    // TODO Remove
    console.log("State:", State[state]);

    if (isGameover) {
      this.createGameoverText();
      return;
    }

    switch (this.#state) {
      case State.Init:
        this.reset();
        break;
      case State.Dealing:
        this.clearLayer(LayerOrder._ALL);
        this.createDealingCards();
        this.createScores();
        break;
      case State.PlayerHit:
      case State.PlayerBust:
      case State.PlayerStand:
      case State.PlayerBlackJack:
        this.createPlayerCards(playerTurn);
        this.createActionText(Role.Player);
        this.updateScores(Role.Player);
        break;
      case State.RevealHoleCard:
        this.updateHoleCard();
        this.updateScores(Role.Dealer);
        break;
      case State.DealerHit:
      case State.DealerStand:
      case State.DealerBust:
      case State.DealerBlackJack:
        this.createDealerCards();
        this.createActionText(Role.Dealer);
        this.updateScores(Role.Dealer);
        break;
      default:
        break;
    }
  }

  private createScores() {
    const dealerScore = this.#dealer.score;
    // TODO Handle split hands
    const playerScores = this.#players.map((player) => player.score);

    const dealerText: Text = {
      ...scoreText,
      id: "dealer-score",
      text: dealerScore.toString(),
      position: "top right",
      style: { ...scoreText.style },
    };

    this.setEntity(dealerText);

    playerScores.forEach((score, index) => {
      const playerText: Text = {
        ...scoreText,
        id: `player-${index + 1}-score`,
        text: score.toString(),
        position: "bottom right",
        style: { ...scoreText.style },
      };

      this.setEntity(playerText);
    });
  }

  private getColorScore(score: number) {
    if (score > 21) return Palette.Red;
    if (score === 21) return Palette.Blue;
    if (score > 17) return Palette.Yellow;
    return Palette.White;
  }

  private updateScores(role: Role) {
    if (role === Role.Dealer) {
      const dealerScore = this.#dealer.score;
      const dealerText = this.getEntityById(
        "dealer-score",
        LayerOrder.Foreground
      ) as Text | undefined;
      if (dealerText) {
        dealerText.text = dealerScore.toString();
        dealerText.style.color = this.getColorScore(dealerScore);
        this.setEntity(dealerText);
      }
    } else {
      // TODO Handle split hands
      const playerScores = this.#players.map((player) => player.score);

      playerScores.forEach((score, index) => {
        const playerText = this.getEntityById(
          `player-${index + 1}-score`,
          LayerOrder.Foreground
        ) as Text | undefined;
        if (playerText) {
          playerText.text = score.toString();
          playerText.style.color = this.getColorScore(score);
          this.setEntity(playerText);
        }
      });
    }
  }

  private createCard(card: Card, delay = 0) {
    const isDealer = card.owner === "Dealer";
    const entity: Sprite = {
      ...cardSprite,
      id: card.id,
      progress: 0,
      offsetX:
        (isDealer ? 80 : -cardSprite.spriteWidth / 2) +
        card.handIndex * (isDealer ? -128 : 128),
      offsetY: isDealer ? Math.random() * 64 : -32 + Math.random() * -128,
      sprites: [
        {
          x: card.isHidden
            ? 0
            : (card.suit % 12) * 1024 + cardSprite.spriteWidth * 2,
          y: card.isHidden ? 4992 : card.rank * cardSprite.spriteHeight,
        },
      ],
      position: isDealer ? "top" : "bottom",
      delay,
      scale: isDealer ? 0.75 : 1,
      angle: ((Math.random() * 12 * 2 - 12) * Math.PI) / 180,
      opacity: { start: 1, end: card.isBusted ? 0.5 : 1 },
      translateY: {
        start: isDealer
          ? -cardSprite.spriteHeight * 2 * 0.75
          : cardSprite.spriteHeight * 2,
        end: 0,
      },
    };

    console.log("Card entity created:", entity.id);
    this.setEntity(entity);
  }

  private createDealingCards() {
    // TODO support split hands
    let maxLength = this.#dealer.hand.length;

    this.#players.forEach((player) => {
      // TODO Support split hands
      maxLength = Math.max(maxLength, player.hand.length);
    });

    const cards: Card[] = [];

    for (let i = 0; i < maxLength; i++) {
      cards.push(
        ...this.#players
          .map((player) => {
            if (player.hand.length <= i) return undefined;
            return player.hand[i];
          })
          .filter((card) => card !== undefined)
      );
      if (this.#dealer.hand.length > i) {
        cards.push(this.#dealer.hand[i]);
      }
    }

    const delay = 8;

    for (let i = 0; i < cards.length; i++) {
      this.createCard(cards[i], i * delay);
    }
  }

  private createActionText(role: Role) {
    this.#showActionText = "in";
    const entity = actionText;
    entity.progress = 0;
    entity.opacity = { start: 0, end: 1 };
    // entity.kerning = { start: 40, end: 0 };

    if (role === Role.Player) {
      entity.position = "bottom";
      entity.translateY = { start: 50, end: 0 };
      entity.style.fontSize = 48;
      entity.offsetY = -window.innerHeight * 0.15;
    } else if (role === Role.Dealer) {
      entity.position = "top";
      entity.translateY = { start: -50, end: 0 };
      entity.style.fontSize = 48;
      entity.offsetY = window.innerHeight * 0.15;
    }

    if (this.#state === State.PlayerHit || this.#state === State.DealerHit) {
      entity.text = "Hit!";
      entity.style.color = Palette.White;
    } else if (
      this.#state === State.PlayerStand ||
      this.#state === State.DealerStand
    ) {
      entity.style.color = Palette.LightestGrey;
      entity.text = "Stand!";
    } else if (
      this.#state === State.PlayerBust ||
      this.#state === State.DealerBust
    ) {
      entity.style.color = Palette.Red;
      entity.text = "Bust!";
    } else if (
      this.#state === State.PlayerBlackJack ||
      this.#state === State.DealerBlackJack
    ) {
      entity.style.color = Palette.Blue;
      entity.text = "Blackjack!";
    }

    this.setEntity(entity);
  }

  private updateActionText() {
    switch (this.#showActionText) {
      case "in": {
        const entity = this.getEntity(actionText);
        if (!entity) return;
        this.#showActionText = "out";
        entity.progress = 0;
        entity.opacity = { start: 1, end: 0 };
        if (entity.position === "bottom") {
          entity.translateY = { start: 0, end: 50 };
        } else if (entity.position === "top") {
          entity.translateY = { start: 0, end: -50 };
        }
        // entity.kerning = { start: 0, end: 40 };
        this.setEntity(entity);
        break;
      }
      case "out":
        this.#showActionText = "done";
        break;
      case "done":
        this.clearEntity(actionText);
        break;
      default:
        throw new Error(
          `Cannot update step: ${this.#showActionText} for action text`
        );
    }
  }

  private createPlayerCards(turn: number) {
    this.#players[turn - 1].hand.forEach((card) => {
      const layer = this.getLayer(cardSprite.layer);
      if (layer.has(card.id)) {
        if (card.isBusted) {
          // If bust, draw card with 50% opacity
          const entity = layer.get(card.id) as Sprite;
          entity.opacity = { start: 1, end: card.isBusted ? 0.5 : 1 };
          layer.set(card.id, entity);
        } else if (card.isStand) {
          // If stand, draw tinted sprite
          const entity = layer.get(card.id) as Sprite;
          entity.sprites[0] = {
            x: entity.sprites[0].x + entity.spriteWidth,
            y: entity.sprites[0].y,
          };
          layer.set(card.id, entity);
        }
        return;
      }
      this.createCard(card, 0);
    });
  }

  private updateHoleCard() {
    const holeCard = this.#dealer.hand[1];
    const entity = this.getEntityById(holeCard.id, cardSprite.layer) as
      | Sprite
      | undefined;
    if (!entity) {
      throw new Error("Cannot animate entity. Hole card not found");
    }
    const cardX = (holeCard.suit % 12) * 1024;
    const cardY = holeCard.rank * entity.spriteHeight;
    const newHoleCard: AnimatedSprite = {
      ...entity,
      ...animatedCardSprite,
      id: holeCard.id,
      sprites: [
        ...animatedCardSprite.sprites,
        { x: cardX, y: cardY },
        { x: cardX + 256, y: cardY },
        { x: cardX + 512, y: cardY },
      ],
    };
    this.setEntity(newHoleCard);
  }

  private createDealerCards() {
    this.#dealer.hand.forEach((card) => {
      const layer = this.getLayer(cardSprite.layer);
      if (layer.has(card.id)) {
        if (card.isBusted) {
          const entity = layer.get(card.id) as Sprite;
          entity.opacity = { start: 1, end: card.isBusted ? 0.5 : 1 };
          this.setEntity(entity);
        }
        return;
      }
      this.createCard(card, 0);
    });
  }

  private createGameoverText() {
    const titles = gameoverTitles[this.#state as GameoverStates];

    if (!titles) {
      throw new Error("Gameover title not found");
    }

    const { title, subtitle } = titles;

    for (const entity of gameoverText) {
      if (entity.id === "title") {
        entity.text = title;
      } else if (entity.id === "subtitle") {
        entity.text = subtitle;
      }
      this.setEntity(entity);
    }
  }
}
