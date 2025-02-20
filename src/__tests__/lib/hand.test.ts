import { Hand } from "@/lib/hand";
import { Card, Suit, Rank } from "@/lib/card";
import { describe, test, expect } from "vitest";

describe("Hand", () => {
  test("should create a hand with default values", () => {
    const hand = new Hand("Test");
    expect(hand.length).toBe(0);
    expect(hand.score).toBe(0);
    expect(hand.status).toBe("playing");
    expect(hand.isPlaying).toBe(true);
  });

  test("should add cards to the hand and calculate score correctly", () => {
    const hand = new Hand("Test");
    const card1 = new Card(Suit.Clubs + Rank.Ace); // Ace of Clubs (normally 11)
    const card2 = new Card(Suit.Clubs + Rank.Jack); // Jack of Clubs (10)
    hand.add(card1).add(card2);
    expect(hand.length).toBe(2);
    expect(hand.score).toBe(21);
    expect(hand.status).toBe("blackjack");
  });

  test("should calculate score correctly with a late reduction", () => {
    const hand = new Hand("Test");
    const card1 = new Card(Suit.Spades + Rank.Nine);
    const card2 = new Card(Suit.Hearts + Rank.Six);
    const card3 = new Card(Suit.Clubs + Rank.Ace);
    const card4 = new Card(Suit.Diamonds + Rank.King);
    hand.add(card1).add(card2).add(card3).add(card4);
    expect(hand.length).toBe(4);
    expect(hand.score).toBe(26);
    expect(hand.status).toBe("busted");
  });

  test("should calculate score correctly with multiple Aces", () => {
    const hand = new Hand("Test");
    const ace1 = new Card(Suit.Clubs + Rank.Ace); // Ace of Clubs (11 initially)
    const ace2 = new Card(Suit.Diamonds + Rank.Ace); // Ace of Diamonds (should be 1 if needed)
    hand.add(ace1).add(ace2);
    expect(hand.score).toBe(12); // 11 + 1 = 12
  });

  test("should reccalculate score correctly with multiple Aces and other cards", () => {
    const hand = new Hand("Test");
    const ace1 = new Card(Suit.Clubs + Rank.Ace); // Ace of Clubs (11 initially and then should become 1)
    const ace2 = new Card(Suit.Diamonds + Rank.Ace); // Ace of Diamonds (should be 1 if needed)
    const card1 = new Card(Suit.Clubs + Rank.Ten); // Ten of Clubs (10)
    hand.add(ace1).add(ace2).add(card1);
    expect(hand.score).toBe(12); // 1 + 1 + 10 = 12
  });

  test("should update status to busted if score exceeds 21", () => {
    const hand = new Hand("Test");
    const card1 = new Card(Suit.Clubs + Rank.Ten); // 10
    const card2 = new Card(Suit.Diamonds + Rank.Ten); // 10
    const card3 = new Card(Suit.Hearts + Rank.Two); // 2 -> total 22
    hand.add(card1).add(card2).add(card3);
    expect(hand.score).toBe(22);
    expect(hand.status).toBe("busted");
    expect(hand.isPlaying).toBe(false);
  });

  test("should update status to stand", () => {
    const hand = new Hand("Test");
    hand.stand();
    expect(hand.status).toBe("stand");
    expect(hand.isPlaying).toBe(false);
  });

  test("should reset the hand", () => {
    const hand = new Hand("Test");
    const card = new Card(Suit.Clubs + Rank.Ace);
    hand.add(card);
    hand.reset();
    expect(hand.length).toBe(0);
    expect(hand.score).toBe(0);
    expect(hand.status).toBe("playing");
    expect(hand.isPlaying).toBe(true);
  });

  test("should throw an error when trying to add a card to a non-playing hand", () => {
    const hand = new Hand("Test");
    hand.stand(); // Ends play so further actions are disallowed.
    const card = new Card(Suit.Clubs + Rank.Ace);
    expect(() => hand.add(card)).toThrow(
      "Hand is not allowed to perform this action"
    );
  });

  test("should assign proper index to added cards", () => {
    const hand = new Hand("Test");
    const card1 = new Card(Suit.Hearts + Rank.Seven);
    const card2 = new Card(Suit.Spades + Rank.Eight);
    hand.add(card1);
    hand.add(card2);
    expect(card1.handIndex).toBe(0);
    expect(card2.handIndex).toBe(1);
  });

  test("should correctly calculate score with three Aces", () => {
    const hand = new Hand("Test");
    // First Ace counts as 11; subsequent Aces count as 1 if needed.
    // Expected score: 11 + 1 + 1 = 13.
    const ace1 = new Card(Suit.Clubs + Rank.Ace);
    const ace2 = new Card(Suit.Diamonds + Rank.Ace);
    const ace3 = new Card(Suit.Hearts + Rank.Ace);
    hand.add(ace1).add(ace2).add(ace3);
    expect(hand.score).toBe(13);
  });

  test("should throw an error when calling stand on a non-playing (busted) hand", () => {
    const hand = new Hand("Test");
    const card1 = new Card(Suit.Clubs + Rank.Ten);
    const card2 = new Card(Suit.Diamonds + Rank.Ten);
    const card3 = new Card(Suit.Hearts + Rank.Two); // Total becomes 22 -> busted.
    hand.add(card1).add(card2).add(card3);
    expect(hand.status).toBe("busted");
    expect(() => hand.stand()).toThrow(
      "Hand is not allowed to perform this action"
    );
  });

  test("should throw an error when calling accumulate on a non-playing hand", () => {
    const hand = new Hand("Test");
    // End play by calling stand.
    hand.stand();
    expect(() => hand.accumulate()).toThrow(
      "Hand is not allowed to perform this action"
    );
  });

  test("should throw an error when splitting a hand with not exactly two cards", () => {
    const hand = new Hand("Test");
    const card = new Card(Suit.Clubs + Rank.Eight);
    hand.add(card);
    expect(() => hand.split()).toThrow(
      "Hand must have exactly two cards to split"
    );
  });
});

