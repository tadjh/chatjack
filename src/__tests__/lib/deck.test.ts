import { Deck } from "@/lib/deck";
import { Card, Rank, Suit } from "@/lib/card";
import { describe, test, expect, vi } from "vitest";

describe("Deck", () => {
  test("should create a deck with a valid count", () => {
    const deck = new Deck(1);
    // A single deck should have 52 cards.
    expect(deck.length).toBe(52);
  });

  test("should throw an error when creating a deck with an invalid count", () => {
    expect(() => new Deck(-1)).toThrow("Invalid deck count");
    expect(() => new Deck(9)).toThrow("Invalid deck count");
  });

  test("should shuffle the deck", () => {
    const deck = new Deck(1);
    const originalOrder = [...deck];
    deck.shuffle();
    // It is possible (but unlikely) that a shuffle returns the same order,
    // so this test might occasionally fail. You may want to check that at least one card moved.
    expect(deck).not.toEqual(originalOrder);
  });

  test("should draw a card from the deck", () => {
    const deck = new Deck(1);
    const initialRemaining = deck.length;
    const card = deck.draw();
    expect(card).toBeInstanceOf(Card);
    // Drawing a card should decrease the deck length by one.
    expect(deck.length).toBe(initialRemaining - 1);
  });

  test("should peek the top card of the deck without removing it", () => {
    const deck = new Deck(1);
    const topCard = deck.peek();
    expect(topCard).toBeInstanceOf(Card);
    // Peeking should not remove the card from the deck
    expect(deck.length).toBe(52);
  });

  test("should empty the deck", () => {
    const deck = new Deck(1);
    expect(deck.length).toBe(52);
    deck.empty();
    expect(deck.length).toBe(0);
  });

  test("should throw an error when drawing a card from an empty deck", () => {
    const deck = new Deck(1);
    deck.empty();
    expect(() => deck.draw()).toThrow("Card drawn: none");
  });

  test("should add a card to the deck at the correct position", () => {
    const deck = new Deck(1);
    const initialLength = deck.length;
    const card = new Card(Suit.Clubs + Rank.Ace);
    // Insert the card at index 0 so that every card shifts one index higher.
    deck.splice(0, 0, card);
    expect(deck.length).toBe(initialLength + 1);
    expect(deck[0]).toBe(card);
  });

  test.skip("should print the deck", () => {
    const deck = new Deck(1);
    console.log = vi.fn();
    deck.print();
    expect(console.log).toHaveBeenCalled();
  });
});

