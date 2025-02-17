import { Card, Rank } from "./card";
import { Deck } from "./deck";

type Status = "playing" | "busted" | "blackjack" | "stand" | "split";

export class Hand extends Deck {
  #score: number = 0;
  status: Status = "playing";
  #owner: string;

  constructor(owner: string) {
    super(0);
    this.#owner = owner;
  }

  get score() {
    return this.#score;
  }

  get isPlaying() {
    return this.status === "playing";
  }

  get isBusted() {
    return this.status === "busted";
  }

  get isStand() {
    return this.status === "stand";
  }

  get isBlackjack() {
    return this.status === "blackjack";
  }

  add(card: Card) {
    this.protect();
    card.index = this.length;
    super.push(card);
    return this.accumulate(card);
  }

  accumulate(card: Card) {
    this.protect();

    if (card.rank === Rank.Ace) {
      if (this.#score + 11 > 21) {
        card.updatePoints(true);
        this.#score += card.points;
      } else {
        this.#score += card.points;
      }
    } else {
      this.#score += card.points;
    }

    return this.updateStatus();
  }

  updateStatus() {
    this.protect();
    if (this.#score === 21) {
      this.status = "blackjack";
    } else if (this.#score > 21) {
      this.status = "busted";
      this.forEach((card) => {
        card.isBusted = true;
      });
    }
    return this;
  }

  stand() {
    this.protect();
    this.status = "stand";
    return this;
  }

  split() {
    this.protect();

    if (this.length !== 2) {
      throw new Error("Hand must have exactly two cards to split");
    }

    const [first, second] = this;
    const hand1 = new Hand(this.#owner).add(first);
    const hand2 = new Hand(this.#owner).add(second);

    hand1.accumulate(first);
    hand2.accumulate(second);

    super.empty();
    this.#score = 0;
    this.status = "split";

    return [hand1, hand2];
  }

  reset() {
    super.empty();
    this.#score = 0;
    this.status = "playing";
    return this;
  }

  protect() {
    if (!this.isPlaying) {
      throw new Error("Hand is not allowed to perform this action");
    }
  }
}

