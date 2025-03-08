import { Debug } from "@/lib/debug";
import { Card } from "@/lib/game/card";
import { Hand, handJSONSchema } from "@/lib/game/hand";
import { z } from "zod";

export enum Role {
  Dealer,
  Player,
}

export const playerJSONSchema = z.object({
  name: z.string(),
  seat: z.number(),
  role: z.nativeEnum(Role),
  isDone: z.boolean(),
  hasSplit: z.boolean(),
  hands: z.array(handJSONSchema),
});

export type PlayerJSON = z.infer<typeof playerJSONSchema>;

export type PlayerOptions = {
  name?: string;
  seat?: number;
  role?: Role;
  isDone?: boolean;
  hasSplit?: boolean;
  hands?: Hand[];
};

export class Player {
  static readonly defaultOptions: Required<PlayerOptions> = {
    name: "Player",
    seat: 1,
    role: Role.Player,
    isDone: false,
    hasSplit: false,
    hands: [],
  };
  readonly name: string;
  readonly seat: number;
  readonly role: Role;
  #isDone;
  #hasSplit;
  #hands: Hand[];
  protected debug: Debug;

  constructor(
    {
      name = Player.defaultOptions.name,
      seat = Player.defaultOptions.seat,
      role = Player.defaultOptions.role,
      isDone = Player.defaultOptions.isDone,
      hasSplit = Player.defaultOptions.hasSplit,
      hands = Player.defaultOptions.hands,
    }: PlayerOptions = Player.defaultOptions,
    debug = new Debug(Player.name, "Red"),
  ) {
    this.debug = debug;
    this.debug.log(`Creating: ${name}`);
    this.name = name;
    this.seat = seat;
    this.role = role;
    this.#isDone = isDone;
    this.#hasSplit = hasSplit;
    this.#hands = hands.length ? hands : [new Hand({ owner: this.name })];
  }

  get hand(): Hand {
    return this.#hands[0];
  }

  get hands(): readonly Hand[] {
    return this.#hands;
  }

  get score() {
    return this.#hands[0].score;
  }

  get scores() {
    return this.#hands.map((hand) => hand.score);
  }

  get status() {
    return this.#hands[0].status;
  }

  get statuses() {
    return this.#hands.map((hand) => hand.status);
  }

  get hasSplit() {
    return this.#hasSplit;
  }

  get isDone() {
    return this.#isDone;
  }

  hit(card: Card, index = 0) {
    if (this.#isDone) {
      throw new Error(`${this.name}'s turn is over`);
    }

    if (this.#hands.length <= index || index < 0) {
      throw new Error("Hand does not exist");
    }
    this.#hands[index].add(card);

    // TODO Support split hands
    if (
      this.#hands.every(
        (hand) => hand.isStand || hand.isBusted || hand.isBlackjack,
      )
    ) {
      this.#isDone = true;
    }

    return this;
  }

  stand(index = 0) {
    if (this.#isDone) {
      throw new Error(`${this.name}'s turn is over`);
    }

    if (this.#hands.length <= index || index < 0) {
      throw new Error("Hand does not exist");
    }
    this.#hands[index].stand();

    if (
      this.#hands.every(
        (hand) => hand.isStand || hand.isBusted || hand.isBlackjack,
      )
    ) {
      this.#isDone = true;
    }
    return this;
  }

  split() {
    if (this.#isDone) {
      throw new Error(`${this.name}'s turn is over`);
    }

    if (this.#hasSplit) {
      throw new Error("Player has already split");
    }

    this.#hands = this.#hands[0].split();
    this.#hasSplit = true;
    return this;
  }

  reset() {
    this.debug.log(`${this.name} is resetting`);
    this.#hands = [new Hand({ owner: this.name })];
    this.#hasSplit = false;
    this.#isDone = false;
    return this;
  }

  public toJSON(): PlayerJSON {
    return {
      name: this.name,
      seat: this.seat,
      role: this.role,
      isDone: this.#isDone,
      hasSplit: this.#hasSplit,
      hands: this.#hands.map((hand) => hand.toJSON()),
    };
  }

  public static fromJSON(json: PlayerJSON) {
    return new Player({
      ...json,
      hands: json.hands.map((hand) => Hand.fromJSON(hand)),
    });
  }
}
