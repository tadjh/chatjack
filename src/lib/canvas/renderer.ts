import { Fonts, FPS, images } from "@/lib/canvas/constants";
import { Counter } from "@/lib/canvas/counter";
import {
  actionText,
  cardSprite,
  gameoverText,
  scoreText,
  titleScreen,
  turnTimer,
} from "@/lib/canvas/entities";
import { SpriteEntity, SpriteEntityProps } from "@/lib/canvas/entity.sprite";
import { TextEntity, TextEntityProps } from "@/lib/canvas/entity.text";
import { TimerEntity, TimerEntityProps } from "@/lib/canvas/entity.timer";
import { LayerManager } from "@/lib/canvas/layer-manager";
import { DynamicLayer } from "@/lib/canvas/layer.dynamic";
import { StaticLayer } from "@/lib/canvas/layer.static";
import { LAYER, POSITION } from "@/lib/canvas/types";
import { rgb } from "@/lib/canvas/utils";
import { Palette } from "@/lib/constants";
import { Debug } from "@/lib/debug";
import {
  AnimationEvent,
  ChatEvent,
  eventBus,
  EventBus,
  EventType,
} from "@/lib/event-bus";
import { Card, Rank } from "@/lib/game/card";
import { Dealer } from "@/lib/game/dealer";
import { Hand, Status } from "@/lib/game/hand";
import { Player, Role } from "@/lib/game/player";
import { EVENT, STATE } from "@/lib/types";

enum ASSETS_LOADED {
  FONTS,
  IMAGES,
  LAYERS,
  TITLE_SCREEN,
}

type RendererOptions = {
  fps?: number;
  timer?: number;
};

type Canvases = [
  HTMLCanvasElement | null,
  HTMLCanvasElement | null,
  HTMLCanvasElement | null,
];

export class Renderer {
  public static readonly name = "Renderer";
  public static readonly defaults: Required<RendererOptions> = {
    fps: FPS,
    timer: 30,
  };
  static #instance: Renderer | null = null;
  readonly fps: number;
  readonly tickRate: number;
  readonly animationSpeed: number;
  readonly timer: number;
  protected debug: Debug;
  #lastTick = 0;
  #spritesheets: Map<string, HTMLImageElement> = new Map();
  #cache = new Map<string, ImageBitmap>();
  #counter: Counter | null = null;
  #layers: LayerManager;
  #isLoading = false;
  #isRunning = false;
  #isReady = false;
  #assetsLoaded = new Map<ASSETS_LOADED, boolean>();
  #holeCardId: string = "";
  #eventBus: EventBus;

  public static create(options?: RendererOptions): Renderer {
    if (!Renderer.#instance) {
      Renderer.#instance = new Renderer(options);
    }
    return Renderer.#instance;
  }

  public static destroy() {
    if (Renderer.#instance) {
      Renderer.#instance.teardown();
    }
    Renderer.#instance = null;
  }

