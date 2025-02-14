import { Deck } from "@/lib/deck";
import { Card, Rank, Suit } from "@/lib/card";

describe("Deck", () => {
  test("should create a deck with a valid count", () => {
    const deck = new Deck(1);
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
    expect(deck).not.toEqual(originalOrder);
  });

  test("should draw a card from the deck", () => {
    const deck = new Deck(1);
    const card = deck.draw();
    expect(card).toBeInstanceOf(Card);
    expect(deck.length).toBe(51);
  });

  test("should peek the top card of the deck", () => {
    const deck = new Deck(1);
    const topCard = deck.peek();
    expect(topCard).toBeInstanceOf(Card);
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

  test("should add a card to the deck", () => {
    const deck = new Deck(1);
    const card = new Card(Suit.Clubs + Rank.Ace);
    deck.push(card);
    expect(deck.length).toBe(53);
  });

  test.skip("should print the deck", () => {
    const deck = new Deck(1);
    console.log = jest.fn();
    deck.print();
    expect(console.log).toHaveBeenCalled();
  });
});

