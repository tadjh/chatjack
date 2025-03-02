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

  public static destroy() {
    if (Blackjack.instance) {
      Blackjack.instance.teardown();
    }
    Blackjack.instance = null;
  }

  private constructor(
    {
      shoeSize = Blackjack.defaults.shoeSize,
      fixedDeck = Blackjack.defaults.fixedDeck,
      playerCount = Blackjack.defaults.playerCount,
      playerNames = Blackjack.defaults.playerNames,
    }: BlackjackOptions = Blackjack.defaults,
    eventBusInstance = eventBus,
    debug = new Debug("Blackjack", "Green")
  ) {
    this.debug = debug;
    this.debug.log("Creating Blackjack instance");
    this.shoeSize = shoeSize;
    this.fixedDeck = fixedDeck;
    this.playerCount = playerCount;
    this.playerNames = playerNames;
    this.#table = this.createTable({ playerCount, playerNames });
    this.#shoe = this.createShoe({ shoeSize, fixedDeck });
    this.#eventBus = eventBusInstance;
    this.state = STATE.INIT;
    this.setup();
  }

  get dealer() {
    return this.#table[0];
  }

  get player() {
    return this.#table[1];
  }

  get hasDealt() {
    return this.#state !== STATE.INIT;
  }

  get isPlayerDone() {
    return this.player.isDone;
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

  private setup() {
    this.#eventBus.subscribe("start", this.handleDeal);
    this.#eventBus.subscribe("playerAction", this.handlePlayerAction);
    this.#eventBus.subscribe("dealerAction", this.handleDealerAction);
    this.#eventBus.subscribe("judge", this.handleJudge);
  }

  private teardown() {
    this.#eventBus.unsubscribe("start", this.handleDeal);
    this.#eventBus.unsubscribe("playerAction", this.handlePlayerAction);
    this.#eventBus.unsubscribe("dealerAction", this.handleDealerAction);
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

  private draw(isHidden = false) {
    return this.#shoe.draw(isHidden);
  }

  private deal() {
    this.state = STATE.DEALING;
    this.player.hit(this.draw());
    this.dealer.hit(this.draw());
    this.player.hit(this.draw());
    this.dealer.hit(this.draw(true));
    return this;
  }

  private hit(player: Player, index = 0, callback?: () => void) {
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

  private stand(player: Player, index = 0, callback?: () => void) {
    player.stand(index);
    this.state = STATE.PLAYER_STAND;
    if (callback) callback();
    // TODO Handle multiple players
    // this.#playerTurn++;
    return this;
  }

  // private split(player: Player) {
  //   player.split();
  //   return this;
  // }

  private reveal() {
    this.dealer.reveal();
    this.#isRevealed = true;
    this.state = STATE.REVEAL_HOLE_CARD;
    return this;
  }

  private decide() {
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

  private judge() {
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

  public handleDeal = () => {
    this.debug.log("Starting game");
    if (this.#state !== STATE.INIT) {
      this.reset();
    }
    this.deal();
    this.#eventBus.emit("gamestate", {
      type: EVENT.DEALING,
      data: {
        dealer: this.dealer,
        player: this.player,
      },
    });
  };

  public handlePlayerAction = (command: COMMAND) => {
    this.debug.log("Player turn", command);
    const callback = () =>
      this.#eventBus.emit("gamestate", {
        type: EVENT.PLAYER_ACTION,
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

  public handleDealerAction = () => {
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
        type: EVENT.DEALER_ACTION,
        data: {
          dealer: this.dealer,
          state: this.state,
        },
      });
    }
  };

  public handleJudge = () => {
    this.judge();
    this.#eventBus.emit("gamestate", {
      type: EVENT.JUDGE,
      data: {
        state: this.state,
      },
    });
  };
}

