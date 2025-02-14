import { Dealer } from "./dealer";
import { Deck } from "./deck";
import { Player, Role } from "./player";

export class Blackjack {
  #table: [Dealer, ...Player[]] = [new Dealer()];
  #isDealt = false;
  #deck: Deck = new Deck();

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

  get remaining() {
    return this.#deck.length;
  }

  init(deckCount: number, playerCount: number) {
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

    // Deal a card to each player
    this.#table.forEach((player) => {
      player.hit(this.draw());
    });

    // Deal a second face down card to each player expect the dealer
    this.#table.forEach((player) => {
      if (player.role === Role.Dealer) return;
      player.hit(this.draw());
    });

    this.#isDealt = true;
    return this;
  }

  hit(player: Player, index = 0) {
    if (player.getScore(index) >= 21) {
      throw new Error("Player cannot hit");
    }
    player.hit(this.draw());
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

  play() {
    if (!this.#isDealt) {
      throw new Error("Cards have not been dealt");
    }

    this.dealer.play(this.#deck);
    return this;
  }

  destroy() {
    this.dealer.reset();
    this.#table = [this.dealer];
    this.#isDealt = false;
    this.#deck.empty();
    return this;
  }
}

