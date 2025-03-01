import { Palette } from "@/lib/constants";
import { Debug } from "@/lib/debug";
import { eventBus, EventBus } from "@/lib/event-bus";
import { Dealer } from "@/lib/game/dealer";
import { Deck, FixedDeck } from "@/lib/game/deck";
import { Player, Role } from "@/lib/game/player";
import { COMMAND, EVENT, STATE } from "@/lib/types";

export type BlackjackOptions = {
  shoeSize?: number;
  fixedDeck?: FixedDeck | null;
  playerCount?: number;
  playerNames?: string[];
};

export type Table = [Dealer, ...Player[]];

export class Blackjack {
  public static defaults: Required<BlackjackOptions> = {
    shoeSize: 1,
    fixedDeck: null,
    playerCount: 1,
    playerNames: [],
  };
  private static instance: Blackjack | null = null;
  readonly shoeSize: number;
  readonly fixedDeck: FixedDeck | null;
  readonly playerCount: number;
  readonly playerNames: string[];
  protected debug: Debug;
  #isGameover = false;
  #isRevealed = false;
  #state: STATE = STATE.INIT;
  #table: Table;
  #shoe: Deck;
  #eventBus: EventBus;

  public static create(options?: BlackjackOptions): Blackjack {
    if (!Blackjack.instance) {
      Blackjack.instance = new Blackjack(options);
    }
    return Blackjack.instance;
  }

  private constructor(
    {
      shoeSize = Blackjack.defaults.shoeSize,
      fixedDeck = Blackjack.defaults.fixedDeck,
      playerCount = Blackjack.defaults.playerCount,
      playerNames = Blackjack.defaults.playerNames,
    }: BlackjackOptions = Blackjack.defaults,
    eventBusInstance = eventBus,
    debug = new Debug("Blackjack", Palette.Green)
  ) {
    this.debug = debug;
    this.debug.log("Creating Blackjack instance");
    this.shoeSize = shoeSize;
    this.fixedDeck = fixedDeck;
    this.playerCount = playerCount;
    this.playerNames = playerNames;
    this.#table = this.createTable({ playerCount, playerNames });
    this.#shoe = this.createShoe({ shoeSize, fixedDeck });
    this.state = STATE.INIT;
    this.#eventBus = eventBusInstance;
    this.setup();
  }

  get numberOfPlayers() {
    return this.#table.length;
  }

  get dealer() {
    return this.#table[0];
  }

  get player() {
    return this.#table[1];
  }

  get hasDealt() {
    return this.#state > STATE.INIT;
  }

  get isPlayerDone() {
    return this.player.isDone;
  }

  get isDealerTurn() {
    return this.state === STATE.REVEAL_HOLE_CARD;
  }

  get cardsRemaining() {
    return this.#shoe.length;
  }

  get state() {
    return this.#state;
  }

  private set state(state: STATE) {
    this.debug.log("State:", STATE[state]);
    this.#state = state;
  }

  get isGameover() {
    return this.#isGameover;
  }

  get isRevealed() {
    return this.#isRevealed;
  }

  setup() {
    this.#eventBus.subscribe("start", this.handleStart);
    this.#eventBus.subscribe("playerAction", this.handlePlayerTurn);
    this.#eventBus.subscribe("dealerTurn", this.handleDealerTurn);
    this.#eventBus.subscribe("judge", this.handleJudge);
  }

  destroy() {
    this.#eventBus.unsubscribe("start", this.handleStart);
    this.#eventBus.unsubscribe("playerAction", this.handlePlayerTurn);
    this.#eventBus.unsubscribe("dealerTurn", this.handleDealerTurn);
    this.#eventBus.unsubscribe("judge", this.handleJudge);
  }

  private createTable({
    playerCount,
    playerNames,
  }: {
    playerCount: number;
    playerNames: string[];
  }): Table {
    this.debug.log("Creating table");
    return [
      new Dealer(),
      ...Array.from(
        { length: playerCount },
        (_, i) => new Player(playerNames[i] || `Player ${i + 1}`, i + 1)
      ),
    ];
  }

  private createShoe({
    shoeSize,
    fixedDeck,
  }: {
    shoeSize: number;
    fixedDeck: FixedDeck | null;
  }): Deck {
    return new Deck({
      name: "Shoe",
      shoeSize,
      fixedDeck,
    });
  }

  draw(isHidden = false) {
    return this.#shoe.draw(isHidden);
  }

  public empty() {
    this.#shoe.empty();
    return this;
  }

  public deal() {
    if (this.#state !== STATE.INIT) {
      throw new Error("Game has already started");
    }
    this.state = STATE.DEALING;
    this.player.hit(this.draw());
    this.dealer.hit(this.draw());
    this.player.hit(this.draw());
    this.dealer.hit(this.draw(true));

    return this;
  }

