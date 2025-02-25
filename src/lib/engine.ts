import {
  actionText,
  cardSprite,
  gameoverText,
  animatedCardSprite,
  titleScreen,
  scoreText,
  turnTimer,
} from "./entities";
import { Card } from "./card";
import { Fonts, Palette, Images, FPS } from "./constants";
import { Dealer } from "./dealer";
import { Layer } from "./layer";
import { Player, Role } from "./player";
import {
  AnimatedSpriteEntity,
  Canvases,
  EntityInterface,
  EntityType,
  LAYER,
  SpriteEntity,
  State,
  TextEntityOld,
} from "./types";
import { Hand, Status } from "./hand";
import { Debug } from "./debug";
import { Counter } from "./counter";
import { TimerEntity } from "./entity.timer";
import { TextEntity } from "./entity.text";
import { rgb } from "./utils";
import { LayoutManager } from "./layout-manager";

export class Engine {
  readonly fps: number;
  readonly tickRate: number;
  readonly baseAnimSpeed: number;
  #layers: Map<LAYER, Layer> = new Map();
  #lastTick = 0;
  #time = 0;
  #holeCardId = "";
  #hasDealt = false;
  #spritesheets: Map<string, HTMLImageElement> = new Map();
  #counter: Counter | null = null;
  #layoutManager: LayoutManager;
  #shouldUpdateLayout: boolean = false;

  constructor(
    fps = FPS,
    tickRate = 1000 / fps,
    animationSpeed = 1 / fps,
    layoutManager = new LayoutManager(),
    private debug = new Debug("Renderer", Palette.Orange)
  ) {
    this.fps = fps;
    this.tickRate = tickRate;
    this.baseAnimSpeed = animationSpeed;
    this.#layoutManager = layoutManager;
  }

  public async loadFont(family: string, url: string): Promise<void> {
    const fontFace = new FontFace(family, `url("${url}")`);

    if (!document.fonts.has(fontFace)) {
      document.fonts.add(fontFace);
      await fontFace.load();
    }
  }

