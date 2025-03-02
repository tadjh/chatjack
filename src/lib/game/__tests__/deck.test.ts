import { Card, Rank, Suit } from "@/lib/game/card";
import { Deck } from "@/lib/game/deck";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Deck", () => {
  let deck: Deck;

  beforeEach(() => {
    deck = new Deck();
  });

  it("should create a deck with a valid count", () => {
    // A single deck should have 52 cards.
    expect(deck.length).toBe(52);
  });

  it("should throw an error when creating a deck with an invalid count", () => {
    expect(() => new Deck({ shoeSize: -1 })).toThrow("Invalid deck count");
    expect(() => new Deck({ shoeSize: 9 })).toThrow("Invalid deck count");
  });

  it("should shuffle the deck", () => {
    const originalOrder = [...deck];
    deck.shuffle();
    // It is possible (but unlikely) that a shuffle returns the same order,
    // so this test might occasionally fail. You may want to check that at least one card moved.
    expect(deck).not.toEqual(originalOrder);
  });

  it("should draw a card from the deck", () => {
    const initialRemaining = deck.length;
    const card = deck.draw();
    expect(card).toBeInstanceOf(Card);
    // Drawing a card should decrease the deck length by one.
    expect(deck.length).toBe(initialRemaining - 1);
  });

  it("should peek the top card of the deck without removing it", () => {
    const topCard = deck.peek();
    expect(topCard).toBeInstanceOf(Card);
    // Peeking should not remove the card from the deck
    expect(deck.length).toBe(52);
  });

  it("should empty the deck", () => {
    expect(deck.length).toBe(52);
    deck.empty();
    expect(deck.length).toBe(0);
  });

  it("should throw an error when drawing a card from an empty deck", () => {
    deck.empty();
    expect(() => deck.draw()).toThrow("Card drawn: none");
  });

  it("should throw an error when peeking a card from an empty deck", () => {
    deck.empty();
    expect(() => deck.peek()).toThrow("No cards left");
  });

  it("should add a card to the deck at the correct position", () => {
    const initialLength = deck.length;
    const card = new Card(Suit.Clubs + Rank.Ace);
    // Insert the card at index 0 so that every card shifts one index higher.
    deck.splice(0, 0, card);
    expect(deck.length).toBe(initialLength + 1);
    expect(deck[0]).toBe(card);
  });

  it.skip("should print the deck", () => {
    console.log = vi.fn();
    deck.print();
    expect(console.log).toHaveBeenCalled();
  });

  it("should reshuffle the deck when it is empty", () => {
    deck.empty();
    deck.reshuffle(1);
    expect(deck.length).toBe(52);
  });

  it("should throw an error when reshuffling a non-empty deck", () => {
    expect(() => deck.reshuffle(1)).toThrow("Deck is not empty");
  });
});

