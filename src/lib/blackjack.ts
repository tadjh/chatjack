import { Dealer } from "./dealer";
import { Debug } from "./debug";
import { Deck } from "./deck";
import { Player, Role } from "./player";
import { State } from "./types";

export class Blackjack {
  #state = State.Init;
  #table: [Dealer, Player];
  #deck: Deck;
  isGameover = false;
  isRevealed = false;
  protected debug: Debug;

  constructor(
    {
      shoeSize = 1,
      fixedDeck = undefined,
    }: { shoeSize?: number; fixedDeck?: number[] } = {},
    table: [Dealer, Player] = [new Dealer(), new Player("Chat", 1)],
    deck = new Deck({ name: "Shoe" }),
    debug = new Debug("Blackjack")
  ) {
    this.#table = table;
    this.#deck = deck;
    this.debug = debug;

    if (fixedDeck) {
      this.fixDeck(fixedDeck);
    } else {
      this.init(shoeSize);
    }
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
    return this.#deck.length;
  }

  get state() {
    return this.#state;
  }

  private set state(state: State) {
    this.debug.log("State:", State[state]);
    this.#state = state;
  }

  init(shoeSize: number) {
    this.debug.log("Constructing a new shoe");
    this.state = State.Init;
    this.#deck.init(shoeSize);
    return this;
  }

  fixDeck(fixedDeck: number[]) {
    this.#deck.fix(fixedDeck);
    return this;
  }

  draw(isHidden = false) {
    return this.#deck.draw(isHidden);
  }

  public empty() {
    this.#deck.empty();
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

  hit(player: Player, index = 0) {
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

  stand(player: Player, index = 0) {
    player.stand(index);
    this.state = State.PlayerStand;

    // TODO Handle multiple players
    // this.#playerTurn++;
    return this;
  }

  split(player: Player) {
    player.split();
    return this;
  }

  reveal() {
    this.dealer.reveal();
    this.isRevealed = true;
    this.state = State.RevealHoleCard;
    return this;
  }

  decide() {
    if (this.dealer.isDone) {
      throw new Error("Dealer has already played");
    }

    if (!this.#deck.length) {
      this.debug.log("No more cards in the deck");
    }

    const decision = this.dealer.decide(this.#deck);

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

    this.isGameover = true;

    return this;
  }

  reset(shoeSize = 1) {
    this.debug.log("Resetting game");
    this.#table.forEach((player) => player.reset());
    this.#table = [new Dealer(), new Player("Chat", 1)];
    this.isGameover = false;
    this.isRevealed = false;
    this.#deck.empty();
    this.init(shoeSize);
    return this;
  }
}