  private constructor(
    {
      fps = Renderer.defaults.fps,
      timer = Renderer.defaults.timer,
    }: RendererOptions = Renderer.defaults,
    eventBusInstance = eventBus,
    layers = new LayerManager(),
    debug = new Debug(Renderer.name, "Orange")
  ) {
    this.debug = debug;
    this.fps = fps;
    this.tickRate = 1000 / fps;
    this.animationSpeed = 1 / fps;
    this.#layers = layers;
    this.#eventBus = eventBusInstance;
    this.timer = timer;
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

  private init() {
    this.debug.log(`Creating: ${Renderer.name} instance`);
    this.setup();
    return this;
  }

  private async setup() {
    await this.loadAssets();
    this.#eventBus.subscribe("gamestate", this.handleGamestate, Renderer.name);
    this.#eventBus.subscribe("chat", this.handleChat, Renderer.name);
    return this;
  }

  private async teardown() {
    await this.unloadAssets();
    this.unloadTitleScreen();
    this.unloadLayers();
    this.#eventBus.unsubscribe("gamestate", this.handleGamestate);
    this.#eventBus.unsubscribe("chat", this.handleChat);
    return this;
  }

  private checkIsReady() {
    if (
      this.#assetsLoaded.get(ASSETS_LOADED.FONTS) &&
      this.#assetsLoaded.get(ASSETS_LOADED.IMAGES) &&
      this.#assetsLoaded.get(ASSETS_LOADED.LAYERS)
    ) {
      this.#isReady = true;
    } else {
      this.#isReady = false;
    }
    return this;
  }

  private async loadFonts() {
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
    this.#isLoading = true;
    return Promise.all([this.loadFonts(), this.loadImages()]);
  }

  private unloadAssets() {
    return Promise.all([this.unloadFonts(), this.unloadImages()]);
  }

  private createEntity(
    props: SpriteEntityProps | TextEntityProps | TimerEntityProps
  ) {
    let entity: SpriteEntity | TextEntity | TimerEntity;

    props.animationSpeed = props.animationSpeed ?? this.animationSpeed;

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

  private resize = () => {
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
    this.unloadTitleScreen();
    window.removeEventListener("resize", this.resize);
  }

  private reset() {
    this.debug.log("Resetting");
    this.#layers.clear();
    this.loadTitleScreen();
    if (this.#counter) {
      this.#counter.destroy();
      this.#counter = null;
    }
    this.resize();
  }

  private restart() {
    this.debug.log("Restarting");
    this.#layers.clear();
    if (this.#counter) {
      this.#counter.destroy();
      this.#counter = null;
    }
    this.resize();
  }

  private createTimer = () => {
    const timer = { ...turnTimer };

    timer.phases[1].duration = this.timer;

    this.createEntity({
      ...timer,
      onEnd: (layer: LAYER, id: string) => this.#layers.removeEntity(layer, id),
    });
  };

  private destroyTimer = () => {
    const timer = this.#layers.getEntityById<TimerEntity>(
      turnTimer.layer,
      turnTimer.id
    );
    if (timer) {
      timer.nextPhase();
      timer.onEnd = () => {
        timer.destroy();
        this.#layers.removeEntity(turnTimer.layer, turnTimer.id);
      };
    }
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
          duration: 0.75,
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

  private createCounter(count: number, callback: (...any: unknown[]) => void) {
    const counter = new Counter("create-hands", count, callback);
    this.#counter = counter;
    return counter;
  }

  private createHands(dealer: Dealer, player: Player, onComplete?: () => void) {
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

          this.createActionText(
            STATE.PLAYER_BLACKJACK,
            Role.Player,
            onComplete
          );
        } else {
          this.createTimer();
          if (onComplete) onComplete();
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
  private createActionText(state: STATE, role: Role, onEnd?: () => void): this;
  private createActionText(state: string, role: Role, onEnd?: () => void): this;
  private createActionText(
    state: STATE | string,
    role: Role,
    onEnd?: () => void
  ): this {
    const props: TextEntityProps = {
      ...actionText,
      onEnd,
    };

    if (role === Role.Player) {
      props.id = "player-action-text";
      props.position = POSITION.BOTTOM;
      props.phases = [
        {
          name: "fade-slide-in-bottom",
          duration: 1.0,
        },
        {
          name: "fade-slide-out-bottom",
          duration: 0.5,
        },
      ];
      props.offsetY = -32;
    } else if (role === Role.Dealer) {
      props.id = "dealer-action-text";
      props.position = POSITION.TOP;
      props.phases = [
        {
          name: "fade-slide-in-top",
          duration: 1.0,
        },
        {
          name: "fade-slide-out-top",
          duration: 0.5,
        },
      ];
      props.offsetY = 64;
    }

    if (typeof state === "string") {
      props.text = state;
    } else {
      switch (state) {
        case STATE.PLAYER_HIT:
        case STATE.DEALER_HIT:
          props.text = "Hit!";
          props.color = rgb(Palette.LightestGrey);
          break;
        case STATE.PLAYER_STAND:
        case STATE.DEALER_STAND:
          props.text = "Stand!";
          props.color = rgb(Palette.LightestGrey);
          break;
        case STATE.PLAYER_BUST:
        case STATE.DEALER_BUST:
          props.text = "Bust!";
          props.color = rgb(Palette.Red);
          break;
        case STATE.PLAYER_BLACKJACK:
        case STATE.DEALER_BLACKJACK:
          props.text = "Blackjack!";
          props.color = rgb(Palette.Blue);
          break;
        default:
          throw new Error(`Cannot create action text for state: ${state}`);
      }
    }

    this.createEntity(props);
    return this;
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
    const spriteIndex = entity.props.spriteIndex;
    const coords = entity.getSprite(spriteIndex);
    entity.setSprite(spriteIndex, {
      x: coords.x + entity.spriteWidth,
      y: coords.y,
    });
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

  private createGameoverText(state: STATE, callback?: () => void) {
    let title;
    let subtitle;
    switch (state) {
      case STATE.PLAYER_BUST:
        title = "Chat Bust!";
        subtitle = "Better luck next time!";
        break;
      case STATE.DEALER_BUST:
        title = "Dealer Bust!";
        subtitle = "How unfortunate...";
        break;
      case STATE.PUSH:
        title = "Push!";
        subtitle = "No winner...";
        break;
      case STATE.PLAYER_BLACKJACK:
        title = "Blackjack!";
        subtitle = "Chat Wins!";
        break;
      case STATE.DEALER_BLACKJACK:
        title = "Dealer hit 21!";
        subtitle = "Better luck next time!";
        break;
      case STATE.PLAYER_WIN:
        title = "Chat Wins!";
        subtitle = "Your hand is stronger!";
        break;
      case STATE.DEALER_WIN:
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
      } else if (props.id === "play-again") {
        props.onEnd = () => {
          if (callback) callback();
        };
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
    const sprite = entity.getSprite(spriteIndex);
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
      `Caching ${entity.getSpriteCount()} sprite(s) for ${entity.id}`
    );

    const bitmaps: ImageBitmap[] = [];

    // Get or create bitmaps for each sprite
    for (let i = 0; i < entity.getSpriteCount(); i++) {
      const bitmap = this.getCachedBitmap(entity, i);
      bitmaps.push(bitmap);
    }

    // Set all bitmaps at once
    entity.setBitmaps(bitmaps);
  }

  // Add a method to update sprite bitmaps when sprites change
  private updateEntitySprites(entity: SpriteEntity): void {
    this.cacheEntityBitmaps(entity);
  }

  private handleDealing = (event: EventType<EVENT.DEALING>) => {
    this.debug.log("Dealing");
    this.createScores(event.data.dealer, event.data.player);
    this.createHands(event.data.dealer, event.data.player, () => {
      this.#eventBus.emit("animationComplete", event);
    });
  };

  private handleVoteUpdate = (event: EventType<EVENT.VOTE_UPDATE>) => {
    this.debug.log(
      "Handling vote update",
      event.data.command,
      event.data.count
    );
    // TODO Show votes on screen
  };

  private handleVoteEnd = (event: EventType<EVENT.VOTE_END>) => {
    this.debug.log("Handling vote end", event.data.command);
    // TODO Hide votes on screen
  };

  private handlePlayerAction = (event: EventType<EVENT.PLAYER_ACTION>) => {
    this.destroyTimer();
    this.createActionText(event.data.state, event.data.player.role, () => {
      if (!event.data.player.isDone) {
        this.createTimer();
      }
      this.#eventBus.emit("animationComplete", event);
    });
    this.updateScores(event.data.player);
    this.updateHand(event.data.player.hand);
  };

  private handleRevealHoleCard = (event: EventType<EVENT.REVEAL_HOLE_CARD>) => {
    this.destroyTimer();
    this.updateScores(event.data.dealer);
    this.updateHoleCard(event.data.dealer);
    this.createActionText(
      Rank[event.data.dealer.hand[1].rank],
      event.data.dealer.role,
      () => {
        this.#eventBus.emit("animationComplete", event);
      }
    );
  };

  private handleDealerAction = (event: EventType<EVENT.DEALER_ACTION>) => {
    this.updateScores(event.data.dealer);
    this.updateHand(event.data.dealer.hand);
    this.createActionText(event.data.state, event.data.dealer.role, () => {
      this.#eventBus.emit("animationComplete", event);
    });
  };

  private handleJudge = (event: EventType<EVENT.JUDGE>) => {
    this.createGameoverText(event.data.state, () => {
      this.#eventBus.emit("animationComplete", event);
    });
  };

  private handleStop = (event: EventType<EVENT.STOP>) => {
    this.debug.log("Stopping");
    this.reset();
    this.#eventBus.emit("animationComplete", event);
  };

  public handleGamestate = (event: AnimationEvent) => {
    switch (event.type) {
      case EVENT.DEALING:
        this.restart();
        return this.handleDealing(event);
      case EVENT.PLAYER_ACTION:
        return this.handlePlayerAction(event);
      case EVENT.REVEAL_HOLE_CARD:
        return this.handleRevealHoleCard(event);
      case EVENT.DEALER_ACTION:
        return this.handleDealerAction(event);
      case EVENT.JUDGE:
        return this.handleJudge(event);
      case EVENT.STOP:
        return this.handleStop(event);
    }
  };

  public handleChat = (event: ChatEvent) => {
    this.debug.log("Handling chat", event);
    switch (event.type) {
      case EVENT.VOTE_UPDATE:
        return this.handleVoteUpdate(event);
      case EVENT.VOTE_END:
        return this.handleVoteEnd(event);
    }
  };
}
