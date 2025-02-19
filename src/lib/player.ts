import { Card } from "./card";
import { Hand } from "./hand";

export class Player {
  #hasSplit = false;
  #hands: Hand[];
  isDone = false;

  constructor(
    public readonly name = "Player",
    public readonly seat = 1,
    public readonly role = Role.Player
  ) {
    this.#hands = [new Hand(this.name)];
  }

  get hand(): Hand {
    return this.#hands[0];
  }

  get hands(): readonly Hand[] {
    return this.#hands;
  }

  get score() {
    return this.#hands[0].score;
  }

  get scores() {
    return this.#hands.map((hand) => hand.score);
  }

  get status() {
    return this.#hands[0].status;
  }

  get statuses() {
    return this.#hands.map((hand) => hand.status);
  }

  get hasSplit() {
    return this.#hasSplit;
  }

  hit(card: Card, index = 0) {
    if (this.isDone) {
      throw new Error(`${this.name}'s turn is over`);
    }

    if (this.#hands.length <= index || index < 0) {
      throw new Error("Hand does not exist");
    }
    card.owner = this.name;
    this.#hands[index].add(card);
    return this;
  }

  stand(index = 0) {
    if (this.isDone) {
      throw new Error(`${this.name}'s turn is over`);
    }

    if (this.#hands.length <= index || index < 0) {
      throw new Error("Hand does not exist");
    }
    this.#hands[index].stand();

    if (
      this.#hands.every(
        (hand) => hand.isStand || hand.isBusted || hand.isBlackjack
      )
    ) {
      this.isDone = true;
    }
    return this;
  }

  split() {
    if (this.isDone) {
      throw new Error(`${this.name}'s turn is over`);
    }

    if (this.#hasSplit) {
      throw new Error("Player has already split");
    }

    this.#hands = this.#hands[0].split();
    this.#hasSplit = true;
    return this;
  }

  getScore(handIndex = 0) {
    if (handIndex >= this.#hands.length) {
      throw new Error("Hand does not exist");
    }
    return this.#hands[handIndex].score;
  }

  reset() {
    this.#hands.forEach((hand) => hand.reset());
    this.#hands = [new Hand(this.name)];
    this.#hasSplit = false;
    this.isDone = false;
    return this;
  }
}

export enum Role {
  Dealer,
  Player,
}

