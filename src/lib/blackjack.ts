import { Deck } from "./deck";
import { Player, Roles } from "./player";

export class Blackjack {
  #table: Player[] = [];
  #isDealt = false;
  readonly deck: Deck;
  readonly dealerIndex: number;
  get dealer() {
    return this.#table[this.dealerIndex];
  }
  get table() {
    return this.#table;
  }
  get players() {
    return this.#table.filter((player) => player.isPlayer);
  }
  get isDealt() {
    return this.#isDealt;
  }

  constructor(deckCount = 1, playerCount = 1) {
    this.deck = new Deck(deckCount);
    const dealer = new Player({ name: "Dealer", role: Roles.Dealer });
    this.dealerIndex = dealer.id;
    this.#table.push(dealer);
    for (let i = 0; i < playerCount; i++) {
      this.#table.push(new Player({ name: `Player ${i + 1}` }));
    }
  }

  public draw(isHidden = false) {
    return this.deck.draw(isHidden);
  }

  public empty() {
    return this.deck.empty();
  }

  deal() {
    if (this.#isDealt) {
      throw new Error("Cards have already been dealt");
    }

    // Deal a card to each player
    this.#table.forEach((player) => {
      player.addCard(this.draw());
    });

    // Deal a second face down card to each player expect the dealer
    this.#table.forEach((player) => {
      if (player.isDealer) {
        return;
      }
      const card = this.draw(true);
      player.addCard(card);
    });

    this.#isDealt = true;
    return this;
  }

  hit(player: Player) {
    player.addCard(this.draw());
    return this;
  }
}

