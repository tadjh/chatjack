import { Card } from "@/lib/game/card";
import { Palette } from "@/lib/constants";
import { Debug } from "@/lib/debug";
import { Player, Role } from "@/lib/game/player";

export class Dealer extends Player {
  constructor(debug = new Debug("Dealer", Palette.Red)) {
    super("Dealer", 0, Role.Dealer, debug);
  }

  get isBusted() {
    return this.hand.isBusted;
  }

  get score() {
    if (this.hand.length === 0) {
      return 0;
    }

    return this.hand[1].isHidden ? this.hand[0].points : this.hand.score;
  }

  reveal() {
    this.debug.log("Revealing hole card");
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

    return "stand";
  }

  split(): this {
    throw new Error("Dealer cannot split");
  }
}

