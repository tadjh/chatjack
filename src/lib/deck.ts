import { Card, Rank, Suit } from "./card";
import { Palette } from "./constants";
import { Debug } from "./debug";

export class Deck extends Array<Card> {
  #name: string;
  protected debug: Debug;

  constructor(
    {
      name = "Deck",
      shoeSize = 0,
      cards,
    }:
      | { name?: string; shoeSize?: number; cards?: never }
      | { name?: string; shoeSize?: never; cards: number[] } = {},
    debug = new Debug(name, Palette.Blue)
  ) {
    super();
    this.debug = debug;
    this.#name = name;
    if (cards) {
      this.fix(cards);
    } else {
      this.init(shoeSize);
    }
  }

  init(shoeSize: number) {
    if (shoeSize < 0 || shoeSize > 8) {
      throw new Error("Invalid deck shoe size");
    }

    if (shoeSize === 0) return this;

    for (let i = 0; i < shoeSize; i++) {
      this.debug.log("Adding a 52 card deck");
      const deck = Deck.create();
      this.push(...deck);
    }
    this.shuffle();
    return this;
  }

  // Fisher–Yates shuffle
  shuffle() {
    this.debug.log("Shuffling cards");
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
    this.debug.log("Reshuffling empty deck");
    this.init(count);
    return this;
  }

  fix(fixedDeck: number[]) {
    this.debug.log("Fixing deck with cards:", fixedDeck);
    for (let i = fixedDeck.length - 1; i >= 0; i--) {
      this.push(new Card(fixedDeck[i]));
    }
    return this;
  }

  peek() {
    if (!this.length) {
      throw new Error("No cards left");
    }
    this.debug.log("Peeking at the top card:", this[this.length - 1].name);
    return this[this.length - 1];
  }

  draw(isHidden = false) {
    const card = this.pop();

    if (card === undefined) {
      throw new Error("Card drawn: none");
    }

    if (isHidden) {
      card.hide();
      this.debug.log("🂠 Drawing Hole card");
    } else {
      this.debug.log(
        `${Card.toUnicode(card.valueOf())} Drawing Card:`,
        card.name
      );
    }

    return card;
  }

  empty() {
    this.debug.log(`Emptying ${this.#name}`);
    this.length = 0;
    return this;
  }

  print() {
    let output = "";
    for (const card of this) {
      output += "\t" + card.name + "\n";
    }

    this.debug.log(output);
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

export const fixedDecks: Record<string, number[]> = {
  "player-bust": [
    Rank.Ten + Suit.Spades, // player card 1
    Rank.Ten + Suit.Hearts, // dealer card 1
    Rank.Six + Suit.Diamonds, // player card 2, (should hit)
    Rank.Seven + Suit.Clubs, // dealer hole card 2
    Rank.Six + Suit.Hearts, // player bust card 3
  ],
  "dealer-bust": [
    Rank.Ten + Suit.Spades, // player card 1
    Rank.Ten + Suit.Hearts, // dealer card 1
    Rank.King + Suit.Diamonds, // player card 2, (should stand)
    Rank.Six + Suit.Clubs, // dealer hole card 2
    Rank.Six + Suit.Hearts, // dealer bust card 3
  ],
  push: [
    Rank.Ten + Suit.Spades, // player card 1
    Rank.Ten + Suit.Hearts, // dealer card 1
    Rank.King + Suit.Diamonds, // player card 2, (should stand)
    Rank.King + Suit.Clubs, // dealer hole card 2
  ],
  "natural-blackjack": [
    Rank.Ace + Suit.Spades, // player card 1
    Rank.Ten + Suit.Hearts, // dealer card 1
    Rank.King + Suit.Diamonds, // player card 2
    Rank.Seven + Suit.Clubs, // dealer hole card 2
  ],
  "player-blackjack": [
    Rank.Five + Suit.Spades, // player card 1
    Rank.Ace + Suit.Hearts, // dealer card 1
    Rank.Ace + Suit.Diamonds, // player card 2, (should stand)
    Rank.Seven + Suit.Clubs, // dealer hole card 2
    Rank.Five + Suit.Clubs, // player blackjack card 3
  ],
  "dealer-blackjack": [
    Rank.Ten + Suit.Spades, // player card 1
    Rank.King + Suit.Hearts, // dealer card 1
    Rank.King + Suit.Diamonds, // player card 2, (should stand)
    Rank.Ace + Suit.Clubs, // dealer hole card 2
  ],
  "player-win": [
    Rank.Ten + Suit.Spades, // player card 1
    Rank.Ten + Suit.Hearts, // dealer card 1
    Rank.King + Suit.Diamonds, // player card 2, (should stand)
    Rank.Seven + Suit.Clubs, // dealer hole card 2
  ],
  "dealer-win": [
    Rank.Ten + Suit.Spades, // player card 1
    Rank.Ten + Suit.Hearts, // dealer card 1
    Rank.Nine + Suit.Diamonds, // player card 2, (should stand)
    Rank.King + Suit.Clubs, // dealer hole card 2
  ],
};

