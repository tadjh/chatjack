import { Card, Face } from "./card";
import { Deck } from "./deck";

type Status = "playing" | "busted" | "blackjack" | "stand";

export class Hand extends Deck {
  #score: number = 0;
  #status: Status;
  #isPlaying: boolean;

  get score() {
    return this.#score;
  }
  get status() {
    return this.#status;
  }
  get isPlaying() {
    return this.#isPlaying;
  }

  constructor() {
    super(0);
    this.#status = "playing";
    this.#isPlaying = true;
  }

  add(card: Card) {
    this.protect();
    super.push(card);
    return this.accumulate(card);
  }

  accumulate(card: Card) {
    this.protect();

    if (card.face === Face.Ace) {
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

