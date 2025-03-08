import { Debug } from "@/lib/debug";
import { EventType, ChatEvent, EventBus, MediatorEvent } from "@/lib/event-bus";
import { Dealer } from "@/lib/game/dealer";
import { Deck, FixedDeck } from "@/lib/game/deck";
import { Player, Role } from "@/lib/game/player";
import { COMMAND, EVENT, STATE } from "@/lib/types";

export type BlackjackOptions = {
  shoeSize?: number;
  deck?: FixedDeck | null;
  playerCount?: number;
  playerNames?: string[];
};

export type Table = [Dealer, ...Player[]];

export class Blackjack {
  public static defaults: Required<BlackjackOptions> = {
    shoeSize: 1,
    deck: null,
    playerCount: 1,
    playerNames: [],
  };
  static #instance: Blackjack | null = null;
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
  #callback: ((data: { dealer: Dealer; player: Player }) => void) | null = null;

  public static create(
    options?: BlackjackOptions,
    eventBus?: EventBus,
  ): Blackjack {
    if (!Blackjack.#instance) {
      Blackjack.#instance = new Blackjack(options, eventBus);
    }
    return Blackjack.#instance;
  }

  public static destroy() {
    if (Blackjack.#instance) {
      Blackjack.#instance.teardown();
    }
    Blackjack.#instance = null;
  }

  private constructor(
    {
      shoeSize = Blackjack.defaults.shoeSize,
      deck = Blackjack.defaults.deck,
      playerCount = Blackjack.defaults.playerCount,
      playerNames = Blackjack.defaults.playerNames,
    }: BlackjackOptions = Blackjack.defaults,
    eventBusInstance: EventBus = EventBus.create(),
    debug = new Debug(Blackjack.name, "Green"),
  ) {
    this.debug = debug;
    this.debug.log(`Creating: ${Blackjack.name} instance`);
    this.shoeSize = shoeSize;
    this.fixedDeck = deck;
    this.playerCount = playerCount;
    this.playerNames = playerNames.length ? playerNames : [];
    this.#eventBus = eventBusInstance;
    this.#state = STATE.INIT;
    this.#table = this.createTable({ playerCount, playerNames });
    this.#shoe = this.createShoe({ shoeSize, fixedDeck: this.fixedDeck });
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

  public get eventBus() {
    return this.#eventBus;
  }

  public setup = (
    callback?: (data: { dealer: Dealer; player: Player }) => void,
  ) => {
    this.debug.log(`Setup: ${Blackjack.name} subscriptions`);
    this.#eventBus.subscribe("mediator", this.handleMediator, Blackjack.name);
    this.#eventBus.subscribe("chat", this.handleChat, Blackjack.name);
    if (callback) {
      this.#callback = callback;
    }
    return this;
  };

  public teardown() {
    this.debug.log(`Teardown: ${Blackjack.name} subscriptions`);
    this.#eventBus.unsubscribe("mediator", this.handleMediator);
    this.#eventBus.unsubscribe("chat", this.handleChat);
    return this;
  }

  private createTable({
    playerCount,
    playerNames,
  }: {
    playerCount: number;
    playerNames: string[];
  }): Table {
    return [
      new Dealer(),
      ...Array.from(
        { length: playerCount },
        (_, i) =>
          new Player({
            name: playerNames[i] || `Player ${i + 1}`,
            seat: i + 1,
          }),
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

  private stand(player: Player, index = 0) {
    player.stand(index);
    this.state = STATE.PLAYER_STAND;
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

    const decision = this.dealer.decide(this.#shoe.cards);

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

  public handleStart = () => {
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

  public handleHit = () => {
    this.hit(this.player, 0);
    this.#eventBus.emit("gamestate", {
      type: EVENT.PLAYER_ACTION,
      data: {
        player: this.player,
        state: this.state,
      },
    });
  };

  public handleStand = () => {
    this.stand(this.player, 0);
    this.#eventBus.emit("gamestate", {
      type: EVENT.PLAYER_ACTION,
      data: {
        player: this.player,
        state: this.state,
      },
    });
  };

  private handleChat = (event: ChatEvent) => {
    switch (event.type) {
      case EVENT.VOTE_END:
        return this.handlePlayerAction(event);
    }
  };

  private handleMediator = (event: MediatorEvent) => {
    switch (event.type) {
      case EVENT.DEALER_DECIDE:
        this.handleDealerAction();
        break;
      case EVENT.JUDGE:
        this.handleJudge();
        break;
    }

    if (this.#callback) {
      this.#callback({
        dealer: this.dealer,
        player: this.player,
      });
    }
  };

  public handlePlayerAction = (event: EventType<EVENT.VOTE_END>) => {
    this.debug.log("Player action:", event.data.command);
    switch (event.data.command) {
      case COMMAND.START:
        this.handleStart();
        break;
      case COMMAND.STOP:
        this.handleStop();
        break;
      case COMMAND.RESTART:
        this.handleStart();
        break;
      case COMMAND.HIT:
        this.handleHit();
        break;
      case COMMAND.STAND:
        this.handleStand();
        break;
    }

    if (this.#callback) {
      this.#callback({
        dealer: this.dealer,
        player: this.player,
      });
    }
  };

  public handleDealerAction = () => {
    if (!this.#isRevealed) {
      this.debug.log("Dealer action: reveal");
      this.reveal();
      this.#eventBus.emit("gamestate", {
        type: EVENT.REVEAL_HOLE_CARD,
        data: {
          dealer: this.dealer,
        },
      });
    } else {
      this.decide();
      this.debug.log("Dealer action:", STATE[this.state]);
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

  public handleStop = () => {
    this.debug.log("Stopping game");
    this.reset();
    this.#eventBus.emit("gamestate", {
      type: EVENT.STOP,
      data: {
        state: this.state,
      },
    });
  };
}
