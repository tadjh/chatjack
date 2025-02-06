import { Card } from "./card";
import { Deck } from "./deck";

export class Blackjack {
  deck: Deck;
  dealer: Card[] = [];
  players: Card[][] = [];
  constructor(deckCount = 1) {
    this.deck = new Deck(deckCount);
  }

  draw(isHidden = false) {
    return this.deck.draw(isHidden);
  }

  empty() {
    return this.deck.empty();
  }

  deal() {
    this.dealer.push(this.draw());
    this.players.push([this.draw(), this.draw()]);
  }
}

