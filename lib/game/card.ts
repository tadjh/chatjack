import { Debug } from "@/lib/debug";
import { z } from "zod";

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

export const CardJSONSchema = z.object({
  card: z.number().min(0).max(52),
  owner: z.string(),
  hidden: z.boolean(),
  handIndex: z.number(),
  isHigh: z.boolean().optional(),
});

export type CardJSON = z.infer<typeof CardJSONSchema>;

export type CardOptions = {
  card: number;
  owner?: string;
  hidden?: boolean;
  handIndex?: number;
  isHigh?: boolean;
};

export class Card {
  static readonly defaultOptions: Required<CardOptions> = {
    card: 0,
    owner: "",
    hidden: false,
    handIndex: -1,
    isHigh: true,
  };
  readonly suit: number;
  readonly rank: number;
  readonly #name: string;
  readonly #icon: string;
  readonly value: number;
  #id: string = "";
  #points: number;
  #isHidden: boolean;
  #owner: string;
  #handIndex: number;
  #isHigh: boolean;
  protected debug: Debug;

  static formatName(rank: number, suit: number) {
    return `${Rank[rank]} of ${Suit[suit]}`;
  }

  static formatIcon(rank: number, suit: number) {
    return `${Letter.get(rank)} ${Icon.get(suit)}`;
  }

  constructor(
    {
      card,
      owner = Card.defaultOptions.owner,
      hidden = Card.defaultOptions.hidden,
      handIndex = Card.defaultOptions.handIndex,
      isHigh = Card.defaultOptions.isHigh,
    }: CardOptions = Card.defaultOptions,
    debug = new Debug(Card.name, "DarkBlue"),
  ) {
    if (card < 0 || card > 52) {
      throw new Error("Invalid card");
    }
    this.value = card;
    this.suit = Card.toSuit(card);
    this.rank = card - this.suit;
    this.#isHidden = hidden;
    this.#name = Card.formatName(this.rank, this.suit);
    this.#icon = Card.formatIcon(this.rank, this.suit);
    this.#owner = owner;
    this.#handIndex = handIndex;
    this.#isHigh = isHigh;
    this.debug = debug;
    this.#id = Card.formatId(
      this.#owner,
      this.#name,
      this.#handIndex,
      this.#isHidden,
    );
    this.#points = Card.getPoints(this.rank, this.#isHigh);
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
    this.#id = Card.formatId(
      this.#owner,
      this.#name,
      this.#handIndex,
      this.#isHidden,
    );
    this.debug.log("Revealing card:", this.name);
    return this;
  }

  hide() {
    this.#isHidden = true;
    this.#id = Card.formatId(
      this.#owner,
      this.#name,
      this.#handIndex,
      this.#isHidden,
    );
    return this;
  }

  add(owner: string, index: number) {
    this.#owner = owner;
    this.#handIndex = index;
    this.#id = Card.formatId(
      this.#owner,
      this.#name,
      this.#handIndex,
      this.#isHidden,
    );
    return this;
  }

  setAce(type: "high" | "low") {
    if (this.rank !== Rank.Ace) {
      throw new Error("Card is not an Ace");
    }

    this.debug.log(`Setting Ace to ${type}`);

    this.#isHigh = type === "high";
    this.#points = Card.getPoints(this.rank, this.#isHigh);

    return this;
  }

  public static formatId(
    owner: string,
    name: string,
    index: number,
    isHidden: boolean,
  ) {
    return [
      owner.replace(/\s/g, "").toLowerCase(),
      isHidden ? "hole-card" : name.replace(/\s/g, "-").toLowerCase(),
      index > -1 && `slot-${index}`,
    ]
      .filter(Boolean)
      .join("-");
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

  public static getPoints(rank: Rank, isHigh = true) {
    switch (rank) {
      case Rank.Two:
        return 2;
      case Rank.Three:
        return 3;
      case Rank.Four:
        return 4;
      case Rank.Five:
        return 5;
      case Rank.Six:
        return 6;
      case Rank.Seven:
        return 7;
      case Rank.Eight:
        return 8;
      case Rank.Nine:
        return 9;
      case Rank.Ten:
      case Rank.Jack:
      case Rank.Queen:
      case Rank.King:
        return 10;
      case Rank.Ace:
        return isHigh ? 11 : 1;
    }
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
        throw new Error(`Invalid suit: ${suit}`);
    }
    // For ranks 0 (Ace) to 10 (Jack), no adjustment is needed.
    // For Queen (11), and King (12) adjust by +1 (skip the Knight).
    const offset = rank < 11 ? rank : rank + 1;
    return String.fromCodePoint(base + offset);
  }

  public toJSON(): CardJSON {
    return {
      card: this.value,
      owner: this.#owner,
      hidden: this.#isHidden,
      handIndex: this.#handIndex,
      isHigh: this.#isHigh,
    };
  }

  public static fromJSON(json: CardJSON) {
    return new Card(json);
  }
}