  public hit(player: Player, index = 0, callback?: () => void) {
    player.hit(this.draw(), index);
    // TODO Support hitting a split hand
    if (player.hand.isBusted) {
      if (player.role === Role.Dealer) {
        this.state = STATE.DEALER_BUST;
      } else {
        this.state = STATE.PLAYER_BUST;
        if (callback) callback();
      }
    } else if (player.hand.isBlackjack) {
      if (player.role === Role.Dealer) {
        this.state = STATE.DEALER_BLACKJACK;
      } else {
        this.state = STATE.PLAYER_BLACKJACK;
        if (callback) callback();
      }
    } else {
      if (player.role === Role.Dealer) {
        this.state = STATE.DEALER_HIT;
      } else {
        this.state = STATE.PLAYER_HIT;
        if (callback) callback();
      }
    }
    return this;
  }

  public stand(player: Player, index = 0, callback?: () => void) {
    player.stand(index);
    this.state = STATE.PLAYER_STAND;
    if (callback) callback();
    // TODO Handle multiple players
    // this.#playerTurn++;
    return this;
  }

  public split(player: Player) {
    player.split();
    return this;
  }

  public reveal() {
    this.dealer.reveal();
    this.#isRevealed = true;
    this.state = STATE.REVEAL_HOLE_CARD;
    return this;
  }

  public decide() {
    if (this.dealer.isDone) {
      throw new Error("Dealer has already played");
    }

    if (!this.#shoe.length) {
      this.debug.log("No more cards in the deck");
    }

    const decision = this.dealer.decide(this.#shoe);

    if (decision === "stand") {
      this.dealer.stand();
      this.state = STATE.DEALER_STAND;
      return this;
    }

    this.hit(this.dealer);

    return this;
  }

  public judge() {
    // TODO Support player with a split hand
    if (this.player.hand.status === "busted") {
      this.state = STATE.PLAYER_BUST;
    } else if (this.dealer.hand.status === "busted") {
      this.state = STATE.DEALER_BUST;
    } else if (this.player.hand.score === this.dealer.hand.score) {
      this.state = STATE.PUSH;
    } else if (this.player.hand.status === "blackjack") {
      this.state = STATE.PLAYER_BLACKJACK;
    } else if (this.dealer.hand.status === "blackjack") {
      this.state = STATE.DEALER_BLACKJACK;
    } else if (this.player.hand.score > this.dealer.hand.score) {
      this.state = STATE.PLAYER_WIN;
    } else if (this.dealer.hand.score > this.player.hand.score) {
      this.state = STATE.DEALER_WIN;
    }

    this.debug.log("Judging:", STATE[this.#state]);

    this.#isGameover = true;

    return this;
  }

  public reset() {
    this.debug.log("Resetting game");
    this.#table.forEach((player) => player.reset());
    this.#shoe.empty();
    this.#isGameover = false;
    this.#isRevealed = false;

    this.#table = this.createTable({
      playerCount: this.playerCount,
      playerNames: this.playerNames,
    });
    this.#shoe = this.createShoe({
      shoeSize: this.shoeSize,
      fixedDeck: this.fixedDeck,
    });
    this.state = STATE.INIT;
    return this;
  }

  handleStart = () => {
    this.debug.log("Starting game");
    this.reset();
    this.deal();
    this.#eventBus.emit("gamestate", {
      type: EVENT.DEALING,
      data: {
        dealer: this.dealer,
        player: this.player,
      },
    });
  };

  handlePlayerTurn = (command: COMMAND) => {
    this.debug.log("Player turn", command);
    const callback = () =>
      this.#eventBus.emit("gamestate", {
        type: EVENT.PLAYER_TURN,
        data: {
          player: this.player,
          state: this.state,
        },
      });
    if (command === COMMAND.HIT) {
      this.hit(this.player, 0, callback);
    } else if (command === COMMAND.STAND) {
      this.stand(this.player, 0, callback);
    }
  };

  handleDealerTurn = () => {
    this.debug.log("Dealer turn");
    if (!this.#isRevealed) {
      this.reveal();
      this.#eventBus.emit("gamestate", {
        type: EVENT.REVEAL_HOLE_CARD,
        data: {
          dealer: this.dealer,
        },
      });
    } else {
      this.decide();
      this.#eventBus.emit("gamestate", {
        type: EVENT.DEALER_TURN,
        data: {
          dealer: this.dealer,
          state: this.state,
        },
      });
    }
  };

  handleJudge = () => {
    this.debug.log("Judge");
    this.judge();
    this.#eventBus.emit("gamestate", {
      type: EVENT.JUDGE,
      data: {
        state: this.state,
      },
    });
  };
}

