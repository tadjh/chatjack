import { Card } from "./card";
import { Player, Role } from "./player";

export class Dealer extends Player {
  constructor() {
    super("Dealer", 0, Role.Dealer);
  }

  get isBusted() {
    return this.hand.isBusted;
  }

  reveal() {
    this.hand[1].show();
  }

  probability(deck: Card[]) {
    let busts = 0;
    for (const card of deck) {
      if (this.score + card.points > 21) {
        busts++;
      }
    }

    return busts / deck.length;
  }

  decide(deck: Card[], countCards = false): "hit" | "stand" {
    if (countCards) {
      const busts = this.probability(deck);
      if (busts < 0.5 && this.score < 21) {
        return "hit";
      }
    } else if (this.score < 17) {
      return "hit";
    }

    this.hand.status = "stand";
    return "stand";
  }

  split(): this {
    throw new Error("Dealer cannot split");
  }
}

