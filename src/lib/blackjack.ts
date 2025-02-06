import { Dealer } from "./dealer";
import { Deck } from "./deck";
import { Player } from "./player";

export class Blackjack {
  deck: Deck;
  dealer: Dealer;
  players: Player[] = [];
  constructor(deckCount = 1, playerCount = 1) {
    this.deck = new Deck(deckCount);
    this.dealer = new Dealer();
    for (let i = 0; i < playerCount; i++) {
      this.players.push(new Player(`Player ${i + 1}`));
    }
  }

  draw(isHidden = false) {
    return this.deck.draw(isHidden);
  }

  empty() {
    return this.deck.empty();
  }

  deal(): [Dealer, Player[]] {
    this.dealer.addCard(this.draw());
    this.players.forEach((player) => player.addCard(this.draw(), this.draw()));
    return [this.dealer, this.players];
  }
}

