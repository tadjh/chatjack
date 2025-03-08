import { Card, CardJSON, CardJSONSchema, Rank, Suit } from "@/lib/game/card";
import { Debug } from "@/lib/debug";
import { z } from "zod";

export const DeckSchema = z.object({
  cards: z.array(CardJSONSchema),
  length: z.number(),
});

export type DeckJSON = z.infer<typeof DeckSchema>;

export type DeckOptions = {
  name?: string;
  shoeSize?: number;
  fixedDeck?: FixedDeck | null;
};

export class Deck {
  static readonly defaultOptions: Required<DeckOptions> = {
    name: "Deck",
    shoeSize: 0,
    fixedDeck: null,
  };
  #name: string;
  #cards: Card[] = [];
  protected debug: Debug;

  constructor(
    {
      name = Deck.defaultOptions.name,
      shoeSize = Deck.defaultOptions.shoeSize,
      fixedDeck = Deck.defaultOptions.fixedDeck,
    }: DeckOptions = Deck.defaultOptions,
    debug = new Debug(Deck.name, "Blue"),
  ) {
    this.debug = debug;
    this.debug.log(`Creating: ${name}`);
    this.#name = name;
    if (fixedDeck) {
      this.debug.log("Fixing deck with cards:", fixedDeck);
      this.#cards = Deck.fix(fixedDecks[fixedDeck]);
    } else {
      this.init(shoeSize);
    }
  }

  get cards() {
    return this.#cards;
  }

  get length() {
    return this.#cards.length;
  }

  init(shoeSize: number) {
    if (shoeSize < 0 || shoeSize > 8) {
      throw new Error("Invalid deck shoe size");
    }

    if (shoeSize === 0) return this;

    for (let i = 0; i < shoeSize; i++) {
      const deck = Deck.createCards();
      this.#cards.push(...deck);
    }
    this.shuffle();
    return this;
  }

  // Fisher–Yates shuffle
  shuffle() {
    this.debug.log("Shuffling cards");
    for (let i = this.#cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.#cards[i], this.#cards[j]] = [this.#cards[j], this.#cards[i]]; // Swap elements
    }

    return this;
  }

  reshuffle(count: number) {
    if (this.#cards.length > 0) {
      throw new Error("Deck is not empty");
    }
    this.debug.log("Reshuffling empty deck");
    this.init(count);
    return this;
  }

  static fix(cards: CardJSON[]) {
    const deck: Card[] = [];
    for (let i = cards.length - 1; i >= 0; i--) {
      deck.push(Card.fromJSON(cards[i]));
    }
    return deck;
  }

  peek() {
    if (!this.#cards.length) {
      throw new Error("No cards left");
    }
    this.debug.log(
      "Peeking at the top card:",
      this.#cards[this.#cards.length - 1].name,
    );
    return this.#cards[this.#cards.length - 1];
  }

  draw(isHidden = false) {
    const card = this.#cards.pop();

    if (card === undefined) {
      throw new Error("Card drawn: none");
    }

    if (isHidden) {
      card.hide();
      this.debug.log("🂠 Drawing Hole card");
    } else {
      this.debug.log(`${Card.toUnicode(card.value)} Drawing Card:`, card.name);
    }

    return card;
  }

  empty() {
    this.debug.log(`Emptying ${this.#name}`);
    this.#cards.length = 0;
    return this;
  }

  print() {
    let output = "";
    for (const card of this.#cards) {
      output += "\t" + card.name + "\n";
    }

    this.debug.log(output);
  }

  public static createCards() {
    const deck: Card[] = [];
    const suits = Object.values(Suit).filter((s) => typeof s === "number");
    const faces = Object.values(Rank).filter((f) => typeof f === "number");
    for (const suit of suits) {
      for (const face of faces) {
        deck.push(new Card({ card: face + suit }));
      }
    }
    return deck;
  }
}

export type FixedDeck = keyof typeof fixedDecks;

