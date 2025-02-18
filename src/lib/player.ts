import { Card } from "./card";
import { Hand } from "./hand";

let id = 0;

export class Player {
  public readonly id = id++;
  #hasSplit = false;
  #hands: Hand[];

  constructor(
    public readonly name = "Player",
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
    if (this.#hands.length <= index || index < 0) {
      throw new Error("Hand does not exist");
    }
    card.owner = this.name;
    this.#hands[index].add(card);
    return this;
  }

  stand(index = 0) {
    if (this.#hands.length <= index || index < 0) {
      throw new Error("Hand does not exist");
    }
    this.#hands[index].stand();
    return this;
  }

  split() {
    if (this.#hasSplit) {
      throw new Error("Player has already split");
    }

    if (this.#hands[0].length !== 2) {
      throw new Error("Hand must have exactly two cards to split");
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
    return this;
  }
}

export enum Role {
  Player,
  Dealer,
}

