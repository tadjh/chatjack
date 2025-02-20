import { Card, Rank, Suit } from "./card";

export class Deck extends Array<Card> {
  constructor(count?: number) {
    super();
    if (!count) return;
    this.init(count);
  }

  init(count: number) {
    if (count < 0 || count > 8) {
      throw new Error("Invalid deck count");
    }

    for (let i = 0; i < count; i++) {
      const deck = Deck.create();
      this.push(...deck);
    }
    this.shuffle();
    return this;
  }

  // Fisher–Yates shuffle
  shuffle() {
    for (let i = this.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this[i], this[j]] = [this[j], this[i]]; // Swap elements
    }

    return this;
  }

  reshuffle(count: number) {
    if (this.length > 0) {
      throw new Error("Deck is not empty");
    }
    this.init(count);
    return this;
  }

  peek() {
    if (!this.length) {
      throw new Error("No cards left");
    }
    return this[this.length - 1];
  }

  draw(isHidden = false) {
    const card = this.pop();

    if (card === undefined) {
      throw new Error("Card drawn: none");
    }

    if (isHidden) {
      card.hide();
      console.log("Hole card drawn 🂠");
    } else {
      console.log("Card drawn:", card.name);
    }

    return card;
  }

  empty() {
    this.length = 0;
    return this;
  }

  print() {
    let output = "";
    for (const card of this) {
      output += "\t" + card.name + "\n";
    }

    console.log(output);
  }

  public static create() {
    const deck: Card[] = [];
    const suits = Object.values(Suit).filter((s) => typeof s === "number");
    const faces = Object.values(Rank).filter((f) => typeof f === "number");
    for (const suit of suits) {
      for (const face of faces) {
        deck.push(new Card(suit + face));
      }
    }
    return deck;
  }
}

