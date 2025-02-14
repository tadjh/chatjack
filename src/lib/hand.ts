import { Card, Rank } from "./card";
import { Deck } from "./deck";

type Status =
  | "playing"
  | "busted"
  | "blackjack"
  | "stand"
  | "surrender"
  | "split"
  | "double"
  | "insurance"
  | "push"
  | "win"
  | "lose";

export class Hand extends Deck {
  #score: number = 0;
  #status: Status;
  #isPlaying: boolean;

  constructor() {
    super(0);
    this.#status = "playing";
    this.#isPlaying = true;
  }

  get score() {
    return this.#score;
  }

  get status() {
    return this.#status;
  }

  get isPlaying() {
    return this.#isPlaying;
  }

  add(card: Card) {
    this.protect();
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
      this.#status = "blackjack";
      this.#isPlaying = false;
    } else if (this.#score > 21) {
      this.#status = "busted";
      this.#isPlaying = false;
    }

    return this;
  }

  stand() {
    this.protect();

    this.#status = "stand";
    this.#isPlaying = false;

    return this;
  }

  split() {
    this.protect();

    if (this.length !== 2) {
      throw new Error("Hand must have exactly two cards to split");
    }

    const [first, second] = this;
    const hand1 = new Hand().add(first);
    const hand2 = new Hand().add(second);

    hand1.accumulate(first);
    hand2.accumulate(second);

    super.empty();
    this.#score = 0;
    this.#status = "split";
    this.#isPlaying = false;

    return [hand1, hand2];
  }

  reset() {
    super.empty();
    this.#score = 0;
    this.#status = "playing";
    this.#isPlaying = true;
    return this;
  }

  protect() {
    if (!this.isPlaying) {
      throw new Error("Player is not allowed to perform this action");
    }
  }
}

