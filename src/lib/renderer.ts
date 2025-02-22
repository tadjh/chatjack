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
import { Hand, Status } from "./hand";

export class Renderer {
  #canvas: HTMLCanvasElement;
  #ctx: CanvasRenderingContext2D;
  #lastTick = 0;
  #time = 0;
  #spriteSheet: CanvasImageSource | null = null;
  #widthMap: Map<string, number> = new Map();
  #centerX = Math.floor(window.innerWidth / 2);
  #centerY = Math.floor(window.innerHeight / 2);
  #fontScaleFactor = window.innerWidth * BASE_FONT_SCALE;
  #showActionText: "in" | "out" | "done" = "done";
  #layers: Map<LayerOrder, Layer> = new Map();
  #padding = Math.floor(window.innerWidth * PADDING);
  #holeCardId = "";
  #hasDealt = false;

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

  private getEntityById<T extends Entity>(layer: LayerOrder, id: string) {
    return this.getLayer(layer).get(id) as T | undefined;
  }

  private hasEntityById(layer: LayerOrder, id: string) {
    return this.getLayer(layer).has(id);
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
    this.#ctx.textAlign = "center";
    this.#ctx.fillStyle = rgb(Palette.White);

    entity.progress = entity.progress ?? 0;

    if (entity.type !== "text") return;
    let fontSize = this.#fontScaleFactor * entity.style.fontSize;
    this.#ctx.font = font(fontSize, entity.style.fontFamily);
    let textWidth = this.#ctx.measureText(entity.text).width;
    let maxWidth = window.innerWidth - this.#padding * 2;
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

    originX += translateX + (entity.offsetX ?? 0) * window.innerWidth;
    originY += translateY + (entity.offsetY ?? 0) * window.innerHeight;

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
    this.#fontScaleFactor = window.innerWidth * BASE_FONT_SCALE;
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
          } else if (entity.onEnd) {
            entity.onEnd();
            entity.onEnd = undefined;
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
    console.log("Canvas resetting");
    this.clearLayer(LayerOrder._ALL);
    // this.setEntities(this.titleEntities);
    this.#showActionText = "done";
    this.#hasDealt = false;
    // this.drawCanvas();
  }

  public update({
    dealer,
    player,
    state,
    isGameover,
  }: {
    dealer: Dealer;
    player: Player;
    state: State;
    isGameover: boolean;
  }) {
    // TODO Remove
    console.log("Recieved State:", State[state]);

    if (isGameover) {
      this.createGameoverText(state);
      return;
    }

    switch (state) {
      case State.Init:
        break;
      case State.Dealing:
        if (this.#hasDealt) {
          this.reset();
        }
        this.#hasDealt = true;
        this.clearLayer(LayerOrder._ALL);
        this.createHands(dealer, player);
        this.createScores(dealer, player);
        break;
      case State.PlayerHit:
      case State.PlayerBust:
      case State.PlayerStand:
      case State.PlayerBlackjack:
        this.updateHand(player.hand);
        this.createActionText(state, Role.Player);
        this.updateScores(player);
        break;
      case State.RevealHoleCard:
        this.updateHoleCard(dealer);
        this.updateScores(dealer);
        break;
      case State.DealerHit:
      case State.DealerStand:
      case State.DealerBust:
      case State.DealerBlackjack:
        this.updateHand(dealer.hand);
        this.createActionText(state, Role.Dealer);
        this.updateScores(dealer);
        break;
      default:
        break;
    }
  }

  private createScores(dealer: Dealer, player: Player) {
    // TODO Handle split hands

    const dealerScoreText: Text = {
      ...scoreText,
      id: "dealer-score",
      text: `${dealer.score}`,
      position: "top left",
      style: { ...scoreText.style },
      offsetY: 0.1,
    };

    this.setEntity(dealerScoreText);

    const dealerText: Text = {
      ...scoreText,
      id: "dealer-text",
      text: dealer.name,
      position: "top left",
      style: { ...scoreText.style, fontSize: 20 },
    };

    this.setEntity(dealerText);

    const playerScoreText: Text = {
      ...scoreText,
      id: `${player.name.toLowerCase()}-score`,
      text: player.score.toString(),
      position: "bottom left",
      style: { ...scoreText.style },
      offsetY: -0.1,
    };

    this.setEntity(playerScoreText);

    const playerText: Text = {
      ...scoreText,
      id: `${player.name.toLowerCase()}-text`,
      text: player.name,
      position: "bottom left",
      style: { ...scoreText.style, fontSize: 20 },
    };

    this.setEntity(playerText);
  }

  private getColorScore(score: number) {
    if (score > 21) return Palette.Red;
    if (score === 21) return Palette.Blue;
    if (score > 17) return Palette.Yellow;
    return Palette.White;
  }

