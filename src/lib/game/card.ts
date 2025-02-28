import { Palette } from "@/lib/constants";
import { Debug } from "@/lib/debug";

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
  readonly #name: string;
  readonly #icon: string;
  #id: string = "";
  #points: number = 0;
  #isHidden: boolean;
  #owner: string = "";
  #handIndex: number = -1;
  protected debug: Debug;

  constructor(
    card: number,
    hidden = false,
    debug = new Debug("Card", Palette.DarkBlue)
  ) {
    if (card < 0 || card > 52) {
      throw new Error("Invalid card");
    }
    super(card);
    this.suit = Card.toSuit(card);
    this.rank = card - this.suit;
    this.debug = debug;
    this.#isHidden = hidden;
    this.#name = `${Rank[this.rank]} of ${Suit[this.suit]}`;
    this.#icon = `${Letter.get(this.rank)} ${Icon.get(this.suit)}`;
    this.setId();
    this.setPoints();
  }

  public get id(): string {
    return this.#id;
  }

  get points() {
    return this.#points;
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

  get owner() {
    return this.#owner;
  }

  get handIndex() {
    return this.#handIndex;
  }

  show() {
    this.#isHidden = false;
    this.setId();
    this.debug.log("Revealing card:", this.name);
    return this;
  }

  hide() {
    this.#isHidden = true;
    this.setId();
    return this;
  }

  add(owner: string, index: number) {
    this.#owner = owner;
    this.#handIndex = index;
    this.setId();
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
    if (this.rank !== Rank.Ace) {
      throw new Error("Card is not an Ace");
    }

    this.debug.log(`Setting Ace to ${type}`);

    if (type === "low") {
      this.#points = 1;
    } else {
      this.#points = 11;
    }

    return this;
  }

  setId() {
    const owner = this.#owner && this.#owner.replace(/\s/g, "").toLowerCase();
    const name = this.isHidden
      ? "hole-card"
      : this.#name.replace(/\s/g, "-").toLowerCase();
    const slot = this.#handIndex > -1 && `slot-${this.#handIndex}`;
    const segments = [owner, name, slot].filter(Boolean);
    this.#id = segments.join("-");
    return this;
  }

  public static toRank(card: number) {
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

  /**
   * Returns the Unicode playing card character for a card number.
   *
   * A card number should be between 0 and 51 (inclusive), where:
   * - The suit is determined by flooring the number divided by 13:
   *   Clubs:   0–12
   *   Diamonds:13–25
   *   Hearts:  26–38
   *   Spades:  39–51
   *
   * For Unicode, each suit has a base code point:
   * - Spades:   U+1F0A1 (for Ace) to U+1F0AE (for King)
   * - Hearts:   U+1F0B1 to U+1F0BE
   * - Diamonds: U+1F0C1 to U+1F0CE
   * - Clubs:    U+1F0D1 to U+1F0DE
   *
   * Note: The Knight card (C) is omitted from a standard 52-card deck.
   * If the rank is Queen or higher (i.e. Queen, or King),
   * we add 1 to skip the Knight’s code point.
   *
   * @param card - The numerical representation of the card.
   * @returns The Unicode character for the card.
   */
  static toUnicode(card: number): string {
    if (card < 0 || card > 51) {
      throw new Error("Invalid card number, must be between 0 and 51.");
    }

    // Determine suit and rank.
    const suit = Card.toSuit(card);
    const rank = card - suit;

    // Determine the base code point based on suit.
    let base: number;
    switch (suit) {
      case Suit.Clubs:
        base = 0x1f0d1;
        break;
      case Suit.Diamonds:
        base = 0x1f0c1;
        break;
      case Suit.Hearts:
        base = 0x1f0b1;
        break;
      case Suit.Spades:
        base = 0x1f0a1;
        break;
      default:
        throw new Error("Invalid suit");
    }
    // For ranks 0 (Ace) to 10 (Jack), no adjustment is needed.
    // For Queen (11), and King (12) adjust by +1 (skip the Knight).
    const offset = rank < 11 ? rank : rank + 1;
    return String.fromCodePoint(base + offset);
  }
}

