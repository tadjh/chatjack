import { Card } from "./card";
import { Deck } from "./deck";

export type Status = "playing" | "busted" | "blackjack" | "stand" | "split";

export class Hand extends Deck {
  #score: number = 0;
  status: Status = "playing";
  #owner: string;

  constructor(owner: string) {
    super({ shoeSize: 0 });
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
    card.handIndex = this.length;
    card.owner = this.#owner;
    card.setId();
    super.push(card);
    return this.accumulate();
  }

  accumulate() {
    this.protect();
    let aces = 0;
    this.#score = this.reduce((score, card) => {
      if (card.isAce && card.points === 11) {
        aces++;
      }
      score += card.points;
      return score;
    }, 0);

    if (this.#score > 21 && aces > 0) {
      this.#score = this.reduce((total, card) => {
        if (total > 21 && card.points === 11) {
          card.setAce("low");
          total -= 10;
          aces--;
        }
        return total;
      }, this.#score);
    }

    return this.updateStatus();
  }

  updateStatus() {
    this.protect();
    if (this.#score === 21) {
      this.status = "blackjack";
    } else if (this.#score > 21) {
      this.status = "busted";
    }
    return this;
  }

  stand() {
    this.protect();

    this.status = "stand";
    return this;
  }

  split(): [Hand, Hand] {
    this.protect();

    if (this.length !== 2) {
      throw new Error("Hand must have exactly two cards to split");
    }

    const [first, second] = this;

    const hand1 = new Hand(this.#owner).add(first);
    const hand2 = new Hand(this.#owner).add(second);
    this.reset().status = "split";
    return [hand1, hand2];
  }

  reset() {
    console.log(`${this.#owner}'s hand is resetting`);
    super.empty();
    this.#score = 0;
    this.status = "playing";
    return this;
  }

  protect() {
    if (!this.isPlaying && !this.isBlackjack) {
      throw new Error("Hand is not allowed to perform this action");
    }
  }
}

