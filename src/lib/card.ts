export enum Suit {
  Clubs = 0,
  Diamonds = 13,
  Hearts = 26,
  Spades = 39,
}

export enum Rank {
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

const Icon: Map<number, string> = new Map([
  [Suit.Clubs, "♣"],
  [Suit.Diamonds, "♦"],
  [Suit.Hearts, "♥"],
  [Suit.Spades, "♠"],
]);

const Letter: Map<number, string> = new Map([
  [Rank.Ace, "A"],
  [Rank.Two, "2"],
  [Rank.Three, "3"],
  [Rank.Four, "4"],
  [Rank.Five, "5"],
  [Rank.Six, "6"],
  [Rank.Seven, "7"],
  [Rank.Eight, "8"],
  [Rank.Nine, "9"],
  [Rank.Ten, "10"],
  [Rank.Jack, "J"],
  [Rank.Queen, "Q"],
  [Rank.King, "K"],
]);

export class Card extends Number {
  readonly suit: number;
  readonly rank: number;
  #icon: string;
  #name: string;
  #points: number = 0;
  #isAce: boolean;
  #isHidden: boolean;
  isBusted: boolean = false;
  owner: string = "";
  index: number = 0;

  constructor(card: number, hidden = false) {
    if (card < 0 || card > 52) {
      throw new Error("Invalid card");
    }
    super(card);
    this.suit = Card.toSuit(card);
    this.rank = card - this.suit;
    this.#isHidden = hidden;
    this.#isAce = this.rank === Rank.Ace;
    this.#name = `${Rank[this.rank]} of ${Suit[this.suit]}`;
    this.#icon = `${Letter.get(this.rank)} ${Icon.get(this.suit)}`;
    this.setPoints();
  }

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

  get icon() {
    if (this.#isHidden) {
      return "🂠";
    }
    return this.#icon;
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
    switch (this.rank) {
      case Rank.Ace:
        this.#points = 11;
        break;
      case Rank.Two:
        this.#points = 2;
        break;
      case Rank.Three:
        this.#points = 3;
        break;
      case Rank.Four:
        this.#points = 4;
        break;
      case Rank.Five:
        this.#points = 5;
        break;
      case Rank.Six:
        this.#points = 6;
        break;
      case Rank.Seven:
        this.#points = 7;
        break;
      case Rank.Eight:
        this.#points = 8;
        break;
      case Rank.Nine:
        this.#points = 9;
        break;
      case Rank.Ten:
        this.#points = 10;
        break;
      case Rank.Jack:
        this.#points = 10;
        break;
      case Rank.Queen:
        this.#points = 10;
        break;
      case Rank.King:
        this.#points = 10;
        break;
      default:
        throw new Error("Invalid card");
    }

    return this;
  }

  setAce(type: "high" | "low") {
    if (!this.#isAce) {
      throw new Error("Card is not an Ace");
    }

    if (type === "low") {
      this.#points = 1;
    } else {
      this.#points = 11;
    }

    return this;
  }

  public static toFace(card: number) {
    if (card < 0 || card > 52) {
      throw new Error("Invalid card");
    }
    return (card % 13) as number;
  }

  public static toSuit(card: number) {
    if (card < 0 || card > 52) {
      throw new Error("Invalid card");
    }
    return (Math.floor(card / 13) * 13) as number;
  }
}

