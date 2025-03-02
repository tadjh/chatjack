import { Card, Rank, Suit } from "@/lib/game/card";
import { describe, expect, it } from "vitest";

describe("Card", () => {
  it("should create a card with the correct suit and face", () => {
    const card = new Card(Suit.Clubs + Rank.Ace);
    expect(card.suit).toBe(Suit.Clubs);
    expect(card.rank).toBe(Rank.Ace);
  });

  it("should throw an error for an invalid card number", () => {
    expect(() => new Card(-1)).toThrow("Invalid card");
    expect(() => new Card(53)).toThrow("Invalid card");
  });

  it("should return the correct card name", () => {
    const card = new Card(Suit.Clubs + Rank.Ace);
    expect(card.name).toBe("Ace of Clubs");
    // When hidden, name returns "Hidden"
    card.hide();
    expect(card.name).toBe("Hidden");
  });

  it("should return the correct abbreviation", () => {
    const card = new Card(Suit.Clubs + Rank.Ace);
    expect(card.icon).toBe("A ♣");
    // When hidden, abbreviation returns a back-face symbol
    card.hide();
    expect(card.icon).toBe("🂠");
  });

  it("should toggle the hidden state correctly", () => {
    const card = new Card(Suit.Clubs + Rank.Ace);
    card.hide();
    expect(card.isHidden).toBe(true);
    card.show();
    expect(card.isHidden).toBe(false);
  });

  it("should assign correct points to cards and update Ace value", () => {
    const aceCard = new Card(Suit.Clubs + Rank.Ace);
    const tenCard = new Card(Suit.Clubs + Rank.Ten);
    expect(aceCard.points).toBe(11);
    // For Ace, when updating with lowAce, value should become 1
    aceCard.setAce("low");
    expect(aceCard.points).toBe(1);
    expect(tenCard.points).toBe(10);
  });

  it("should throw an error when setting Ace points on a non-Ace card", () => {
    const card = new Card(Suit.Clubs + Rank.Ten);
    expect(() => card.setAce("low")).toThrow("Card is not an Ace");
  });

  it("should correctly convert a card number to its face", () => {
    const card = new Card(Suit.Clubs + Rank.Ace);
    // The face of the card is determined by card.rank, which should equal Rank.Ace.
    expect(card.rank).toBe(Rank.Ace);
  });

  it("should correctly convert a card number to its suit", () => {
    const card = new Card(Suit.Clubs + Rank.Ace);
    // The suit of the card is determined by card.suit, which should equal Suit.Clubs.
    expect(card.suit).toBe(Suit.Clubs);
  });
});

