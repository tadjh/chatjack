export enum Suit {
  Clubs = 0,
  Diamonds = 13,
  Hearts = 26,
  Spades = 39,
}

export enum Face {
  Ace,
  Two,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
  Nine,
  Ten,
  Jack,
  Queen,
  King,
}

const FaceInitial: Map<Face, string> = new Map([
  [Face.Ace, "A"],
  [Face.Two, "2"],
  [Face.Three, "3"],
  [Face.Four, "4"],
  [Face.Five, "5"],
  [Face.Six, "6"],
  [Face.Seven, "7"],
  [Face.Eight, "8"],
  [Face.Nine, "9"],
  [Face.Ten, "10"],
  [Face.Jack, "J"],
  [Face.Queen, "Q"],
  [Face.King, "K"],
]);

const SuitInitial: Map<Suit, string> = new Map([
  [Suit.Clubs, "♣"],
  [Suit.Diamonds, "♦"],
  [Suit.Hearts, "♥"],
  [Suit.Spades, "♠"],
]);

export class Card extends Number {
  readonly suit: Suit;
  readonly face: Face;
  private hidden: boolean = false;
  constructor(card: number, hidden = false) {
    if (card < 0 || card > 52) {
      throw new Error("Invalid card");
    }
    super(card);
    this.suit = this.toSuit(card);
    this.face = card - this.suit;
    this.hidden = hidden;
  }

  name() {
    return `${Face[this.face]} of ${Suit[this.suit]}`;
  }

  abbr() {
    return `${FaceInitial.get(this.face)} ${SuitInitial.get(this.suit)}`;
  }

  show() {
    this.hidden = false;
  }

  hide() {
    this.hidden = true;
  }

  isHidden() {
    return this.hidden;
  }

  score(highAce = false) {
    switch (this.face) {
      case Face.Ace:
        if (highAce) {
          return 11;
        }
        return 1;
      case Face.Two:
        return 2;
      case Face.Three:
        return 3;
      case Face.Four:
        return 4;
      case Face.Five:
        return 5;
      case Face.Six:
        return 6;
      case Face.Seven:
        return 7;
      case Face.Eight:
        return 8;
      case Face.Nine:
        return 9;
      case Face.Ten:
        return 10;
      case Face.Jack:
        return 10;
      case Face.Queen:
        return 10;
      case Face.King:
        return 10;
      default:
        throw new Error("Invalid card");
    }
  }

  toFace(card: number) {
    if (card < 0 || card > 52) {
      throw new Error("Invalid card");
    }
    return (card % 13) as Face;
  }

  toSuit(card: number) {
    if (card < 0 || card > 52) {
      throw new Error("Invalid card");
    }
    return (Math.floor(card / 13) * 13) as Suit;
  }
}

