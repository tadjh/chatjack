import { Debug } from "@/lib/debug";
import { Card, CardJSONSchema, Rank } from "@/lib/game/card";
import { z } from "zod";

export enum STATUS {
  PLAYING = "playing",
  BUSTED = "busted",
  BLACKJACK = "blackjack",
  STAND = "stand",
  SPLIT = "split",
}

export const handJSONSchema = z.object({
  owner: z.string(),
  cards: z.array(CardJSONSchema),
  status: z.nativeEnum(STATUS),
  score: z.number(),
});

export type HandJSON = z.infer<typeof handJSONSchema>;

export type HandOptions = {
  owner?: string;
  cards?: Card[];
  status?: STATUS;
  score?: number;
};

export class Hand {
  static readonly defaultOptions: Required<HandOptions> = {
    owner: "Player",
    cards: [],
    status: STATUS.PLAYING,
    score: 0,
  };
  public status: STATUS;
  readonly owner: string;
  readonly name: string;
  #score: number;
  #cards: Card[];
  protected debug: Debug;

  static getName(owner: string) {
    return `${owner}'s Hand`;
  }

  constructor(
    {
      owner = Hand.defaultOptions.owner,
      cards = Hand.defaultOptions.cards,
      status = Hand.defaultOptions.status,
      score = Hand.defaultOptions.score,
    }: HandOptions = Hand.defaultOptions,
    debug = new Debug(Hand.getName(owner), "Yellow"),
  ) {
    this.owner = owner;
    this.name = Hand.getName(owner);
    this.#cards = cards.length ? cards : [];
    this.status = status;
    this.#score = score;
    this.debug = debug;
  }

  get score() {
    return this.#score;
  }

  get isPlaying() {
    return this.status === STATUS.PLAYING;
  }

  get isBusted() {
    return this.status === STATUS.BUSTED;
  }

  get isStand() {
    return this.status === STATUS.STAND;
  }

  get isBlackjack() {
    return this.status === STATUS.BLACKJACK;
  }

  get cards() {
    return this.#cards;
  }

  get length() {
    return this.#cards.length;
  }

  add(card: Card) {
    this.protect();
    card.add(this.owner, this.#cards.length);
    this.#cards.push(card);
    return this.accumulate();
  }

  accumulate() {
    this.protect();
    let aces = 0;
    this.#score = this.#cards.reduce((score, card) => {
      if (card.rank === Rank.Ace && card.points === 11) {
        aces++;
      }
      score += card.points;
      return score;
    }, 0);

    if (this.#score > 21 && aces > 0) {
      this.#score = this.#cards.reduce((total, card) => {
        if (total > 21 && card.points === 11) {
          card.setAce("low");
          total -= 10;
          aces--;
        }
        return total;
      }, this.#score);
    }

    return this.updateStatus();
  }

  updateStatus() {
    this.protect();
    if (this.#score === 21) {
      this.status = STATUS.BLACKJACK;
    } else if (this.#score > 21) {
      this.status = STATUS.BUSTED;
    }
    return this;
  }

  stand() {
    this.protect();

    this.status = STATUS.STAND;
    return this;
  }

  split(): [Hand, Hand] {
    this.protect();

    if (this.#cards.length !== 2) {
      throw new Error("Hand must have exactly two cards to split");
    }

    const [first, second] = this.#cards;

    const hand = this.toJSON();
    this.reset().status = STATUS.SPLIT;
    return [
      Hand.fromJSON({
        ...hand,
        status: STATUS.PLAYING,
        score: first.points,
        cards: [{ ...first.toJSON(), handIndex: 0 }],
      }),
      Hand.fromJSON({
        ...hand,
        status: STATUS.PLAYING,
        score: second.points,
        cards: [{ ...second.toJSON(), handIndex: 1 }],
      }),
    ];
  }

  print() {
    let output = "";
    for (const card of this.#cards) {
      output += "\t" + card.name + "\n";
    }

    this.debug.log(output);
  }

  reset() {
    this.debug.log(`${this.name} is resetting`);
    this.#cards.length = 0;
    this.#score = 0;
    this.status = STATUS.PLAYING;
    return this;
  }

  protect() {
    if (!this.isPlaying && !this.isBlackjack) {
      throw new Error(
        `Hand is not allowed to perform this action, state: ${this.status}`,
      );
    }
  }

  public toJSON(): HandJSON {
    return {
      owner: this.owner,
      status: this.status,
      score: this.#score,
      cards: this.#cards.map((card) => card.toJSON()),
    };
  }

  public static fromJSON(json: HandJSON) {
    return new Hand({
      ...json,
      cards: json.cards.map((card) => Card.fromJSON(card)),
    });
  }
}
