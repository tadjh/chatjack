import { Blackjack } from "@/lib/game/blackjack";
import { Card } from "@/lib/game/card";
import { STATE } from "@/lib/types";
import { COMMAND, EVENT } from "@/lib/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eventBus } from "@/lib/event-bus";

describe("Blackjack", () => {
  let game: Blackjack;

  beforeEach(() => {
    // Create a new instance for each test to avoid state leakage
    // Reset by creating and destroying
    if (Blackjack.create()) {
      Blackjack.create().destroy();
    }
    game = Blackjack.create();
    game.reset();
  });

  afterEach(() => {
    // Clean up after each test
    game.destroy();
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
    expect(() => game.hit(player)).toThrow(`${player.name}'s turn is over`);
  });

  it("should throw an error if a player stands out of turn", () => {
    game.deal();
    const player = game.player;
    game.stand(player); // Move to next player's turn
    expect(() => game.stand(player)).toThrow(`${player.name}'s turn is over`);
  });

  it("should throw an error if a player splits out of turn", () => {
    game.deal();
    const player = game.player;
    game.stand(player); // Move to next player's turn
    expect(() => game.split(player)).toThrow(`${player.name}'s turn is over`);
  });

  it("should properly destroy the game instance", () => {
    // Mock the eventBus
    const unsubscribeSpy = vi.spyOn(eventBus, "unsubscribe");

    // Destroy the instance
    game.destroy();

    // Check that all event handlers were unsubscribed (4 events)
    expect(unsubscribeSpy).toHaveBeenCalledTimes(4);

    // Create a new game to verify the singleton was reset
    const newGame = Blackjack.create();
    expect(newGame).not.toBe(game);
  });
});

describe("Blackjack with Fixed Decks", () => {
  beforeEach(() => {
    // Reset the singleton instance before each test
    if (Blackjack.create()) {
      Blackjack.create().destroy();
    }
  });

  afterEach(() => {
    // Get the current instance and destroy it
    const game = Blackjack.create();
    game.destroy();
  });

  it("should result in player bust with fixed deck 'player-bust'", () => {
    const game = Blackjack.create({ fixedDeck: "player-bust" });
    game.deal();
    // Simulate player's turn by hitting until the hand becomes busted.
    while (!game.player.hand.isBusted) {
      game.hit(game.player);
    }
    game.reveal();
    // Judge outcome
    game.judge();
    expect(game.state).toBe(STATE.PLAYER_BUST);
  });

  it("should result in dealer bust with fixed deck 'dealer-bust'", () => {
    const game = Blackjack.create({ fixedDeck: "dealer-bust" });
    game.deal();
    // Simulate player's turn: assume player has a strong hand and stands.
    game.stand(game.player);
    // Let the dealer play its turn.
    game.reveal();
    while (!game.dealer.isDone) {
      game.decide();
    }
    game.judge();
    expect(game.state).toBe(STATE.DEALER_BUST);
  });

  it("should result in a push with fixed deck 'push'", () => {
    const game = Blackjack.create({ fixedDeck: "push" });
    game.deal();
    // For a push the player stands with a score equal to the dealer.
    game.stand(game.player);
    game.reveal();
    while (!game.dealer.isDone) {
      game.decide();
    }
    game.judge();
    expect(game.state).toBe(STATE.PUSH);
  });

  it("should result in a player natural blackjack with fixed deck 'natural-blackjack'", () => {
    const game = Blackjack.create({ fixedDeck: "natural-blackjack" });
    game.deal();
    // Player has a natural blackjack, dealer has a weak hand.
    game.reveal();
    game.judge();
    expect(game.state).toBe(STATE.PLAYER_BLACKJACK);
  });

  it("should result in a player blackjack with fixed deck 'player-blackjack'", () => {
    const game = Blackjack.create({ fixedDeck: "player-blackjack" });
    game.deal();
    // Simulate player's turn by hitting until the hand becomes blackjack.
    while (!game.player.hand.isBlackjack) {
      game.hit(game.player);
    }
    game.reveal();
    game.judge();
    expect(game.state).toBe(STATE.PLAYER_BLACKJACK);
  });

  it("should result in a dealer blackjack with fixed deck 'dealer-blackjack'", () => {
    const game = Blackjack.create({ fixedDeck: "dealer-blackjack" });
    game.deal();
    // Simulate player's turn: assume player has a strong hand and stands.
    game.stand(game.player);
    game.reveal();
    while (!game.dealer.isDone) {
      game.decide();
    }
    game.judge();
    expect(game.state).toBe(STATE.DEALER_BLACKJACK);
  });

  it("should result in a player win with fixed deck 'player-win'", () => {
    const game = Blackjack.create({ fixedDeck: "player-win" });
    game.deal();
    // Simulate player's turn: assume player has a strong hand and stands.
    game.stand(game.player);
    game.reveal();
    while (!game.dealer.isDone) {
      game.decide();
    }
    game.judge();
    expect(game.state).toBe(STATE.PLAYER_WIN);
  });

  it("should result in a dealer win with fixed deck 'dealer-win'", () => {
    const game = Blackjack.create({ fixedDeck: "dealer-win" });
    game.deal();
    // Simulate player's turn: assume player has a strong hand and stands.
    game.stand(game.player);
    game.reveal();
    while (!game.dealer.isDone) {
      game.decide();
    }
    game.judge();
    expect(game.state).toBe(STATE.DEALER_WIN);
  });
});

