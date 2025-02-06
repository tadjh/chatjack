import { Card, Suit, Face } from "@/lib/card";

describe("Card", () => {
  it("should create a card with correct suit and face", () => {
    const card = new Card(Suit.Clubs + Face.Ace);
    expect(card.suit).toBe(Suit.Clubs);
    expect(card.face).toBe(Face.Ace);
  });

  it("should throw an error for invalid card number", () => {
    expect(() => new Card(-1)).toThrow("Invalid card");
    expect(() => new Card(53)).toThrow("Invalid card");
  });

  it("should return the correct name of the card", () => {
    const card = new Card(Suit.Clubs + Face.Ace);
    expect(card.name).toBe("Ace of Clubs");
  });

  it("should return the correct abbreviation of the card", () => {
    const card = new Card(Suit.Clubs + Face.Ace);
    expect(card.abbr).toBe("A ♣");
  });

  it("should show and hide the card correctly", () => {
    const card = new Card(Suit.Clubs + Face.Ace);
    card.hide();
    expect(card.isHidden).toBe(true);
    card.show();
    expect(card.isHidden).toBe(false);
  });

  it("should return the correct score for the card", () => {
    const aceCard = new Card(Suit.Clubs + Face.Ace);
    const tenCard = new Card(Suit.Clubs + Face.Ten);
    expect(aceCard.points).toBe(11);
    aceCard.updatePoints(true);
    expect(aceCard.points).toBe(1);
    expect(tenCard.points).toBe(10);
  });

  it("should identify if the card is an Ace", () => {
    const aceCard = new Card(Suit.Clubs + Face.Ace);
    const tenCard = new Card(Suit.Clubs + Face.Ten);
    expect(aceCard.isAce).toBe(true);
    expect(tenCard.isAce).toBe(false);
  });

  it("should convert card number to correct face", () => {
    const card = new Card(Suit.Clubs + Face.Ace);
    expect(card.face).toBe(Face.Ace);
  });

  it("should convert card number to correct suit", () => {
    const card = new Card(Suit.Clubs + Face.Ace);
    expect(card.suit).toBe(Suit.Clubs);
  });
});

