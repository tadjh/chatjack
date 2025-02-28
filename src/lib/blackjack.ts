import { Palette } from "./constants";
import { Dealer } from "./dealer";
import { Debug } from "./debug";
import { Deck, FixedDeck } from "./deck";
import { Player, Role } from "./player";
import { State } from "./types";

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
  #state: State = State.Init;
  #table: Table;
  #shoe: Deck;

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
    this.state = State.Init;
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
    return this.#state > State.Init;
  }

  get isPlayerDone() {
    return this.player.isDone;
  }

  get isDealerTurn() {
    return this.state === State.RevealHoleCard;
  }

  get cardsRemaining() {
    return this.#shoe.length;
  }

  get state() {
    return this.#state;
  }

  private set state(state: State) {
    this.debug.log("State:", State[state]);
    this.#state = state;
  }

  get isGameover() {
    return this.#isGameover;
  }

  get isRevealed() {
    return this.#isRevealed;
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
    if (this.#state !== State.Init) {
      throw new Error("Game has already started");
    }
    this.state = State.Dealing;
    this.player.hit(this.draw());
    this.dealer.hit(this.draw());
    this.player.hit(this.draw());
    this.dealer.hit(this.draw(true));
    return this;
  }

  public hit(player: Player, index = 0) {
    player.hit(this.draw(), index);
    // TODO Support hitting a split hand
    if (player.hand.isBusted) {
      this.state =
        player.role === Role.Dealer ? State.DealerBust : State.PlayerBust;
    } else if (player.hand.isBlackjack) {
      this.state =
        player.role === Role.Dealer
          ? State.DealerBlackjack
          : State.PlayerBlackjack;
    } else {
      this.state =
        player.role === Role.Dealer ? State.DealerHit : State.PlayerHit;
    }
    return this;
  }

  public stand(player: Player, index = 0) {
    player.stand(index);
    this.state = State.PlayerStand;

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
    this.state = State.RevealHoleCard;
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
      this.state = State.DealerStand;
      return this;
    }

    this.hit(this.dealer);

    return this;
  }

  public judge() {
    // TODO Support player with a split hand
    if (this.player.hand.status === "busted") {
      this.state = State.PlayerBust;
    } else if (this.dealer.hand.status === "busted") {
      this.state = State.DealerBust;
    } else if (this.player.hand.score === this.dealer.hand.score) {
      this.state = State.Push;
    } else if (this.player.hand.status === "blackjack") {
      this.state = State.PlayerBlackjack;
    } else if (this.dealer.hand.status === "blackjack") {
      this.state = State.DealerBlackjack;
    } else if (this.player.hand.score > this.dealer.hand.score) {
      this.state = State.PlayerWin;
    } else if (this.dealer.hand.score > this.player.hand.score) {
      this.state = State.DealerWin;
    }

    this.debug.log("Judging:", State[this.#state]);

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
    this.state = State.Init;
    return this;
  }
}

