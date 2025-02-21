import { Dealer } from "./dealer";
import { Deck } from "./deck";
import { Player } from "./player";
import { State } from "./types";

export class Blackjack {
  #state = State.Init;
  #table: [Dealer, Player] = [new Dealer(), new Player("Chat", 1)];
  #deck: Deck = new Deck();
  isGameover = false;
  isRevealed = false;

  constructor(deckCount = 1) {
    this.init(deckCount);
  }

  get table() {
    return this.#table;
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
    return this.#state === State.RevealHoleCard;
  }

  get remaining() {
    return this.#deck.length;
  }

  get state() {
    return this.#state;
  }

  set state(state: State) {
    this.#state = state;
  }

  init(deckCount: number) {
    this.#state = State.Init;
    this.#deck.init(deckCount);
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
    this.#state = State.Dealing;
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
      player.isDone = true;
      this.#state = State.PlayerBust;
    } else if (player.hand.isBlackjack) {
      player.isDone = true;
      this.#state = State.PlayerBlackJack;
    } else {
      this.#state = State.PlayerHit;
    }
    return this;
  }

  stand(player: Player, index = 0) {
    player.stand(index);
    this.#state = State.PlayerStand;

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
    this.#state = State.RevealHoleCard;
    return this;
  }

  decide() {
    if (this.dealer.isDone) {
      throw new Error("Dealer has already played");
    }

    if (!this.#deck.length) {
      console.log("No more cards in the deck");
    }

    const decision = this.dealer.decide(this.#deck);

    if (decision === "stand") {
      if (this.dealer.hand.isBlackjack) {
        this.#state = State.DealerBlackJack;
      } else {
        this.#state = State.DealerStand;
      }
      this.dealer.isDone = true;
      return this;
    }

    const card = this.#deck.shift()!;

    this.dealer.hit(card);

    if (this.dealer.isBusted) {
      this.#state = State.DealerBust;
      this.dealer.isDone = true;
      return this;
    }

    this.#state = State.DealerHit;
    return this.#state;
  }

  public judge() {
    console.log("Judging the game", this.dealer.hand, this.player.hand);

    // TODO Support multiple players
    // TODO Support player with a split hand
    if (this.player.hand.status === "busted") {
      this.#state = State.PlayerBust;
    } else if (this.dealer.hand.status === "busted") {
      this.#state = State.DealerBust;
    } else if (this.player.hand.score === this.dealer.hand.score) {
      this.#state = State.Push;
    } else if (this.player.hand.status === "blackjack") {
      this.#state = State.PlayerBlackJack;
    } else if (this.dealer.hand.status === "blackjack") {
      this.#state = State.DealerBlackJack;
    } else if (this.player.hand.score > this.dealer.hand.score) {
      this.#state = State.PlayerWin;
    } else if (this.dealer.hand.score > this.player.hand.score) {
      this.#state = State.DealerWin;
    }

    this.isGameover = true;

    return this;
  }

  reset(deckCount = 1) {
    this.#table.forEach((player) => player.reset());
    this.#table = [new Dealer(), new Player("Chat", 1)];
    this.isGameover = false;
    this.isRevealed = false;
    this.#deck.empty();
    this.init(deckCount);
    return this;
  }
}

