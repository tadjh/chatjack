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

const Letter: Map<Face, string> = new Map([
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

const Icon: Map<Suit, string> = new Map([
  [Suit.Clubs, "♣"],
  [Suit.Diamonds, "♦"],
  [Suit.Hearts, "♥"],
  [Suit.Spades, "♠"],
]);

export class Card extends Number {
  readonly suit: Suit;
  readonly face: Face;
  readonly #abbr: string;
  #name: string;
  #points: number = 0;
  #isAce: boolean = false;
  #isHidden: boolean = false;
  get points() {
    return this.#points;
  }
  get isAce() {
    return this.#isAce;
  }

  get isHidden() {
    return this.#isHidden;
  }
  get name() {
    if (this.#isHidden) {
      return "Hidden";
    }
    return this.#name;
  }
  get abbr() {
    if (this.#isHidden) {
      return "🂠";
    }
    return this.#abbr;
  }

  constructor(card: number, hidden = false) {
    if (card < 0 || card > 52) {
      throw new Error("Invalid card");
    }
    super(card);
    this.suit = this.toSuit(card);
    this.face = card - this.suit;
    this.#isHidden = hidden;
    this.#isAce = this.face === Face.Ace;
    this.#name = `${Face[this.face]} of ${Suit[this.suit]}`;
    this.#abbr = `${Letter.get(this.face)} ${Icon.get(this.suit)}`;
    this.setPoints();
  }

  show() {
    this.#isHidden = false;
    return this;
  }

  hide() {
    this.#isHidden = true;
    return this;
  }

  setPoints() {
    switch (this.face) {
      case Face.Ace:
        this.#points = 11;
        break;
      case Face.Two:
        this.#points = 2;
        break;
      case Face.Three:
        this.#points = 3;
        break;
      case Face.Four:
        this.#points = 4;
        break;
      case Face.Five:
        this.#points = 5;
        break;
      case Face.Six:
        this.#points = 6;
        break;
      case Face.Seven:
        this.#points = 7;
        break;
      case Face.Eight:
        this.#points = 8;
        break;
      case Face.Nine:
        this.#points = 9;
        break;
      case Face.Ten:
        this.#points = 10;
        break;
      case Face.Jack:
        this.#points = 10;
        break;
      case Face.Queen:
        this.#points = 10;
        break;
      case Face.King:
        this.#points = 10;
        break;
      default:
        throw new Error("Invalid card");
    }

    return this;
  }

  updatePoints(lowAce: boolean) {
    if (this.#isAce) {
      if (lowAce) {
        this.#points = 1;
      } else {
        this.#points = 11;
      }
    }

    return this;
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