describe("Blackjack Event Handlers", () => {
  let game: Blackjack;

  beforeEach(() => {
    // Reset by creating and destroying
    if (Blackjack.create()) {
      Blackjack.create().destroy();
    }
    game = Blackjack.create();
    // Mock the eventBus emit method
    vi.spyOn(eventBus, "emit").mockImplementation(() => {});
  });

  afterEach(() => {
    game.destroy();
    vi.restoreAllMocks();
  });

  it("should handle game start correctly", () => {
    // Spy on reset and deal methods
    const resetSpy = vi.spyOn(game, "reset");
    const dealSpy = vi.spyOn(game, "deal");

    // Call the handler
    game.handleStart();

    // Verify the game was reset and cards were dealt
    expect(resetSpy).toHaveBeenCalledTimes(1);
    expect(dealSpy).toHaveBeenCalledTimes(1);

    // Verify the event was emitted with correct data
    expect(eventBus.emit).toHaveBeenCalledWith("gamestate", {
      type: EVENT.DEALING,
      data: {
        dealer: game.dealer,
        player: game.player,
      },
    });
  });

  it("should handle player hit action correctly", () => {
    // Setup the game
    game.deal();

    // Spy on hit method
    const hitSpy = vi.spyOn(game, "hit");

    // Call the handler with HIT command
    game.handlePlayerAction(COMMAND.HIT);

    // Verify hit was called with the player
    expect(hitSpy).toHaveBeenCalledWith(game.player, 0, expect.any(Function));

    // Verify the event was emitted with correct data
    expect(eventBus.emit).toHaveBeenCalledWith(
      "gamestate",
      expect.objectContaining({
        type: EVENT.PLAYER_ACTION,
        data: expect.objectContaining({
          player: game.player,
        }),
      })
    );
  });

  it("should handle player stand action correctly", () => {
    // Setup the game
    game.deal();

    // Spy on stand method
    const standSpy = vi.spyOn(game, "stand");

    // Call the handler with STAND command
    game.handlePlayerAction(COMMAND.STAND);

    // Verify stand was called with the player
    expect(standSpy).toHaveBeenCalledWith(game.player, 0, expect.any(Function));

    // Verify the event was emitted with correct data
    expect(eventBus.emit).toHaveBeenCalledWith(
      "gamestate",
      expect.objectContaining({
        type: EVENT.PLAYER_ACTION,
        data: expect.objectContaining({
          player: game.player,
        }),
      })
    );
  });

  it("should handle dealer action when hole card is not revealed", () => {
    // Setup the game
    game.deal();

    // Spy on reveal method
    const revealSpy = vi.spyOn(game, "reveal");

    // Call the handler
    game.handleDealerAction();

    // Verify reveal was called
    expect(revealSpy).toHaveBeenCalledTimes(1);

    // Verify the event was emitted with correct data
    expect(eventBus.emit).toHaveBeenCalledWith("gamestate", {
      type: EVENT.REVEAL_HOLE_CARD,
      data: {
        dealer: game.dealer,
      },
    });
  });

  it("should handle dealer action when hole card is already revealed", () => {
    // Setup the game
    game.deal();
    game.reveal(); // Reveal the hole card first

    // Spy on decide method
    const decideSpy = vi.spyOn(game, "decide");

    // Reset the emit mock to clear previous calls
    vi.mocked(eventBus.emit).mockClear();

    // Call the handler
    game.handleDealerAction();

    // Verify decide was called
    expect(decideSpy).toHaveBeenCalledTimes(1);

    // Verify the event was emitted with correct data
    expect(eventBus.emit).toHaveBeenCalledWith("gamestate", {
      type: EVENT.DEALER_ACTION,
      data: {
        dealer: game.dealer,
        state: game.state,
      },
    });
  });

  it("should handle judge action correctly", () => {
    // Setup the game
    game.deal();

    // Spy on judge method
    const judgeSpy = vi.spyOn(game, "judge");

    // Call the handler
    game.handleJudge();

    // Verify judge was called
    expect(judgeSpy).toHaveBeenCalledTimes(1);

    // Verify the event was emitted with correct data
    expect(eventBus.emit).toHaveBeenCalledWith("gamestate", {
      type: EVENT.JUDGE,
      data: {
        state: game.state,
      },
    });
  });
});

