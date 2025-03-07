import { Card, Rank, Suit } from "@/lib/game/card";
import { Dealer } from "@/lib/game/dealer";
import { STATUS } from "@/lib/game/hand";
import { Player, Role } from "@/lib/game/player";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("Player", () => {
  let player: Player;
  let dealer: Dealer;

  beforeEach(() => {
    player = new Player();
    dealer = new Dealer();
  });

  afterEach(() => {
    player.reset();
    dealer.reset();
  });

  it("should create a player with default values", () => {
    expect(player.name).toBe("Player");
    expect(player.role).toBe(Role.Player);
    expect(player.hands.length).toBe(1);
  });

  it("should create a dealer with correct values", () => {
    expect(dealer.name).toBe("Dealer");
    expect(dealer.role).toBe(Role.Dealer);
    expect(dealer.hands.length).toBe(1);
  });

  it("should add cards to the player's hand and accumulate score", () => {
    const card1 = new Card({ card: Suit.Clubs + Rank.Ace }); // Ace of Clubs (normally 11)
    const card2 = new Card({ card: Suit.Clubs + Rank.Jack }); // Jack of Clubs (10)
    player.hand.add(card1).add(card2);
    expect(player.hand.length).toBe(2);
    expect(player.score).toBe(21);
  });

  it("should accumulate score correctly with multiple Aces", () => {
    const card1 = new Card({ card: Suit.Clubs + Rank.Ace }); // Ace of Clubs (11 initially)
    const card2 = new Card({ card: Suit.Diamonds + Rank.Ace }); // Ace of Diamonds (should count as 1 if needed)
    player.hand.add(card1).add(card2);
    expect(player.score).toBe(12); // 11 + 1 = 12
  });

  it("should reset the player's hand", () => {
    const card1 = new Card({ card: Suit.Clubs + Rank.Ace });
    player.hand.add(card1);
    player.reset();
    expect(player.hand.length).toBe(0);
    expect(player.score).toBe(0);
    expect(player.name).toBe("Player");
    expect(player.seat).toBe(1);
  });

  it("should allow hitting (adding a card) to the player's hand", () => {
    const card = new Card({ card: Suit.Clubs + Rank.Five }); // 5 points
    player.hit(card);
    expect(player.hand.length).toBe(1);
    expect(player.score).toBe(5);
  });

  it("should stand and update player's hand status accordingly", () => {
    const card1 = new Card({ card: Suit.Diamonds + Rank.Ten });
    const card2 = new Card({ card: Suit.Hearts + Rank.Seven });
    player.hand.add(card1).add(card2);
    // Before standing, status should be "playing"
    expect(player.status).toBe(STATUS.PLAYING);
    player.stand();
    expect(player.status).toBe(STATUS.STAND);
  });

  it("should split the hand correctly when given exactly two cards", () => {
    const card1 = new Card({ card: Suit.Clubs + Rank.Eight });
    const card2 = new Card({ card: Suit.Diamonds + Rank.Eight });
    player.hand.add(card1).add(card2);
    expect(player.hand.length).toBe(2);

    player.split();
    expect(player.hasSplit).toBe(true);
    // After splitting, player.hands should contain two hands
    expect(player.hands.length).toBe(2);
    // Each split hand should have one card
    expect(player.hands[0].length).toBe(1);
    expect(player.hands[1].length).toBe(1);

    // Their scores should match the individual card's points
    expect(player.scores[0]).toBe(card1.points);
    expect(player.scores[1]).toBe(card2.points);
  });

  it("should throw an error when attempting to split a hand with not exactly two cards", () => {
    const card = new Card({ card: Suit.Clubs + Rank.Nine });
    player.hand.add(card);
    expect(() => player.split()).toThrow(
      "Hand must have exactly two cards to split",
    );
  });

  it("should update the player's hand status correctly", () => {
    const card1 = new Card({ card: Suit.Diamonds + Rank.Ten });
    const card2 = new Card({ card: Suit.Hearts + Rank.Seven });
    player.hand.add(card1).add(card2);
    // Before standing, status should be "playing"
    expect(player.status).toBe(STATUS.PLAYING);
    player.stand();
    expect(player.status).toBe(STATUS.STAND);
  });

  it("should throw an error when attempting to hit a non-playing hand", () => {
    player.stand();
    const card = new Card({ card: Suit.Clubs + Rank.Five });
    expect(() => player.hit(card)).toThrow("Player's turn is over");
  });

  it("should throw an error when attempting to stand a non-playing hand", () => {
    player.stand();
    expect(() => player.stand()).toThrow("Player's turn is over");
  });

  it("should throw an error when attempting to split a non-playing hand", () => {
    player.stand();
    expect(() => player.split()).toThrow("Player's turn is over");
  });
});
