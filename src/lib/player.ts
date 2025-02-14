import { Card } from "./card";
import { Hand } from "./hand";

let id = 0;

export class Player {
  public readonly id = id++;
  #isSplit = false;
  #hands: Hand[];

  constructor(
    public readonly name = "Player",
    public readonly role = Role.Player
  ) {
    this.#hands = [new Hand()];
  }

  get hand(): Hand {
    return this.#hands[0];
  }

  get hands(): readonly Hand[] {
    if (!this.#isSplit) {
      return [this.hand];
    }
    return this.#hands;
  }

  get score() {
    return this.hand.score;
  }

  get scores() {
    if (!this.#isSplit) {
      return [this.hand.score];
    }
    return this.#hands.map((hand) => hand.score);
  }

  get status() {
    return this.hand.status;
  }

  get statuses() {
    if (!this.#isSplit) {
      return [this.hand.status];
    }
    return this.#hands.map((hand) => hand.status);
  }

  get isSplit() {
    return this.#isSplit;
  }

  hit(card: Card, id = 0) {
    if (!this.#isSplit) {
      this.#hands[0].add(card);
      return this;
    }
    this.#hands[id].add(card);
    return this;
  }

  split() {
    if (this.#isSplit) {
      throw new Error("Player has already split");
    }

    if (this.hand.length !== 2) {
      throw new Error("Hand must have exactly two cards to split");
    }

    const hands = this.hand.split();
    this.#isSplit = true;
    this.#hands = hands;
    return this;
  }

  getScore(handIndex = 0) {
    if (handIndex >= this.#hands.length) {
      throw new Error("Hand does not exist");
    }
    return this.#hands[handIndex].score;
  }

  reset() {
    this.#hands = [];
    this.#isSplit = false;
    return this;
  }
}

export enum Role {
  Player,
  Dealer,
}

