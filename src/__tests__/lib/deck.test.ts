import { Deck, fixedDecks } from "@/lib/deck";
import { Card, Rank, Suit } from "@/lib/card";
import { describe, it, expect, vi } from "vitest";

describe("Deck", () => {
  it("should create a deck with a valid count", () => {
    const deck = new Deck({ shoeSize: 1 });
    // A single deck should have 52 cards.
    expect(deck.length).toBe(52);
  });

  it("should create a deck using a fixed deck", () => {
    const fixed = fixedDecks["player-bust"]; // use fixed deck key "player-bust"
    const deck = new Deck({ cards: fixed });
    // When a fixed deck is provided, the deck order should be the reversed order of the provided fixed card numbers.
    // We compare the card numbers.
    const deckValues = deck.map((card) => Number(card.valueOf()));
    expect(deckValues.reverse()).toEqual(fixed);
  });

  it("should throw an error when creating a deck with an invalid shoe size", () => {
    expect(() => new Deck({ shoeSize: -1 })).toThrow("Invalid deck shoe size");
    expect(() => new Deck({ shoeSize: 9 })).toThrow("Invalid deck shoe size");
  });

  it("should shuffle the deck", () => {
    const deck = new Deck({ shoeSize: 1 });
    const originalOrder = [...deck];
    deck.shuffle();
    // It is possible (but unlikely) that a shuffle returns the same order,
    // so we check that at least one card has moved.
    expect(deck).not.toEqual(originalOrder);
  });

  it("should draw a card from the deck", () => {
    const deck = new Deck({ shoeSize: 1 });
    const initialRemaining = deck.length;
    const card = deck.draw();
    expect(card).toBeInstanceOf(Card);
    // Drawing a card should reduce the deck length by one.
    expect(deck.length).toBe(initialRemaining - 1);
  });

  it("should peek the top card of the deck without removing it", () => {
    const deck = new Deck({ shoeSize: 1 });
    const topCard = deck.peek();
    expect(topCard).toBeInstanceOf(Card);
    // After peeking, deck length remains unchanged.
    expect(deck.length).toBe(52);
  });

  it("should empty the deck", () => {
    const deck = new Deck({ shoeSize: 1 });
    expect(deck.length).toBe(52);
    deck.empty();
    expect(deck.length).toBe(0);
  });

  it("should throw an error when drawing a card from an empty deck", () => {
    const deck = new Deck({ shoeSize: 1 });
    deck.empty();
    expect(() => deck.draw()).toThrow("Card drawn: none");
  });

  it("should throw an error when peeking a card from an empty deck", () => {
    const deck = new Deck({ shoeSize: 1 });
    deck.empty();
    expect(() => deck.peek()).toThrow("No cards left");
  });

  it("should add a card to the deck at the correct position", () => {
    const deck = new Deck({ shoeSize: 1 });
    const initialLength = deck.length;
    const card = new Card(Suit.Clubs + Rank.Ace);
    // Insert the card at index 0 so that every card shifts one index higher.
    deck.splice(0, 0, card);
    expect(deck.length).toBe(initialLength + 1);
    expect(deck[0]).toBe(card);
  });

  it.skip("should print the deck", () => {
    const deck = new Deck({ shoeSize: 1 });
    console.log = vi.fn();
    deck.print();
    expect(console.log).toHaveBeenCalled();
  });

  it("should reshuffle the deck when it is empty", () => {
    const deck = new Deck({ shoeSize: 1 });
    deck.empty();
    deck.reshuffle(1);
    expect(deck.length).toBe(52);
  });

  it("should throw an error when reshuffling a non-empty deck", () => {
    const deck = new Deck({ shoeSize: 1 });
    expect(() => deck.reshuffle(1)).toThrow("Deck is not empty");
  });
});

