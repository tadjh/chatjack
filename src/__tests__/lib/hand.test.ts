import { Hand } from "@/lib/hand";
import { Card, Suit, Rank } from "@/lib/card";

describe("Hand", () => {
  test("should create a hand with default values", () => {
    const hand = new Hand();
    expect(hand.length).toBe(0);
    expect(hand.score).toBe(0);
    expect(hand.status).toBe("playing");
    expect(hand.isPlaying).toBe(true);
  });

  test("should add cards to the hand and calculate score correctly", () => {
    const hand = new Hand();
    const card1 = new Card(Suit.Clubs + Rank.Ace); // Ace of Clubs
    const card2 = new Card(Suit.Clubs + Rank.Jack); // Jack of Clubs
    hand.add(card1).add(card2);
    expect(hand.length).toBe(2);
    expect(hand.score).toBe(21);
    expect(hand.status).toBe("blackjack");
  });

  test("should calculate score correctly with multiple Aces", () => {
    const hand = new Hand();
    const card1 = new Card(Suit.Clubs + Rank.Ace); // Ace of Clubs
    const card2 = new Card(Suit.Diamonds + Rank.Ace); // Ace of Diamonds
    hand.add(card1).add(card2);
    expect(hand.score).toBe(12); // One Ace counts as 11, the other as 1
  });

  test("should update status to busted if score exceeds 21", () => {
    const hand = new Hand();
    const card1 = new Card(Suit.Clubs + Rank.Ten); // Ten of Clubs
    const card2 = new Card(Suit.Diamonds + Rank.Ten); // Ten of Diamonds
    const card3 = new Card(Suit.Hearts + Rank.Two); // Two of Hearts
    hand.add(card1).add(card2).add(card3);
    expect(hand.score).toBe(22);
    expect(hand.status).toBe("bust");
    expect(hand.isPlaying).toBe(false);
  });

  test("should update status to stand", () => {
    const hand = new Hand().stand();
    expect(hand.status).toBe("stand");
    expect(hand.isPlaying).toBe(false);
  });

  test("should reset the hand", () => {
    const hand = new Hand();
    const card1 = new Card(Suit.Clubs + Rank.Ace); // Ace of Clubs
    hand.add(card1);
    hand.reset();
    expect(hand.length).toBe(0);
    expect(hand.score).toBe(0);
    expect(hand.status).toBe("playing");
    expect(hand.isPlaying).toBe(true);
  });
});