export const fixedDecks: Record<string, CardJSON[]> = {
  "player-bust": [
    {
      card: Rank.Ten + Suit.Spades,
      owner: "player",
      hidden: false,
      handIndex: 0,
    }, // player card 1
    {
      card: Rank.Ten + Suit.Hearts,
      owner: "dealer",
      hidden: false,
      handIndex: 0,
    }, // dealer card 1
    {
      card: Rank.Six + Suit.Diamonds,
      owner: "player",
      hidden: false,
      handIndex: 1,
    }, // player card 2, (should hit)
    {
      card: Rank.Seven + Suit.Clubs,
      owner: "dealer",
      hidden: true,
      handIndex: 1,
    }, // dealer hole card 2
    {
      card: Rank.Six + Suit.Hearts,
      owner: "player",
      hidden: false,
      handIndex: 2,
    }, // player bust card 3
  ],
  "dealer-bust": [
    {
      card: Rank.Ten + Suit.Spades,
      owner: "player",
      hidden: false,
      handIndex: 0,
    }, // player card 1
    {
      card: Rank.Ten + Suit.Hearts,
      owner: "dealer",
      hidden: false,
      handIndex: 0,
    }, // dealer card 1
    {
      card: Rank.King + Suit.Diamonds,
      owner: "player",
      hidden: false,
      handIndex: 1,
    }, // player card 2, (should stand)
    {
      card: Rank.Six + Suit.Clubs,
      owner: "dealer",
      hidden: true,
      handIndex: 1,
    }, // dealer hole card 2
    {
      card: Rank.Six + Suit.Hearts,
      owner: "dealer",
      hidden: false,
      handIndex: 2,
    }, // dealer bust card 3
  ],
  push: [
    {
      card: Rank.Ten + Suit.Spades,
      owner: "player",
      hidden: false,
      handIndex: 0,
    }, // player card 1
    {
      card: Rank.Ten + Suit.Hearts,
      owner: "dealer",
      hidden: false,
      handIndex: 0,
    }, // dealer card 1
    {
      card: Rank.King + Suit.Diamonds,
      owner: "player",
      hidden: false,
      handIndex: 1,
    }, // player card 2, (should stand)
    {
      card: Rank.King + Suit.Clubs,
      owner: "dealer",
      hidden: true,
      handIndex: 1,
    }, // dealer hole card 2
  ],
  "natural-blackjack": [
    {
      card: Rank.Ace + Suit.Spades,
      owner: "player",
      hidden: false,
      handIndex: 0,
    }, // player card 1
    {
      card: Rank.Ten + Suit.Hearts,
      owner: "dealer",
      hidden: false,
      handIndex: 0,
    }, // dealer card 1
    {
      card: Rank.King + Suit.Diamonds,
      owner: "player",
      hidden: false,
      handIndex: 1,
    }, // player card 2
    {
      card: Rank.Seven + Suit.Clubs,
      owner: "dealer",
      hidden: true,
      handIndex: 1,
    }, // dealer hole card 2
  ],
  "player-blackjack": [
    {
      card: Rank.Five + Suit.Spades,
      owner: "player",
      hidden: false,
      handIndex: 0,
    }, // player card 1
    {
      card: Rank.Ace + Suit.Hearts,
      owner: "dealer",
      hidden: false,
      handIndex: 0,
    }, // dealer card 1
    {
      card: Rank.Ace + Suit.Diamonds,
      owner: "player",
      hidden: false,
      handIndex: 1,
    }, // player card 2, (should stand)
    {
      card: Rank.Seven + Suit.Clubs,
      owner: "dealer",
      hidden: true,
      handIndex: 1,
    }, // dealer hole card 2
    {
      card: Rank.Five + Suit.Clubs,
      owner: "player",
      hidden: false,
      handIndex: 2,
    }, // player blackjack card 3
  ],
  "dealer-blackjack": [
    {
      card: Rank.Ten + Suit.Spades,
      owner: "player",
      hidden: false,
      handIndex: 0,
    }, // player card 1
    {
      card: Rank.King + Suit.Hearts,
      owner: "dealer",
      hidden: false,
      handIndex: 0,
    }, // dealer card 1
    {
      card: Rank.King + Suit.Diamonds,
      owner: "player",
      hidden: false,
      handIndex: 1,
    }, // player card 2, (should stand)
    {
      card: Rank.Ace + Suit.Clubs,
      owner: "dealer",
      hidden: true,
      handIndex: 1,
    }, // dealer hole card 2
  ],
  "player-win": [
    {
      card: Rank.Ten + Suit.Spades,
      owner: "player",
      hidden: false,
      handIndex: 0,
    }, // player card 1
    {
      card: Rank.Ten + Suit.Hearts,
      owner: "dealer",
      hidden: false,
      handIndex: 0,
    }, // dealer card 1
    {
      card: Rank.King + Suit.Diamonds,
      owner: "player",
      hidden: false,
      handIndex: 1,
    }, // player card 2, (should stand)
    {
      card: Rank.Seven + Suit.Clubs,
      owner: "dealer",
      hidden: true,
      handIndex: 1,
    }, // dealer hole card 2
  ],
  "dealer-win": [
    {
      card: Rank.Ten + Suit.Spades,
      owner: "player",
      hidden: false,
      handIndex: 0,
    }, // player card 1
    {
      card: Rank.Ten + Suit.Hearts,
      owner: "dealer",
      hidden: false,
      handIndex: 0,
    }, // dealer card 1
    {
      card: Rank.Nine + Suit.Diamonds,
      owner: "player",
      hidden: false,
      handIndex: 1,
    }, // player card 2, (should stand)
    {
      card: Rank.King + Suit.Clubs,
      owner: "dealer",
      hidden: true,
      handIndex: 1,
    }, // dealer hole card 2
  ],
} as const;
