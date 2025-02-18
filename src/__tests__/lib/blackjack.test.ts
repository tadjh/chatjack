import { Blackjack } from "@/lib/blackjack";
import { Card } from "@/lib/card";
import { describe, expect, it, vi, beforeEach } from "vitest";

describe("Blackjack", () => {
  let blackjack: Blackjack;

  beforeEach(() => {
    blackjack = new Blackjack();
  });

  it("should create a Blackjack game with default values", () => {
    // With default parameters (deckCount = 1, playerCount = 1)
    // we expect one dealer and one player.
    const game = new Blackjack();
    expect(game.table.length).toBe(2); // Dealer + one player
    expect(game.hasDealt).toBe(false);
  });

  it("should draw a card from the deck", () => {
    const game = new Blackjack();
    const initialRemaining = game.remaining;
    const card = game.draw();
    expect(card).toBeInstanceOf(Card);
    expect(game.remaining).toBe(initialRemaining - 1);
  });

  it("should draw a card and log the correct message", () => {
    console.log = vi.fn(); // Mock console.log
    const card = blackjack.draw();
    expect(console.log).toHaveBeenCalledWith("Card drawn:", expect.anything());
    expect(card).toBeInstanceOf(Card);
  });

  it("should throw an error if no card is drawn (deck is empty)", () => {
    console.log = vi.fn(); // Mock console.log
    blackjack.empty(); // Empty the deck
    expect(() => blackjack.draw()).toThrow("Card drawn: none");
  });

  it("should empty the deck", () => {
    const game = new Blackjack();
    game.empty();
    expect(game.remaining).toBe(0);
  });

  it("should deal cards to players and the dealer correctly", () => {
    // Create game with one deck and two players (dealer + two players = 3 in table).
    const game = new Blackjack(1, 2);
    game.deal();

    expect(game.hasDealt).toBe(true);
    // Each player should have 2 cards.
    game.players.forEach((player) => {
      expect(player.hand.length).toBe(2);
    });
    // The dealer should also have 2 cards.
    expect(game.dealer.hand.length).toBe(2);
    // The dealer's second card should be hidden (drawn with isHidden = true).
    expect(game.dealer.hand[1].isHidden).toBe(true);
  });

  it("should throw an error if cards are dealt more than once", () => {
    const game = new Blackjack();
    game.deal();
    expect(() => game.deal()).toThrow("Game has already started");
  });
});

