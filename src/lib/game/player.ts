import { Card } from "@/lib/game/card";
import { Debug } from "@/lib/debug";
import { Hand } from "@/lib/game/hand";

export class Player {
  readonly name: string;
  readonly seat: number;
  readonly role: Role;
  #isDone = false;
  #hasSplit = false;
  #hands: Hand[];
  protected debug: Debug;

  constructor(
    name = "Player",
    seat = 1,
    role = Role.Player,
    debug = new Debug(name, "Red")
  ) {
    this.name = name;
    this.seat = seat;
    this.role = role;
    this.debug = debug;
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

  get isDone() {
    return this.#isDone;
  }

  hit(card: Card, index = 0) {
    if (this.#isDone) {
      throw new Error(`${this.name}'s turn is over`);
    }

    if (this.#hands.length <= index || index < 0) {
      throw new Error("Hand does not exist");
    }
    this.#hands[index].add(card);

    // TODO Support split hands
    if (
      this.#hands.every(
        (hand) => hand.isStand || hand.isBusted || hand.isBlackjack
      )
    ) {
      this.#isDone = true;
    }

    return this;
  }

  stand(index = 0) {
    if (this.#isDone) {
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
      this.#isDone = true;
    }
    return this;
  }

  split() {
    if (this.#isDone) {
      throw new Error(`${this.name}'s turn is over`);
    }

    if (this.#hasSplit) {
      throw new Error("Player has already split");
    }

    this.#hands = this.#hands[0].split();
    this.#hasSplit = true;
    return this;
  }

  reset() {
    this.debug.log(`${this.name} is resetting`);
    this.#hands.forEach((hand) => hand.reset());
    this.#hands = [new Hand(this.name)];
    this.#hasSplit = false;
    this.#isDone = false;
    return this;
  }
}

export enum Role {
  Dealer,
  Player,
}

