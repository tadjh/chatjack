import { Card, Face, Suit } from "./card";

export class Deck {
  readonly cards: Card[] = [];
  readonly count: number;
  constructor(count = 1) {
    if (count < 1 || count > 8) {
      throw new Error("Invalid deck count");
    }

    for (let i = 0; i < count; i++) {
      this.cards.push(...createDeck());
    }

    this.count = count;
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]; // Swap elements
    }
  }

  draw(isHidden = false) {
    const card = this.cards.pop();
    if (card === undefined) {
      throw new Error("No card drawn");
    }

    if (isHidden) card.hide();
    console.log("Card drawn:", card.name());
    return card;
  }

  empty() {
    return this.cards.length === 0;
  }

  print() {
    let output = "";
    for (const card of this.cards) {
      output += "\t" + card.name() + "\n";
    }
    console.log("Deck:\n", output);
  }
}

function createDeck() {
  return [
    // Clubs
    new Card(Suit.Clubs + Face.Ace),
    new Card(Suit.Clubs + Face.Two),
    new Card(Suit.Clubs + Face.Three),
    new Card(Suit.Clubs + Face.Four),
    new Card(Suit.Clubs + Face.Five),
    new Card(Suit.Clubs + Face.Six),
    new Card(Suit.Clubs + Face.Seven),
    new Card(Suit.Clubs + Face.Eight),
    new Card(Suit.Clubs + Face.Nine),
    new Card(Suit.Clubs + Face.Ten),
    new Card(Suit.Clubs + Face.Jack),
    new Card(Suit.Clubs + Face.Queen),
    new Card(Suit.Clubs + Face.King),
    // Diamonds
    new Card(Suit.Diamonds + Face.Ace),
    new Card(Suit.Diamonds + Face.Two),
    new Card(Suit.Diamonds + Face.Three),
    new Card(Suit.Diamonds + Face.Four),
    new Card(Suit.Diamonds + Face.Five),
    new Card(Suit.Diamonds + Face.Six),
    new Card(Suit.Diamonds + Face.Seven),
    new Card(Suit.Diamonds + Face.Eight),
    new Card(Suit.Diamonds + Face.Nine),
    new Card(Suit.Diamonds + Face.Ten),
    new Card(Suit.Diamonds + Face.Jack),
    new Card(Suit.Diamonds + Face.Queen),
    new Card(Suit.Diamonds + Face.King),
    // Hearts
    new Card(Suit.Hearts + Face.Ace),
    new Card(Suit.Hearts + Face.Two),
    new Card(Suit.Hearts + Face.Three),
    new Card(Suit.Hearts + Face.Four),
    new Card(Suit.Hearts + Face.Five),
    new Card(Suit.Hearts + Face.Six),
    new Card(Suit.Hearts + Face.Seven),
    new Card(Suit.Hearts + Face.Eight),
    new Card(Suit.Hearts + Face.Nine),
    new Card(Suit.Hearts + Face.Ten),
    new Card(Suit.Hearts + Face.Jack),
    new Card(Suit.Hearts + Face.Queen),
    new Card(Suit.Hearts + Face.King),
    // Spades
    new Card(Suit.Spades + Face.Ace),
    new Card(Suit.Spades + Face.Two),
    new Card(Suit.Spades + Face.Three),
    new Card(Suit.Spades + Face.Four),
    new Card(Suit.Spades + Face.Five),
    new Card(Suit.Spades + Face.Six),
    new Card(Suit.Spades + Face.Seven),
    new Card(Suit.Spades + Face.Eight),
    new Card(Suit.Spades + Face.Nine),
    new Card(Suit.Spades + Face.Ten),
    new Card(Suit.Spades + Face.Jack),
    new Card(Suit.Spades + Face.Queen),
    new Card(Suit.Spades + Face.King),
  ];
}