  private updateScores(player: Dealer | Player) {
    if (player.role === Role.Dealer) {
      const dealerScore = player.score;
      const dealerScoreText = this.getEntityById<Text>(
        scoreText.layer,
        "dealer-score"
      );
      if (dealerScoreText) {
        dealerScoreText.text = dealerScore.toString();
        dealerScoreText.style.color = this.getColorScore(dealerScore);
        this.setEntity(dealerScoreText);
      }
    } else {
      // TODO Handle split hands
      const playerScoreText = this.getEntityById<Text>(
        scoreText.layer,
        `${player.name.toLowerCase()}-score`
      );
      if (playerScoreText) {
        playerScoreText.text = player.score.toString();
        playerScoreText.style.color = this.getColorScore(player.score);
        this.setEntity(playerScoreText);
      }
    }
  }

  private createCard(card: Card, delay = 0, status: Status) {
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
            : status === "stand"
              ? (card.suit % 12) * 1024 + cardSprite.spriteWidth * 3
              : (card.suit % 12) * 1024 + cardSprite.spriteWidth * 2,
          y: card.isHidden ? 4992 : card.rank * cardSprite.spriteHeight,
        },
      ],
      position: isDealer ? "top" : "bottom",
      delay,
      scale: isDealer ? 0.75 : 1,
      angle: ((Math.random() * 12 * 2 - 12) * Math.PI) / 180,
      opacity: { start: 1, end: status === "busted" ? 0.5 : 1 },
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

  private createHands(dealer: Dealer, player: Player) {
    const delay = 8;
    let count = 0;
    const dealerHand = dealer.hand;
    const playerHand = player.hand;

    this.#holeCardId = dealer.hand[1].id;
    for (let i = 0; i < dealer.hand.length; i++) {
      this.createCard(playerHand[i], count++ * delay, "playing");
      this.createCard(dealerHand[i], count++ * delay, "playing");
    }

    if (playerHand.status === "blackjack") {
      playerHand.forEach((card, index) => {
        const entity = this.getEntityById<Sprite>(cardSprite.layer, card.id)!;
        entity.onEnd = () => {
          entity.sprites[0] = {
            x: (card.suit % 12) * 1024 + cardSprite.spriteWidth * 3,
            y: card.rank * cardSprite.spriteHeight,
          };
          this.setEntity(entity);
          if (index === playerHand.length - 1) {
            this.createActionText(State.PlayerBlackjack, Role.Player);
          }
        };
      });
    }
  }

  private createActionText(state: State, role: Role) {
    this.#showActionText = "in";
    const entity = { ...actionText };
    entity.progress = 0;
    entity.opacity = { start: 0, end: 1 };
    // entity.kerning = { start: 40, end: 0 };

    if (role === Role.Player) {
      entity.position = "bottom";
      entity.translateY = { start: 50, end: 0 };
      entity.style.fontSize = 48;
      entity.offsetY = -0.15;
    } else if (role === Role.Dealer) {
      entity.position = "top";
      entity.translateY = { start: -50, end: 0 };
      entity.style.fontSize = 48;
      entity.offsetY = 0.15;
    }

    switch (state) {
      case State.PlayerHit:
      case State.DealerHit:
        entity.text = "Hit!";
        entity.style.color = Palette.White;
        break;
      case State.PlayerStand:
      case State.DealerStand:
        entity.text = "Stand!";
        entity.style.color = Palette.LightestGrey;
        break;
      case State.PlayerBust:
      case State.DealerBust:
        entity.text = "Bust!";
        entity.style.color = Palette.Red;
        break;
      case State.PlayerBlackjack:
      case State.DealerBlackjack:
        entity.text = "Blackjack!";
        entity.style.color = Palette.Blue;
        break;
      default:
        throw new Error(`Cannot create action text for state: ${state}`);
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

  private updateBustCard(card: Card) {
    const entity = this.getEntityById<Sprite>(cardSprite.layer, card.id)!;
    entity.opacity = {
      start: 1,
      end: 0.5,
    };
    this.setEntity(entity);
  }

  private updateStandCard(card: Card) {
    const entity = this.getEntityById<Sprite | AnimatedSprite>(
      cardSprite.layer,
      card.id
    )!;
    if (entity.type === "sprite") {
      entity.sprites[0] = {
        x: entity.sprites[0].x + entity.spriteWidth,
        y: entity.sprites[0].y,
      };
      this.setEntity(entity);
    } else if (entity.type === "animated-sprite") {
      entity.sprites[entity.spriteIndex] = {
        x: entity.sprites[entity.spriteIndex].x + entity.spriteWidth,
        y: entity.sprites[entity.spriteIndex].y,
      };
      this.setEntity(entity);
    }
  }

  private updateHand(hand: Hand) {
    console.log("Status of hand:", hand.status);

    hand.forEach((card) => {
      if (this.hasEntityById(cardSprite.layer, card.id)) {
        if (hand.isBusted) this.updateBustCard(card);
        if (hand.isStand) this.updateStandCard(card);
      } else {
        this.createCard(card, 0, hand.status);
      }
    });
  }

  private updateHoleCard(dealer: Dealer) {
    const holeCard = dealer.hand[1];
    const entity = this.getEntityById<Sprite>(
      cardSprite.layer,
      this.#holeCardId
    );
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
    this.clearEntity(entity);
    this.setEntity(newHoleCard);
  }

  private createGameoverText(state: State) {
    const titles = gameoverTitles[state as GameoverStates];

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
      entity.progress = 0;
      this.setEntity(entity);
    }
  }
}
