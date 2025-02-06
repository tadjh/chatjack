import { Card } from "./card";
import { Hand } from "./hand";

let id = 0;

export class Player {
  readonly id = id++;
  readonly name: string;
  readonly role: Roles;
  readonly isDealer: boolean;
  readonly isPlayer: boolean;
  #isPlaying = true;
  #isSplit = false;
  #hands: Hand[];
  get hand(): Hand {
    return this.#hands[0];
  }
  get hands(): readonly Hand[] {
    return this.#hands;
  }
  get isPlaying() {
    return this.#isPlaying;
  }
  get isSplit() {
    return this.#isSplit;
  }

  constructor({ name = "Player", role = Roles.Player } = {}) {
    this.isDealer = role === Roles.Dealer;
    this.isPlayer = !this.isDealer;
    this.name = this.isDealer ? "Dealer" : name;
    this.role = role;
    this.#hands = [new Hand()];
  }

  addCard(card: Card, id = 0) {
    this.protect();

    this.#hands[id].add(card);

    return this;
  }

  split() {
    this.protect();

    if (this.#isSplit || this.hands.length > 1) {
      throw new Error("Player has already split");
    }

    if (this.hand.length !== 2) {
      throw new Error("Hand must have exactly two cards to split");
    }

    const [card1, card2] = this.hand;
    const hand1 = new Hand().add(card1);
    const hand2 = new Hand().add(card2);
    this.#hands = [hand1, hand2];
    this.#isSplit = true;

    return this;
  }

  getScore(handIndex = 0) {
    if (handIndex >= this.#hands.length) {
      throw new Error("Hand does not exist");
    }
    return this.#hands[handIndex].score;
  }

  getScores() {
    return this.#hands.map((hand) => hand.score);
  }

  reset() {
    this.#hands = [];
    this.#isPlaying = true;
    this.#isSplit = false;
    return this;
  }

  protect() {
    if (!this.isPlaying) {
      throw new Error("Player is not allowed to perform this action");
    }
  }
}

export enum Roles {
  Player,
  Dealer,
}

