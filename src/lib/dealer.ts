import { Card } from "./card";
import { Player, Role } from "./player";

export class Dealer extends Player {
  constructor() {
    super("Dealer", Role.Dealer);
  }

  dealerHit(deck: Card[]) {
    while (true) {
      const decision = this.decide(deck);

      if (decision === "stand") {
        if (this.hand.score === 21) {
          this.hand.status = "blackjack";
        } else {
          this.hand.status = "stand";
        }
        break;
      }

      const card = deck.shift();

      if (!card) {
        throw new Error("No more cards in the deck");
      }

      this.hit(card);
      console.log(`Dealer hits and draws: ${card.name}`);

      if (this.hand.status === "busted") {
        console.log("Dealer busts");
        break;
      }
    }

    return this;
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

  decide(deck: Card[], countCards = false) {
    if (countCards) {
      const busts = this.probability(deck);
      if (busts < 0.5 && this.score < 21) {
        return "hit";
      }
    } else if (this.score < 17) {
      return "hit";
    }

    return "stand";
  }

  split(): this {
    throw new Error("Dealer cannot split");
  }
}

