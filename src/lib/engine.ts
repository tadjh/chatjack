import {
  actionText,
  cardSprite,
  gameoverText,
  titleScreen,
  scoreText,
  turnTimer,
} from "./entities";
import { Card } from "./card";
import { Palette, FPS, Fonts, images } from "./constants";
import { Dealer } from "./dealer";
import { Player, Role } from "./player";
import {
  Canvases,
  EntityTypes,
  LAYER,
  POSITION,
  SpriteEntityProps,
  TextEntityProps,
  EntityProps,
  State,
} from "./types";
import { Hand, Status } from "./hand";
import { Debug } from "./debug";
import { Counter } from "./counter";
import { TimerEntity } from "./entity.timer";
import { TextEntity } from "./entity.text";
import { rgb } from "./utils";
import { SpriteEntity } from "./entity.sprite";
import { DynamicLayer } from "./layer.dynamic";
import { StaticLayer } from "./layer.static";
import { LayerManager } from "./layer-manager";

enum ASSETS_LOADED {
  FONTS,
  IMAGES,
  LAYERS,
  TITLE_SCREEN,
}

export type EngineOptions = {
  fps?: number;
  tickRate?: number;
  animationSpeed?: number;
};

export class Engine {
  private static instance: Engine | null = null;
  public static readonly defaults: Required<EngineOptions> = {
    fps: FPS,
    tickRate: 1000 / FPS,
    animationSpeed: 1 / FPS,
  };
  readonly fps: number;
  readonly tickRate: number;
  readonly baseAnimSpeed: number;
  protected debug: Debug;
  #lastTick = 0;
  #hasDealt = false;
  #spritesheets: Map<string, HTMLImageElement> = new Map();
  #cache = new Map<string, ImageBitmap>();
  #counter: Counter | null = null;
  #layers: LayerManager;
  #isLoading = false;
  #isRunning = false;
  #isReady = false;
  #assetsLoaded = new Map<ASSETS_LOADED, boolean>();
  #holeCardId: string = "";

  public static create(options?: EngineOptions): Engine {
    if (!Engine.instance) {
      Engine.instance = new Engine(options);
    }
    return Engine.instance;
  }

  private constructor(
    {
      fps = Engine.defaults.fps,
      tickRate = Engine.defaults.tickRate,
      animationSpeed = Engine.defaults.animationSpeed,
    }: EngineOptions = Engine.defaults,
    layers = new LayerManager(),
    debug = new Debug("Engine", Palette.Orange)
  ) {
    this.debug = debug;
    this.debug.log("Creating Engine instance");
    this.fps = fps;
    this.tickRate = tickRate;
    this.baseAnimSpeed = animationSpeed;
    this.#layers = layers;
    this.init();
  }

  get isLoading() {
    return this.#isLoading;
  }

  get isReady() {
    return this.#isReady;
  }

  get isRunning() {
    return this.#isRunning;
  }

  get isLayersLoaded() {
    return this.#assetsLoaded.get(ASSETS_LOADED.LAYERS);
  }

  async init() {
    this.#isLoading = true;
    await this.loadAssets();
  }

  checkIsReady() {
    if (
      this.#assetsLoaded.get(ASSETS_LOADED.FONTS) &&
      this.#assetsLoaded.get(ASSETS_LOADED.IMAGES) &&
      this.#assetsLoaded.get(ASSETS_LOADED.LAYERS)
    ) {
      this.#isReady = true;
    } else {
      this.#isReady = false;
    }
  }

  private async loadFonts(): Promise<void> {
    this.debug.log("Loading fonts");
    for (const [font, url] of Fonts) {
      const fontFace = new FontFace(font, `url(${url})`);
      if (!document.fonts.has(fontFace)) {
        document.fonts.add(fontFace);
        await fontFace.load();
      }
    }
    this.#assetsLoaded.set(ASSETS_LOADED.FONTS, true);
    this.checkIsReady();
  }

  private async unloadFonts(): Promise<void> {
    this.debug.log("Unloading fonts");
    for (const [font, url] of Fonts) {
      const fontFace = new FontFace(font, `url(${url})`);
      if (document.fonts.has(fontFace)) {
        document.fonts.delete(fontFace);
      }
    }
    this.#assetsLoaded.set(ASSETS_LOADED.FONTS, false);
    this.checkIsReady();
  }

  private async loadImages(): Promise<void> {
    this.debug.log("Loading images");
    // TODO scale multiple sizes of the sprite sheet for player and dealer
    for (const [name, url] of images) {
      const image = new Image();
      image.src = url;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
      this.#spritesheets.set(name, image);
    }
    this.#assetsLoaded.set(ASSETS_LOADED.IMAGES, true);
    this.checkIsReady();
  }

