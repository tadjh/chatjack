import { Blackjack } from "@/lib/blackjack";
import { Card } from "@/lib/card";
import { Deck } from "@/lib/deck";

describe("Blackjack", () => {
  let blackjack: Blackjack;

  beforeEach(() => {
    blackjack = new Blackjack();
  });

  test("should create a Blackjack game with default values", () => {
    const game = new Blackjack();
    expect(game.deck).toBeInstanceOf(Deck);
    expect(game.table.length).toBe(2); // One dealer & one player by default
    expect(game.isDealt).toBe(false);
  });

  test("should draw a card from the deck", () => {
    const game = new Blackjack();
    const card = game.draw();
    expect(card).toBeInstanceOf(Card);
    expect(game.deck.length).toBe(51);
  });

  it("should draw a card and log the correct message", () => {
    console.log = jest.fn(); // Mock console.log
    const card = blackjack.draw();
    expect(console.log).toHaveBeenCalledWith("Card drawn:", expect.anything());
    expect(card).toBeInstanceOf(Card);
  });

  it("should log 'none' if no card is drawn", () => {
    console.log = jest.fn(); // Mock console.log
    blackjack.empty(); // Empty the deck
    expect(() => blackjack.draw()).toThrow("Card drawn: none");
  });

  test("should empty the deck", () => {
    const game = new Blackjack();
    game.empty();
    expect(game.deck.length).toBe(0);
  });

  test("should deal cards to players", () => {
    const game = new Blackjack(1, 2); // One deck, two players
    game.deal();
    expect(game.isDealt).toBe(true);
    game.players.forEach((player) => {
      expect(player.hand.length).toBe(2);
    });
  });

  test("should throw an error if cards are dealt more than once", () => {
    const game = new Blackjack();
    game.deal();
    expect(() => game.deal()).toThrow("Cards have already been dealt");
  });

  test("should deal a second face down card to each player except the dealer", () => {
    const game = new Blackjack(1, 2); // One deck, two players
    game.deal();
    game.table.forEach((player) => {
      if (!player.isDealer) {
        expect(player.hand[1].isHidden).toBe(true);
      }
    });
  });
});

