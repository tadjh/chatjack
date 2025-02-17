import { State } from "./constants";
import { Dealer } from "./dealer";
import { Deck } from "./deck";
import { Player } from "./player";

export class Blackjack {
  #table: [Dealer, ...Player[]] = [new Dealer()];
  #isDealt = false;
  #isDealerTurn = false;
  #playerTurn = -1;
  #deck: Deck = new Deck();
  #state = State.Init;

  constructor(deckCount = 1, playerCount = 1) {
    this.init(deckCount, playerCount);
  }

  get table() {
    return this.#table;
  }

  get dealer() {
    return this.#table[0];
  }

  get players() {
    const [, ...players] = this.#table;
    return players;
  }

  get isDealt() {
    return this.#isDealt;
  }

  get isDealerTurn() {
    return this.#isDealerTurn;
  }

  get playerTurn() {
    return this.#playerTurn;
  }

  get remaining() {
    return this.#deck.length;
  }

  get state() {
    return this.#state;
  }

  init(deckCount: number, playerCount: number) {
    this.#state = State.Init;
    this.#deck.init(deckCount);
    for (let i = 0; i < playerCount; i++) {
      this.#table.push(new Player(`Player ${i + 1}`));
    }
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
    if (this.#isDealt) {
      throw new Error("Cards have already been dealt");
    }

    if (this.#state !== State.Init) {
      throw new Error("Game has already started");
    }

    // Deal a card to each player
    this.players.forEach((player) => {
      player.hit(this.draw());
    });

    this.dealer.hit(this.draw());

    // Deal a second card to each player except the dealer
    this.players.forEach((player) => {
      player.hit(this.draw());
    });

    this.dealer.hit(this.draw(true));

    this.#isDealt = true;
    this.#state = State.ReadyToDeal;
    this.#playerTurn++;
    return this;
  }

  hit(player: Player, index = 0) {
    if (player.getScore(index) >= 21) {
      throw new Error("Player cannot hit");
    }
    player.hit(this.draw());
    this.#state = State.PlayerTurn;
    return this;
  }

  split(player: Player) {
    if (player.isSplit) {
      throw new Error("Player has already split");
    }

    const hand = player.hand;
    if (hand.length !== 2) {
      throw new Error("Player cannot split");
    }

    console.log(player.split());
    // player.hit(this.draw());
    // player.hit(this.draw(), 1);
    return this;
  }

  dealerTurn() {
    if (this.#state !== State.DealerTurn) {
      throw new Error("Dealer cannot play");
    }

    this.dealer.play(this.#deck);
    return this;
  }

  reset(deckCount = 1, playerCount = 1) {
    this.#table.forEach((player) => player.reset());
    this.#table = [this.dealer];
    this.#isDealerTurn = false;
    this.#playerTurn = -1;
    this.#isDealt = false;
    this.#deck.empty();
    this.init(deckCount, playerCount);
    return this;
  }
}