  public async loadFonts(): Promise<void> {
    for (const [family, url] of Fonts) {
      this.debug.log("Loading font:", family);
      await this.loadFont(family, url);
    }
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(error);
    });
  }

  public async loadImages(): Promise<void> {
    // TODO scale multiple sizes of the sprite sheet for player and dealer
    for (const [name, url] of Images) {
      this.debug.log("Loading image:", name);
      const spritesheet = await this.loadImage(url);
      this.#spritesheets.set(name, spritesheet);
    }
  }

  public loadLayers(canvases: Canvases) {
    const layers = Object.values(LAYER);
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const canvas = canvases[i];

      if (!canvas) {
        throw new Error(`Canvas not found for layer: ${layer}`);
      }

      this.#layers.set(layer, new Layer(layer, canvas, this.#spritesheets));
    }
  }

  public loadTitleScreen() {
    titleScreen.forEach((entity) => {
      if (entity.type === "text") {
        this.setEntity(new TextEntity(entity));
      } else {
        this.setEntity(entity);
      }
    });
  }

  public loadAssets(canvases: Canvases): Promise<void[]> {
    return Promise.all([
      this.loadFonts(),
      this.loadImages(),
      this.loadLayers(canvases),
      this.loadTitleScreen(),
    ]);
  }

  private getLayer(layer: LAYER) {
    return this.#layers.get(layer)!;
  }

  // private clearLayer(layer: LAYER) {
  //   this.debug.log("Clearing layer:", layer);
  //   this.#layers.get(layer)?.clear();
  // }

  private clearAllLayers() {
    this.debug.log("Clearing all layers");
    this.#layers.forEach((layer) => layer.clear());
  }

  private getEntity<T extends EntityInterface>(entity: T) {
    return this.getLayer(entity.layer).get(entity.id) as T | undefined;
  }

  private getEntityById<T extends EntityInterface>(layer: LAYER, id: string) {
    return this.getLayer(layer).get(id) as T | undefined;
  }

  private hasEntityById(layer: LAYER, id: string) {
    return this.getLayer(layer).has(id);
  }

  private setEntity(entity: EntityInterface) {
    if (entity.type === "text") this.#shouldUpdateLayout = true;
    this.getLayer(entity.layer).set(entity.id, entity);
  }

  private clearEntity(layer: LAYER, id: string) {
    this.getLayer(layer).delete(id);
  }

  private getEntitiesByType(type: EntityType) {
    return [...this.#layers.values()].flatMap((layer) => layer.getByType(type));
  }

  private updateLayout() {
    this.#layoutManager.reset();
    const entities = this.getEntitiesByType("text") as TextEntity[];
    this.#layoutManager.update(entities);
  }

  private render() {
    if (this.#shouldUpdateLayout) {
      this.updateLayout();
      this.#shouldUpdateLayout = false;
      this.getLayer(LAYER.UI).render(this.#time);
    }

    this.getLayer(LAYER.GAME).render(this.#time);
  }

  public resize = () => {
    this.updateLayout();
    for (const layer of this.#layers.values()) {
      layer.resize(this.#time);
    }
  };

  // The game loop updates animation progress and redraws the canvas.
  private step = (timestamp: number) => {
    if (timestamp - this.#lastTick >= this.tickRate) {
      this.#lastTick = timestamp;
      this.#time += 1;

      const layer = this.getLayer(LAYER.GAME);

      for (const entity of layer.values()) {
        if (entity.delay && entity.delay > 0) {
          entity.delay -= 1;
          continue;
        }

        if (entity.type === "timer") {
          entity.update();
          continue;
        }

        if (entity.type === "text") {
          entity.update(this.#time);
          continue;
        }

        entity.progress = entity.progress ?? 0;
        if (entity.progress < 1) {
          entity.progress = Math.min(
            entity.progress + (entity.speed ?? this.baseAnimSpeed),
            1
          );
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

      this.render();
    }
    requestAnimationFrame(this.step);
  };

  public async start(canvases: Canvases) {
    await this.loadAssets(canvases);
    this.#lastTick = performance.now();
    this.debug.log("Canvas mounting");
    requestAnimationFrame(this.step);
    window.addEventListener("resize", this.resize);
  }

  public stop() {
    this.debug.log("Canvas unmounting");
    window.removeEventListener("resize", this.resize);
  }

  private reset() {
    this.debug.log("Canvas resetting");
    this.clearAllLayers();
    this.loadTitleScreen();
    this.#hasDealt = false;
    if (this.#counter) {
      this.#counter.destroy();
      this.#counter = null;
    }
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
    this.debug.log("Animating State:", State[state]);

    if (isGameover) {
      this.createGameoverText(state);
      return;
    }

    switch (state) {
      case State.Init:
        this.reset();
        break;
      case State.Dealing:
        if (this.#hasDealt) {
          this.reset();
        }
        this.#hasDealt = true;
        this.clearAllLayers();
        this.createScores(dealer, player);
        this.createHands(dealer, player);
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

  private createTimer = (onEnd: (layer: LAYER, id: string) => void) => {
    this.debug.log(`Creating timer: ${turnTimer.id}`);
    const entity = new TimerEntity({ ...turnTimer, onEnd });
    this.setEntity(entity);
  };

  private createScores(dealer: Dealer, player: Player) {
    // TODO Handle split hands

    const dealerText = new TextEntity({
      ...scoreText,
      id: "dealer-text",
      text: dealer.name,
      position: "top left",
      fontSize: 20,
    });

    this.setEntity(dealerText);

    const dealerScoreText = new TextEntity({
      ...scoreText,
      id: "dealer-score",
      text: dealer.score.toString(),
      position: "top left",
    });

    this.setEntity(dealerScoreText);

    const playerText = new TextEntity({
      ...scoreText,
      id: `${player.name.toLowerCase()}-text`,
      text: player.name,
      position: "bottom left",
      fontSize: 20,
    });

    this.setEntity(playerText);

    const playerScoreText = new TextEntity({
      ...scoreText,
      id: `${player.name.toLowerCase()}-score`,
      text: player.score.toString(),
      position: "bottom left",
    });

    this.setEntity(playerScoreText);
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
      const dealerScoreText = this.getEntityById<TextEntity>(
        scoreText.layer,
        "dealer-score"
      );
      if (dealerScoreText) {
        dealerScoreText.text = dealerScore.toString();
        dealerScoreText.color = rgb(this.getColorScore(dealerScore));
        this.debug.log(`Updating ${dealerScoreText.id}:`, dealerScoreText.text);
        this.setEntity(dealerScoreText);
      }
    } else {
      // TODO Handle split hands
      const playerScoreText = this.getEntityById<TextEntity>(
        scoreText.layer,
        `${player.name.toLowerCase()}-score`
      );
      if (playerScoreText) {
        playerScoreText.text = player.score.toString();
        playerScoreText.color = rgb(this.getColorScore(player.score));
        this.debug.log(`Updating ${playerScoreText.id}:`, playerScoreText.text);
        this.setEntity(playerScoreText);
      }
    }
  }

  private createCard(
    card: Card,
    delay = 0,
    status: Status,
    callback?: () => void
  ) {
    const isDealer = card.owner === "Dealer";
    const entity: SpriteEntity = {
      ...cardSprite,
      id: card.id,
      progress: 0,
      offsetX:
        (isDealer ? cardSprite.spriteWidth / 4 : -cardSprite.spriteWidth / 2) +
        card.handIndex * (isDealer ? -128 : 128),
      offsetY: isDealer
        ? -cardSprite.spriteHeight / 2 + Math.random() * 64
        : cardSprite.spriteHeight / 2 + -64 + Math.random() * -64,
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
      onEnd: () => {
        this.debug.log(`Finishing animation: ${card.id}`);
        if (callback) callback();
      },
    };

    this.debug.log(`Creating ${entity.id}`);
    this.setEntity(entity);
  }

  private createCounter(count: number, callback: (counter: Counter) => void) {
    const counter = new Counter("create-hands", count, () => callback(counter));
    this.#counter = counter;
    return counter;
  }

  private createHands(dealer: Dealer, player: Player) {
    const delay = 8;
    let count = 0;
    const dealerHand = dealer.hand;
    const playerHand = player.hand;

    const counter = this.createCounter(
      dealerHand.length + playerHand.length,
      () =>
        this.createTimer((layer: LAYER, id: string) =>
          this.clearEntity(layer, id)
        )
    );

    this.#holeCardId = dealer.hand[1].id;
    for (let i = 0; i < dealer.hand.length; i++) {
      this.createCard(playerHand[i], count++ * delay, "playing", () =>
        counter.tick()
      );
      this.createCard(dealerHand[i], count++ * delay, "playing", () =>
        counter.tick()
      );
    }

    if (playerHand.status === "blackjack") {
      playerHand.forEach((card, index) => {
        const entity = this.getEntityById<SpriteEntity>(
          cardSprite.layer,
          card.id
        )!;
        entity.onEnd = () => {
          entity.sprites[0] = {
            x: (card.suit % 12) * 1024 + cardSprite.spriteWidth * 3,
            y: card.rank * cardSprite.spriteHeight,
          };
          this.debug.log(
            `Updating ${entity.id}: { x: ${entity.sprites[0].x}, y: ${entity.sprites[0].y} }`
          );
          this.setEntity(entity);
          if (index === playerHand.length - 1) {
            this.createActionText(State.PlayerBlackjack, Role.Player);
          }
        };
      });
    }
  }

  private createActionText(state: State, role: Role) {
    const entity: TextEntityOld = {
      ...actionText,
    };
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

    entity.onEnd = () => this.updateActionText();
    this.debug.log(`Creating ${entity.id}:`, entity.text);
    this.setEntity(entity);
  }

  private updateActionText() {
    const entity = this.getEntity(actionText);
    if (!entity) return;
    entity.progress = 0;
    entity.opacity = { start: 1, end: 0 };
    if (entity.position === "bottom") {
      entity.translateY = { start: 0, end: 50 };
    } else if (entity.position === "top") {
      entity.translateY = { start: 0, end: -50 };
    }
    entity.onEnd = () => {
      this.clearEntity(actionText.layer, actionText.id);
    };
    // entity.kerning = { start: 0, end: 40 };
    this.debug.log(`Updating ${entity.id}:`, entity.text);
    this.setEntity(entity);
  }

  private updateBustCard(card: Card) {
    const entity = this.getEntityById<SpriteEntity>(cardSprite.layer, card.id)!;
    entity.opacity = {
      start: 1,
      end: 0.5,
    };
    this.debug.log(`Updating ${entity.id}: { opacity: ${entity.opacity.end} }`);
    this.setEntity(entity);
  }

  private updateStandCard(card: Card) {
    const entity = this.getEntityById<SpriteEntity | AnimatedSpriteEntity>(
      cardSprite.layer,
      card.id
    )!;
    if (entity.type === "sprite") {
      entity.sprites[0] = {
        x: entity.sprites[0].x + entity.spriteWidth,
        y: entity.sprites[0].y,
      };
      this.debug.log(
        `Updating ${entity.id}: { x: ${entity.sprites[0].x}, y: ${entity.sprites[0].y} }`
      );
      this.setEntity(entity);
    } else if (entity.type === "animated-sprite") {
      entity.sprites[entity.spriteIndex] = {
        x: entity.sprites[entity.spriteIndex].x + entity.spriteWidth,
        y: entity.sprites[entity.spriteIndex].y,
      };
      this.debug.log(
        `Updating ${entity.id}: { x: ${entity.sprites[entity.spriteIndex].x}, y: ${entity.sprites[entity.spriteIndex].y} }`
      );
      this.setEntity(entity);
    }
  }

  private updateHand(hand: Hand) {
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
    const entity = this.getEntityById<SpriteEntity>(
      cardSprite.layer,
      this.#holeCardId
    );
    if (!entity) {
      throw new Error("Cannot animate entity. Hole card not found");
    }
    const cardX = (holeCard.suit % 12) * 1024;
    const cardY = holeCard.rank * entity.spriteHeight;
    const newHoleCard: AnimatedSpriteEntity = {
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
    this.clearEntity(entity.layer, entity.id);
    this.debug.log(
      `Creating ${newHoleCard.id}: { x: ${cardX + 512}, y: ${cardY} }`
    );
    this.setEntity(newHoleCard);
  }

  private createGameoverText(state: State) {
    let title;
    let subtitle;
    switch (state) {
      case State.PlayerBust:
        title = "Chat Bust!";
        subtitle = "Better luck next time!";
        break;
      case State.DealerBust:
        title = "Dealer Bust!";
        subtitle = "How unfortunate...";
        break;
      case State.Push:
        title = "Push!";
        subtitle = "No winner...";
        break;
      case State.PlayerBlackjack:
        title = "Blackjack!";
        subtitle = "Chat Wins!";
        break;
      case State.DealerBlackjack:
        title = "Dealer hit 21!";
        subtitle = "Better luck next time!";
        break;
      case State.PlayerWin:
        title = "Chat Wins!";
        subtitle = "Your hand is stronger!";
        break;
      case State.DealerWin:
        title = "Dealer Wins!";
        subtitle = "Better luck next time!";
        break;
      default:
        throw new Error(`Cannot create gameover text for state: ${state}`);
    }

    for (const entity of gameoverText) {
      if (entity.id === "title") {
        entity.text = title;
      } else if (entity.id === "subtitle") {
        entity.text = subtitle;
      }
      entity.progress = 0;
      this.debug.log(`Creating ${entity.id}`, entity.text);
      this.setEntity(entity);
    }
  }
}
