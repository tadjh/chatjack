import { Card } from "@/lib/game/card";
import { Debug } from "@/lib/debug";
import { Hand } from "@/lib/game/hand";
import {
  Player,
  PlayerOptions,
  playerJSONSchema,
  Role,
} from "@/lib/game/player";
import { z } from "zod";
export const DealerJSONSchema = playerJSONSchema;

export type DealerJSON = z.infer<typeof DealerJSONSchema>;

export type DealerOptions = Pick<
  PlayerOptions,
  "isDone" | "hasSplit" | "hands"
>;

export class Dealer extends Player {
  static readonly defaultOptions: Required<PlayerOptions> = {
    name: "Dealer",
    seat: 0,
    role: Role.Dealer,
    isDone: false,
    hasSplit: false,
    hands: [],
  };
  constructor(
    {
      isDone = Dealer.defaultOptions.isDone,
      hasSplit = Dealer.defaultOptions.hasSplit,
      hands = Dealer.defaultOptions.hands,
    }: DealerOptions = Dealer.defaultOptions,
    debug = new Debug(Dealer.name, "Red"),
  ) {
    super(
      {
        ...Dealer.defaultOptions,
        isDone,
        hasSplit,
        hands: hands.length ? hands : [new Hand({ owner: Dealer.name })],
      },
      debug,
    );
  }

  get isBusted() {
    return this.hand.isBusted;
  }

  get score() {
    if (this.hand.length === 0) {
      return 0;
    }

    return this.hand.cards[1].isHidden
      ? this.hand.cards[0].points
      : this.hand.score;
  }

  reveal() {
    this.debug.log("Revealing hole card");
    this.hand.cards[1].show();
  }

  probability(deck: Card[]) {
    let busts = 0;
    for (const card of deck) {
      if (this.score + card.points > 21) {
        busts++;
      }
    }

    return busts / deck.length;
  }

  decide(deck: Card[], countCards = false): "hit" | "stand" {
    if (countCards) {
      const busts = this.probability(deck);
      if (busts < 0.5 && this.score < 21) {
        return "hit";
      }
    } else if (this.score < 17) {
      return "hit";
    }

    return "stand";
  }

  split(): this {
    throw new Error("Dealer cannot split");
  }

  public toJSON(): DealerJSON {
    return super.toJSON();
  }

  public static fromJSON(json: DealerJSON) {
    return new Dealer({
      ...json,
      hands: json.hands.map((hand) => Hand.fromJSON(hand)),
    });
  }
}
