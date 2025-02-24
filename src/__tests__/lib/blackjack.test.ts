import { Blackjack } from "@/lib/blackjack";
import { Card } from "@/lib/card";
import { fixedDecks } from "@/lib/deck";
import { State } from "@/lib/types";
import { describe, expect, it, vi, beforeEach } from "vitest";

describe("Blackjack", () => {
  let game: Blackjack;

  beforeEach(() => {
    game = new Blackjack();
  });

  it("should create a Blackjack game with default values", () => {
    expect(game.numberOfPlayers).toBe(2); // Dealer + one player
    expect(game.hasDealt).toBe(false);
  });

  it("should draw a card from the deck", () => {
    const initialRemaining = game.cardsRemaining;
    const card = game.draw();
    expect(card).toBeInstanceOf(Card);
    expect(game.cardsRemaining).toBe(initialRemaining - 1);
  });

  it("should draw a card and log the correct message", () => {
    console.log = vi.fn(); // Mock console.log
    const card = game.draw();
    expect(console.log).toHaveBeenCalledWith("Card drawn:", expect.anything());
    expect(card).toBeInstanceOf(Card);
  });

  it("should throw an error if no card is drawn (deck is empty)", () => {
    console.log = vi.fn(); // Mock console.log
    game.empty(); // Empty the deck
    expect(() => game.draw()).toThrow("Card drawn: none");
  });

  it("should empty the deck", () => {
    game.empty();
    expect(game.cardsRemaining).toBe(0);
  });

  it("should deal cards to players and the dealer correctly", () => {
    // Create game with one deck and two players (dealer + two players = 3 in table).
    game.deal();

    expect(game.hasDealt).toBe(true);
    // Player should have 2 cards.
    expect(game.player.hand.length).toBe(2);
    // The dealer should also have 2 cards.
    expect(game.dealer.hand.length).toBe(2);
    // The dealer's second card should be hidden (drawn with isHidden = true).
    expect(game.dealer.hand[1].isHidden).toBe(true);
  });

  it("should throw an error if cards are dealt more than once", () => {
    game.deal();
    expect(() => game.deal()).toThrow("Game has already started");
  });

  it("should throw an error if a player hits out of turn", () => {
    game.deal();
    const player = game.player;
    game.stand(player); // Move to next player's turn
    expect(() => game.hit(player)).toThrow(`It is not ${player.name}'s turn`);
  });

  it("should throw an error if a player stands out of turn", () => {
    game.deal();
    const player = game.player;
    game.stand(player); // Move to next player's turn
    expect(() => game.stand(player)).toThrow(`It is not ${player.name}'s turn`);
  });

  it("should throw an error if a player splits out of turn", () => {
    game.deal();
    const player = game.player;
    game.stand(player); // Move to next player's turn
    expect(() => game.split(player)).toThrow(`It is not ${player.name}'s turn`);
  });
});

describe("Blackjack with Fixed Decks", () => {
  it("should result in player bust with fixed deck 'player-bust'", () => {
    const game = new Blackjack({ fixedDeck: fixedDecks["player-bust"] });
    game.deal();
    // Simulate player's turn by hitting until the hand becomes busted.
    while (!game.player.hand.isBusted) {
      game.hit(game.player);
    }
    game.reveal();
    // Judge outcome
    game.judge();
    expect(game.state).toBe(State.PlayerBust);
  });

  it("should result in dealer bust with fixed deck 'dealer-bust'", () => {
    const game = new Blackjack({ fixedDeck: fixedDecks["dealer-bust"] });
    game.deal();
    // Simulate player's turn: assume player has a strong hand and stands.
    game.stand(game.player);
    // Let the dealer play its turn.
    game.reveal();
    while (!game.dealer.isDone) {
      game.decide();
    }
    game.judge();
    expect(game.state).toBe(State.DealerBust);
  });

  it("should result in a push with fixed deck 'push'", () => {
    const game = new Blackjack({ fixedDeck: fixedDecks["push"] });
    game.deal();
    // For a push the player stands with a score equal to the dealer.
    game.stand(game.player);
    game.reveal();
    while (!game.dealer.isDone) {
      game.decide();
    }
    game.judge();
    expect(game.state).toBe(State.Push);
  });

  it("should result in a player natural blackjack with fixed deck 'natural-blackjack'", () => {
    const game = new Blackjack({ fixedDeck: fixedDecks["natural-blackjack"] });
    game.deal();
    // Player has a natural blackjack, dealer has a weak hand.
    game.reveal();
    game.judge();
    expect(game.state).toBe(State.PlayerBlackjack);
  });

  it("should result in a player blackjack with fixed deck 'player-blackjack'", () => {
    const game = new Blackjack({ fixedDeck: fixedDecks["player-blackjack"] });
    game.deal();
    // Simulate player's turn by hitting until the hand becomes blackjack.
    while (!game.player.hand.isBlackjack) {
      game.hit(game.player);
    }
    game.reveal();
    game.judge();
    expect(game.state).toBe(State.PlayerBlackjack);
  });

  it("should result in a dealer blackjack with fixed deck 'dealer-blackjack'", () => {
    const game = new Blackjack({ fixedDeck: fixedDecks["dealer-blackjack"] });
    game.deal();
    // Simulate player's turn: assume player has a strong hand and stands.
    game.stand(game.player);
    game.reveal();
    while (!game.dealer.isDone) {
      game.decide();
    }
    game.judge();
    expect(game.state).toBe(State.DealerBlackjack);
  });

  it("should result in a player win with fixed deck 'player-win'", () => {
    const game = new Blackjack({ fixedDeck: fixedDecks["player-win"] });
    game.deal();
    // Simulate player's turn: assume player has a strong hand and stands.
    game.stand(game.player);
    game.reveal();
    while (!game.dealer.isDone) {
      game.decide();
    }
    game.judge();
    expect(game.state).toBe(State.PlayerWin);
  });

  it("should result in a dealer win with fixed deck 'dealer-win'", () => {
    const game = new Blackjack({ fixedDeck: fixedDecks["dealer-win"] });
    game.deal();
    // Simulate player's turn: assume player has a strong hand and stands.
    game.stand(game.player);
    game.reveal();
    while (!game.dealer.isDone) {
      game.decide();
    }
    game.judge();
    expect(game.state).toBe(State.DealerWin);
  });
});

