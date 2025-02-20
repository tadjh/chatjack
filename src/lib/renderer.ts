import {
  actionText,
  cardSprite,
  gameoverText,
  animatedCardSprite,
  titleScreen,
} from "./entities";
import { Card, Rank } from "./card";
import { ANIMATION_SPEED, Palette, State, TICK_RATE } from "./constants";
import { Dealer } from "./dealer";
import { Layer } from "./layer";
import { Player, Role } from "./player";
import { AnimatedSprite, Entity, LayerOrder, Sprite, Text } from "./types";
import { easeOut, font, lerp, rgb, rgba } from "./utils";

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
  #baseFontSize = window.innerWidth / 800;
  #showActionText: "in" | "out" | "done" = "done";
  #isGameover = false;
  #layers: Map<LayerOrder, Layer> = new Map();

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
    if (layer === LayerOrder.All) {
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

  private drawText(anim: Text) {
    const baseMaxWidth = window.innerWidth * 0.8;

    this.#ctx.textAlign = "center";
    this.#ctx.fillStyle = rgb(Palette.White);

    anim.progress = anim.progress ?? 0;

    if (anim.type !== "text") return;
    let fontSize = this.#baseFontSize * anim.style.fontSize;
    this.#ctx.font = font(fontSize, anim.style.fontFamily);
    const textWidth = this.#ctx.measureText(anim.text).width;
    let maxWidth = baseMaxWidth;
    if (anim.style.maxWidth !== "full") {
      maxWidth = this.#widthMap.get(anim.style.maxWidth) || maxWidth;
    }
    if (textWidth > maxWidth) {
      fontSize *= maxWidth / textWidth;
      this.#ctx.font = font(fontSize, anim.style.fontFamily);
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
        translateX = lerp(anim.translateX.start, anim.translateX.end, easing);
      }

      if (anim.translateY) {
        translateY = lerp(anim.translateY.start, anim.translateY.end, easing);
      }

      if (anim.opacity) {
        opacity = lerp(anim.opacity.start, anim.opacity.end, easing);
      }

      if (anim.kerning) {
        kerning = lerp(anim.kerning.start, anim.kerning.end, easing);
      }
    }

    if (anim.float && anim.float.x !== 0) {
      translateX += Math.sin(this.#time * anim.float.speed) * anim.float.x;
    }

    if (anim.float && anim.float.y !== 0) {
      translateY += Math.sin(this.#time * anim.float.speed) * anim.float.y;
    }

    const lineHeight = fontSize * anim.style.lineHeight;
    const centerX = this.#centerX + translateX;
    let centerY = this.#centerY;

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

    this.#ctx.letterSpacing = `${kerning}px`;

    this.#widthMap.set(anim.id, this.#ctx.measureText(anim.text).width);

    if (anim.style.shadow) {
      const shadowOffset = anim.progress >= 1 ? translateY : 0;

      this.#ctx.strokeStyle = rgba(anim.style.shadow.color, opacity);
      this.#ctx.lineWidth = fontSize / anim.style.shadow.size;
      this.#ctx.fillStyle = rgba(anim.style.shadow.color, opacity);
      this.#ctx.fillText(
        anim.text,
        centerX + anim.style.shadow.x,
        centerY + anim.style.shadow.y - shadowOffset
      );
      this.#ctx.strokeText(
        anim.text,
        centerX + anim.style.shadow.x,
        centerY + anim.style.shadow.y - shadowOffset
      );
    }

    if (anim.style.stroke) {
      this.#ctx.strokeStyle = rgba(anim.style.stroke.color, opacity);
      this.#ctx.lineWidth = fontSize / anim.style.stroke.width;
      this.#ctx.strokeText(anim.text, centerX, centerY);
    }

    this.#ctx.fillStyle = rgba(anim.style.color, opacity);
    this.#ctx.fillText(anim.text, centerX, centerY);
  }

  drawSprite(anim: Sprite | AnimatedSprite) {
    if (!this.#spriteSheet) return;

    let easing = 1;
    let translateX = anim.translateX?.end ?? 0;
    let translateY = anim.translateY?.end ?? 0;
    let opacity = anim.opacity?.end ?? 1;
    const anchorX = anim.x ?? this.#centerX;
    const anchorY = anim.y ?? this.#centerY;
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
        translateX = lerp(anim.translateX.start, anim.translateX.end, easing);
      }

      if (anim.translateY) {
        translateY = lerp(anim.translateY.start, anim.translateY.end, easing);
      }

      if (anim.opacity) {
        opacity = lerp(anim.opacity.start, anim.opacity.end, easing);
      }
    }

    let index = 0;

    if (anim.type === "animated-sprite") {
      index = anim.spriteIndex ?? 0;
    }

    const sprite = anim.sprites[index];

    const sourceX = sprite.x;
    const sourceY = sprite.y;

    const scale =
      (window.innerWidth * 0.2 * (anim.scale ?? 1)) / anim.spriteWidth;

    const destWidth = anim.spriteWidth * scale;
    const destHeight = anim.spriteHeight * scale;

    if (anim.float) {
      if (anim.float.x !== 0) {
        translateX += Math.sin(this.#time * anim.float.speed) * anim.float.x;
      }

      if (anim.float.y !== 0) {
        translateY += Math.sin(this.#time * anim.float.speed) * anim.float.y;
      }
    }

    let destX = translateX + anchorX - destWidth / 2;
    let destY = translateY + anchorY - destHeight / 2;

    this.#ctx.save();

    if (anim.angle) {
      this.#ctx.translate(0, 0);
      this.#ctx.rotate(anim.angle);
    }

    this.#ctx.globalAlpha = opacity;

    if (sprite.flipX) {
      this.#ctx.scale(-1, 1);
      destX = translateX - anchorX - destWidth / 2;
    } else if (sprite.flipY) {
      this.#ctx.scale(1, -1);
      destY = translateY - anchorY - destHeight / 2;
    }

    if (anim.shadow) {
      this.#ctx.shadowColor = rgba(anim.shadow.color, anim.shadow.opacity);
      this.#ctx.shadowBlur = anim.shadow.blur;
      this.#ctx.shadowOffsetX = anim.shadow.offsetX;
      this.#ctx.shadowOffsetY = anim.shadow.offsetY;
    }

    this.#ctx.drawImage(
      this.#spriteSheet,
      sourceX,
      sourceY,
      anim.spriteWidth,
      anim.spriteHeight,
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
    this.#baseFontSize = window.innerWidth / 800;
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
    this.clearLayer(LayerOrder.All);
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
        this.clearLayer(LayerOrder.All);
        this.createDealingCards();
        break;
      case State.PlayerHit:
      case State.PlayerBust:
      case State.PlayerStand:
      case State.PlayerBlackJack:
        this.createPlayerCards(playerTurn);
        this.createActionText(Role.Player);
        break;
      case State.RevealHoleCard:
        this.updateHoleCard();
        break;
      case State.DealerHit:
      case State.DealerStand:
      case State.DealerBust:
      case State.DealerBlackJack:
        this.createDealerCards();
        this.createActionText(Role.Dealer);
        break;
      default:
        break;
    }
  }

  private createCard(card: Card, delay = 0) {
    const isDealer = card.owner === "Dealer";
    const entity: Sprite = {
      ...cardSprite,
      id: card.id,
      progress: 0,
      x: this.#centerX - 80 + card.handIndex * (isDealer ? -64 : 82),
      y: isDealer
        ? 0 - card.handIndex * 5
        : window.innerHeight - window.innerHeight * 0.2 + card.handIndex * 5,
      sprites: [
        {
          x: card.isHidden
            ? 0
            : (card.suit % 12) * 1024 + cardSprite.spriteWidth * 2,
          y: card.isHidden ? 4992 : card.rank * cardSprite.spriteHeight,
        },
      ],
      delay,
      scale: isDealer ? 0.75 : 1,
      angle: ((Math.random() * 8 * 2 - 8) * Math.PI) / 180,
      opacity: { start: 1, end: card.isBusted ? 0.5 : 1 },
      translateY: {
        start: isDealer
          ? -cardSprite.spriteHeight * 0.75
          : cardSprite.spriteHeight,
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
    entity.kerning = { start: 40, end: 0 };

    if (role === Role.Player) {
      entity.position = "bottom";
      entity.translateY = { start: 50, end: 0 };
      entity.style.fontSize = 60;
      entity.style.color = Palette.Yellow;
    } else if (role === Role.Dealer) {
      entity.position = "top";
      entity.translateY = { start: -50, end: 0 };
      entity.style.fontSize = 48;
      entity.style.color = Palette.White;
    }

    if (this.#state === State.PlayerHit || this.#state === State.DealerHit) {
      entity.text = "Hit!";
    } else if (
      this.#state === State.PlayerStand ||
      this.#state === State.DealerStand
    ) {
      entity.text = "Stand!";
    } else if (
      this.#state === State.PlayerBust ||
      this.#state === State.DealerBust
    ) {
      entity.text = "Bust!";
    } else if (
      this.#state === State.PlayerBlackJack ||
      this.#state === State.DealerBlackJack
    ) {
      entity.text = "Blackjack!";
    } else if (this.#state === State.RevealHoleCard) {
      entity.text = Rank[this.#dealer.hand[1].rank];
    }

    this.setEntity(entity);
  }

  private updateActionText() {
    switch (this.#showActionText) {
      case "in": {
        const anim = this.getEntity(actionText);
        if (!anim) return;
        this.#showActionText = "out";
        anim.progress = 0;
        anim.opacity = { start: 1, end: 0 };
        if (anim.position === "bottom") {
          anim.translateY = { start: 0, end: 50 };
        } else if (anim.position === "top") {
          anim.translateY = { start: 0, end: -50 };
        }
        anim.kerning = { start: 0, end: 40 };
        this.setEntity(anim);
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
    let title = "";
    let subtitle = "";
    switch (this.#state) {
      case State.PlayerBust:
        title = "Player Bust!";
        subtitle = "Better luck next time!";
        break;
      case State.DealerBust:
        title = "Dealer Bust!";
        subtitle = "How unfortunate...";
        break;
      case State.Push:
        title = "Push!";
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

    for (const text of gameoverText) {
      if (text.id === "title") {
        text.text = title;
      } else if (text.id === "subtitle") {
        text.text = subtitle;
      }
      this.setEntity(text);
    }
  }
}
