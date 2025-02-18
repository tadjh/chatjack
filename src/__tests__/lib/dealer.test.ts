import { Dealer } from "@/lib/dealer";
import { Card, Suit, Rank } from "@/lib/card";
import { describe, it, expect, beforeEach } from "vitest";

describe("Dealer", () => {
  let dealer: Dealer;
  let deck: Card[];

  beforeEach(() => {
    dealer = new Dealer();
    // prepare a simple deck array for testing purposes.
    deck = [
      // Cards that won't immediately bust the dealer if added.
      new Card(Suit.Clubs + Rank.Two), // 2 points
      new Card(Suit.Diamonds + Rank.Three), // 3 points
      new Card(Suit.Hearts + Rank.Four), // 4 points
      new Card(Suit.Spades + Rank.Five), // 5 points
      new Card(Suit.Clubs + Rank.King), // 10 points
    ];
    // Reset dealer's hand for each test if needed.
    // (Assuming reset method exists on Hand, otherwise adjust accordingly.)
    dealer.hand.reset?.();
  });

  it("should create a Dealer with correct default values", () => {
    expect(dealer.name).toBe("Dealer");
    expect(dealer.role).toBe(1); // Role.Dealer (assuming Role.Dealer === 1)
    expect(dealer.hands.length).toBe(1);
  });

  it("should throw an error when split is called", () => {
    expect(() => dealer.split()).toThrow("Dealer cannot split");
  });

  it("should decide to hit if score is less than 17", () => {
    // Manually set dealer hand score through cards that total less than 17.
    dealer.hand.reset?.();
    dealer.hand.add(new Card(Suit.Clubs + Rank.Two)); // 2 points
    dealer.hand.add(new Card(Suit.Diamonds + Rank.Four)); // 4 points
    // Total = 6, below 17 so decision should be "hit"
    const decision = dealer.decide(deck);
    expect(decision).toBe("hit");
  });

  it("should decide to stand if score is 17 or above", () => {
    dealer.hand.reset?.();
    // Create cards that total 17 or above. For example, King (10) + Seven (7) = 17.
    dealer.hand.add(new Card(Suit.Hearts + Rank.King)); // 10 points
    dealer.hand.add(new Card(Suit.Spades + Rank.Seven)); // 7 points
    const decision = dealer.decide(deck);
    expect(decision).toBe("stand");
  });

  it("should consider deck probability when countCards is true", () => {
    dealer.hand.reset?.();
    // Dealer's current score is set to 16.
    dealer.hand.add(new Card(Suit.Clubs + Rank.Ten)); // 10 points
    dealer.hand.add(new Card(Suit.Diamonds + Rank.Six)); // 6 points = 16
    // Assume deck: if many cards would bust dealer (score+card.points > 21)
    // we simulate with deck containing high value cards.
    const highValueDeck = [
      new Card(Suit.Hearts + Rank.King), // 10
      new Card(Suit.Spades + Rank.Queen), // 10
      new Card(Suit.Hearts + Rank.Jack), // 10
      new Card(Suit.Clubs + Rank.Ten), // 10
    ];
    // With countCards true and bust probability high:
    const decision = dealer.decide(highValueDeck, true);
    expect(decision).toBe("stand");
  });

  it("should calculate the bust probability correctly", () => {
    // Assuming dealer score is 15 and deck consists of various cards.
    dealer.hand.reset?.();
    dealer.hand.add(new Card(Suit.Clubs + Rank.Ten)); // 10
    dealer.hand.add(new Card(Suit.Diamonds + Rank.Five)); // 5 -> total 15

    // Prepare a deck with a mix of busting and non-busting cards.
    const mixedDeck = [
      new Card(Suit.Hearts + Rank.Seven), // 7 + 15 = 22 busts
      new Card(Suit.Spades + Rank.Two), // 2 + 15 = 17 safe
      new Card(Suit.Hearts + Rank.Queen), // 10 + 15 = 25 busts
      new Card(Suit.Clubs + Rank.Three), // 3 + 15 = 18 safe
    ];
    // busts = 2/4 = 0.5
    const prob = dealer.probability(mixedDeck);
    expect(prob).toBeCloseTo(0.5, 2);
  });
});