  private async unloadImages(): Promise<void> {
    this.debug.log("Unloading images");
    for (const [name] of this.#spritesheets) {
      this.#spritesheets.delete(name);
    }
    this.#assetsLoaded.set(ASSETS_LOADED.IMAGES, false);
    this.checkIsReady();
  }

  public loadLayers(canvases: Canvases) {
    if (this.#assetsLoaded.get(ASSETS_LOADED.LAYERS)) {
      this.debug.log("Layers already loaded");
      return;
    }
    this.debug.log("Loading layers");
    this.#isLoading = true;
    const layers = Object.values(LAYER);
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const canvas = canvases[i];
      if (!canvas) {
        throw new Error(`Canvas not found for layer: ${layer}`);
      }
      if (layer === LAYER.GAME) {
        this.#layers.set(layer, new DynamicLayer(layer, canvas));
      } else {
        this.#layers.set(layer, new StaticLayer(layer, canvas));
      }
    }
    this.#assetsLoaded.set(ASSETS_LOADED.LAYERS, true);
    this.checkIsReady();
  }

  public unloadLayers() {
    this.debug.log("Unloading layers");
    this.#layers.clear();
    this.#assetsLoaded.set(ASSETS_LOADED.LAYERS, false);
    this.checkIsReady();
  }

  private loadTitleScreen() {
    if (!this.#assetsLoaded.get(ASSETS_LOADED.LAYERS)) {
      throw new Error("Layers not loaded");
    }
    this.debug.log("Loading title screen");
    titleScreen.forEach((entity) => this.createEntity(entity));
    this.#assetsLoaded.set(ASSETS_LOADED.TITLE_SCREEN, true);
    this.checkIsReady();
  }

  private unloadTitleScreen() {
    this.debug.log("Unloading title screen");
    titleScreen.forEach((entity) => {
      this.#layers.removeEntity(entity.layer, entity.id);
    });
    this.#assetsLoaded.set(ASSETS_LOADED.TITLE_SCREEN, false);
    this.checkIsReady();
  }

  private loadAssets() {
    return Promise.all([this.loadFonts(), this.loadImages()]);
  }

  private unloadAssets() {
    return Promise.all([this.unloadFonts(), this.unloadImages()]);
  }

  private createEntity(props: EntityProps) {
    let entity: EntityTypes;

    switch (props.type) {
      case "sprite":
        entity = new SpriteEntity(props);
        // Cache all sprite bitmaps at once using the engine's cache
        this.cacheEntityBitmaps(entity);
        break;
      case "text":
        entity = new TextEntity(props);
        break;
      case "timer":
        entity = new TimerEntity(props);
        break;
      default:
        throw new Error(`Unknown entity type`);
    }

    this.#layers.setEntity(entity);
  }

  public resize = () => {
    this.debug.log("Resizing");
    this.#layers.resize();
    this.render();
  };

  // The game loop updates animation progress and redraws the canvas.
  private update = (timestamp: number) => {
    if (timestamp - this.#lastTick >= this.tickRate) {
      this.#lastTick = timestamp;

      this.#layers.update();

      this.render();
    }
    requestAnimationFrame(this.update);
  };

  private render() {
    this.#layers.render();
  }

  public async start() {
    // If already running, just return instead of throwing
    if (this.#isRunning) {
      this.debug.log("Engine already running, ignoring start request");
      return;
    }

    this.debug.log("Starting engine");
    this.#isRunning = true;

    // Wait for assets to load
    while (!this.#isReady) {
      if (!this.#isRunning) {
        throw new Error("Engine stopped during startup");
      }
      this.debug.log("Waiting for assets to load");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.#lastTick = performance.now();
    this.loadTitleScreen();

    this.resize();
    window.addEventListener("resize", this.resize);
    requestAnimationFrame(this.update);
  }

  public stop() {
    this.debug.log("Stopping engine");
    this.#isRunning = false;
    window.removeEventListener("resize", this.resize);
  }

  private reset() {
    this.debug.log("Engine resetting");
    this.#layers.clear();
    this.loadTitleScreen();
    this.#hasDealt = false;
    if (this.#counter) {
      this.#counter.destroy();
      this.#counter = null;
    }
    this.resize();
  }

  public event({
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
        this.#layers.clear();
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
    this.createEntity({ ...turnTimer, onEnd });
  };

  private createScores(dealer: Dealer, player: Player) {
    // TODO Handle split hands
    this.createEntity({
      ...scoreText,
      id: "dealer-text",
      text: dealer.name,
      position: POSITION.TOP_LEFT,
      fontSize: 20,
    });

    this.createEntity({
      ...scoreText,
      id: "dealer-score",
      text: dealer.score.toString(),
      position: POSITION.TOP_LEFT,
    });

    this.createEntity({
      ...scoreText,
      id: `${player.name.toLowerCase()}-text`,
      text: player.name,
      position: POSITION.BOTTOM_LEFT,
      fontSize: 20,
    });

    this.createEntity({
      ...scoreText,
      id: `${player.name.toLowerCase()}-score`,
      text: player.score.toString(),
      position: POSITION.BOTTOM_LEFT,
    });
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
      const dealerScoreText = this.#layers.getEntityById<TextEntity>(
        scoreText.layer,
        "dealer-score"
      );
      if (dealerScoreText) {
        dealerScoreText.text = dealerScore.toString();
        dealerScoreText.color = rgb(this.getColorScore(dealerScore));
        this.debug.log(`Updating ${dealerScoreText.id}:`, dealerScoreText.text);
        this.#layers.setEntity(dealerScoreText);
      }
    } else {
      // TODO Handle split hands
      const playerScoreText = this.#layers.getEntityById<TextEntity>(
        scoreText.layer,
        `${player.name.toLowerCase()}-score`
      );
      if (playerScoreText) {
        playerScoreText.text = player.score.toString();
        playerScoreText.color = rgb(this.getColorScore(player.score));
        this.debug.log(`Updating ${playerScoreText.id}:`, playerScoreText.text);
        this.#layers.setEntity(playerScoreText);
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
    const spriteX = card.isHidden
      ? 0
      : status === "stand"
        ? (card.suit % 12) * 1024 + cardSprite.spriteWidth * 3
        : (card.suit % 12) * 1024 + cardSprite.spriteWidth * 2;

    const spriteY = card.isHidden ? 4992 : card.rank * cardSprite.spriteHeight;

    const props: SpriteEntityProps = {
      ...cardSprite,
      id: card.id,
      offsetX: (isDealer ? 128 : -128) + card.handIndex * (isDealer ? -48 : 64),
      offsetY: isDealer
        ? -50 + Math.random() * 64
        : 50 + -64 + Math.random() * -64,
      sprites: [
        {
          x: spriteX,
          y: spriteY,
        },
      ],
      position: isDealer ? POSITION.TOP : POSITION.BOTTOM,
      delay,
      scale: isDealer ? 0.55 : 0.75,
      angle: ((Math.random() * 12 * 2 - 12) * Math.PI) / 180,
      opacity: status === "busted" ? 0.5 : 1,
      phases: [
        {
          name: isDealer ? "slide-in-top" : "slide-in-bottom",
          duration: 1,
          magnitude: 300,
        },
      ],
      shadowOffsetX: isDealer ? 8 : 12,
      shadowOffsetY: isDealer ? 8 : 12,
      onEnd: () => {
        if (callback) callback();
      },
    };

    this.createEntity(props);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createCounter(count: number, callback: (...any: any[]) => void) {
    const counter = new Counter("create-hands", count, callback);
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
      () => {
        if (playerHand.status === "blackjack") {
          playerHand.forEach((card) => {
            const entity = this.#layers.getEntityById<SpriteEntity>(
              cardSprite.layer,
              card.id
            );
            if (!entity) {
              throw new Error("Entity not found");
            }

            const newX = (card.suit % 12) * 1024 + cardSprite.spriteWidth * 3;
            const newY = card.rank * cardSprite.spriteHeight;
            entity.addSprite({ x: newX, y: newY }, true);

            this.updateEntitySprites(entity);
          });

          this.createActionText(State.PlayerBlackjack, Role.Player);
        } else {
          this.createTimer((layer: LAYER, id: string) =>
            this.#layers.removeEntity(layer, id)
          );
        }
      }
    );

    this.#holeCardId = dealer.hand[1].id;
    for (let i = 0; i < dealer.hand.length; i++) {
      this.createCard(playerHand[i], count++ * delay, playerHand.status, () =>
        counter.tick()
      );
      this.createCard(dealerHand[i], count++ * delay, dealerHand.status, () =>
        counter.tick()
      );
    }
  }

  private createActionText(state: State, role: Role) {
    const props: TextEntityProps = {
      ...actionText,
    };

    if (role === Role.Player) {
      props.position = POSITION.BOTTOM;
      props.phases = [
        {
          name: "fade-slide-in-bottom",
          duration: 1.5,
        },
        {
          name: "fade-slide-out-bottom",
          duration: 1.5,
        },
      ];
      props.offsetY = -32;
    } else if (role === Role.Dealer) {
      props.position = POSITION.TOP;
      props.phases = [
        {
          name: "fade-slide-in-top",
          duration: 1.5,
        },
        {
          name: "fade-slide-out-top",
          duration: 1.5,
        },
      ];
      props.offsetY = 64;
    }

    switch (state) {
      case State.PlayerHit:
      case State.DealerHit:
        props.text = "Hit!";
        props.color = rgb(Palette.White);
        break;
      case State.PlayerStand:
      case State.DealerStand:
        props.text = "Stand!";
        props.color = rgb(Palette.LightestGrey);
        break;
      case State.PlayerBust:
      case State.DealerBust:
        props.text = "Bust!";
        props.color = rgb(Palette.Red);
        break;
      case State.PlayerBlackjack:
      case State.DealerBlackjack:
        props.text = "Blackjack!";
        props.color = rgb(Palette.Blue);
        break;
      default:
        throw new Error(`Cannot create action text for state: ${state}`);
    }

    this.createEntity(props);
  }

  private updateBustCard(card: Card) {
    const entity = this.#layers.getEntityById<SpriteEntity>(
      cardSprite.layer,
      card.id
    )!;
    entity.opacity = 0.5;
    this.debug.log(`Updating ${entity.id}: { opacity: ${entity.opacity} }`);
    this.#layers.setEntity(entity);
  }

  private updateStandCard(card: Card) {
    const entity = this.#layers.getEntityById<SpriteEntity>(
      cardSprite.layer,
      card.id
    )!;
    entity.sprites[entity.props.spriteIndex].x += entity.spriteWidth;
    this.debug.log(`Updating ${entity.id}`);
    this.updateEntitySprites(entity);
    this.#layers.setEntity(entity);
  }

  private updateHand(hand: Hand) {
    hand.forEach((card) => {
      if (this.#layers.hasEntityById(cardSprite.layer, card.id)) {
        if (hand.isBusted) this.updateBustCard(card);
        if (hand.isStand) this.updateStandCard(card);
      } else {
        this.createCard(card, 0, hand.status);
      }
    });
  }

  private updateHoleCard(dealer: Dealer) {
    const holeCard = dealer.hand[1];
    const entity = this.#layers.getEntityById<SpriteEntity>(
      cardSprite.layer,
      this.#holeCardId
    );
    if (!entity) {
      throw new Error("Cannot animate entity. Hole card not found");
    }
    const cardX = (holeCard.suit % 12) * 1024;
    const cardY = holeCard.rank * entity.spriteHeight;

    this.createEntity({
      ...entity,
      id: holeCard.id,
      phases: [
        {
          name: "flip-over",
          duration: 0.5,
        },
      ],
      sprites: [
        { x: 0, y: 4992 },
        { x: 256, y: 4992 },
        { x: 512, y: 4992 },
        { x: cardX, y: cardY },
        { x: cardX + 256, y: cardY },
        { x: cardX + 512, y: cardY },
      ],
    });

    this.#layers.removeEntity(entity.layer, entity.id);
    this.debug.log(`Updating ${entity.id}: { x: ${cardX + 512}, y: ${cardY} }`);
    return this;
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

    for (const props of gameoverText) {
      if (props.id === "title") {
        props.text = title;
      } else if (props.id === "subtitle") {
        props.text = subtitle;
      }

      this.createEntity(props);
    }
  }

  /**
   * Get a cached bitmap or create and cache a new one
   */
  private getCachedBitmap(
    entity: SpriteEntity,
    spriteIndex: number
  ): ImageBitmap {
    const sprite = entity.sprites[spriteIndex];
    const cacheKey = SpriteEntity.formatSpriteId(
      entity.src,
      sprite.x,
      sprite.y
    );

    if (this.#cache.has(cacheKey)) {
      // this.debug.log(`Cache hit for ${cacheKey}`);
      return this.#cache.get(cacheKey)!;
    }

    // this.debug.log(`Cache miss for ${cacheKey}, creating new bitmap`);
    const bitmap = entity.createImageBitmap(this.#spritesheets, spriteIndex);
    this.#cache.set(cacheKey, bitmap);
    return bitmap;
  }

  /**
   * Cache all bitmaps for a sprite entity
   */
  private cacheEntityBitmaps(entity: SpriteEntity): void {
    this.debug.log(
      `Caching ${entity.sprites.length} sprite(s) for ${entity.id}`
    );

    const bitmaps: ImageBitmap[] = [];

    // Get or create bitmaps for each sprite
    for (let i = 0; i < entity.sprites.length; i++) {
      const bitmap = this.getCachedBitmap(entity, i);
      bitmaps.push(bitmap);
    }

    // Set all bitmaps at once
    entity.setBitmaps(bitmaps);
  }

  // Add a method to update sprite bitmaps when sprites change
  public updateEntitySprites(entity: SpriteEntity): void {
    this.cacheEntityBitmaps(entity);
  }
}
