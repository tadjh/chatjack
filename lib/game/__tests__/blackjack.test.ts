import { Blackjack } from "@/lib/game/blackjack";
import { STATE } from "@/lib/types";
import { COMMAND, EVENT } from "@/lib/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventBus } from "@/lib/event-bus";

describe("Blackjack", () => {
  let game: Blackjack;
  let eventBus: EventBus;
  beforeEach(() => {
    // Create a new instance for each test to avoid state leakage
    // Reset by creating and destroying
    Blackjack.destroy();
    eventBus = EventBus.create();
    game = Blackjack.create();
  });

  afterEach(() => {
    // Clean up after each test
    Blackjack.destroy();
    EventBus.destroy();
  });

  it("should create a Blackjack game with default values", () => {
    expect(game.playerCount).toBe(1);
    expect(game.playerNames).toEqual([]);
    expect(game.shoeSize).toBe(1);
    expect(game.fixedDeck).toBe(null);
    expect(game.hasDealt).toBe(false);
    expect(game.isPlayerDone).toBe(false);
    expect(game.isGameover).toBe(false);
    expect(game.isRevealed).toBe(false);
    expect(game.state).toBe(STATE.INIT);
    expect(game.cardsRemaining).toBe(52);
  });

  it("should deal cards to player and the dealer correctly", () => {
    game.handleStart();

    expect(game.hasDealt).toBe(true);
    // Player should have 2 cards.
    expect(game.player.hand.length).toBe(2);
    // The dealer should also have 2 cards.
    expect(game.dealer.hand.length).toBe(2);
    // The dealer's second card should be hidden (drawn with isHidden = true).
    expect(game.dealer.hand.cards[1].isHidden).toBe(true);
  });

  it("should throw an error if a player hits out of turn", () => {
    game.handleStart();
    game.handlePlayerAction({
      type: EVENT.VOTE_END,
      data: { command: COMMAND.STAND },
    });
    const player = game.player;
    expect(() =>
      game.handlePlayerAction({
        type: EVENT.VOTE_END,
        data: { command: COMMAND.HIT },
      }),
    ).toThrow(`${player.name}'s turn is over`);
  });

  it("should throw an error if a player stands out of turn", () => {
    game.handleStart();
    const player = game.player;
    game.handlePlayerAction({
      type: EVENT.VOTE_END,
      data: { command: COMMAND.STAND },
    }); // Move to next player's turn
    expect(() =>
      game.handlePlayerAction({
        type: EVENT.VOTE_END,
        data: { command: COMMAND.STAND },
      }),
    ).toThrow(`${player.name}'s turn is over`);
  });

  it("should properly destroy the game instance", () => {
    // Mock the eventBus
    const unsubscribeSpy = vi.spyOn(eventBus, "unsubscribe");

    // Destroy the instance
    Blackjack.destroy();

    // Check that all event handlers were unsubscribed (4 events)
    expect(unsubscribeSpy).toHaveBeenCalledTimes(2);

    // Create a new game to verify the singleton was reset
    const newGame = Blackjack.create();
    expect(newGame).not.toBe(game);
  });
});

describe("Blackjack with Fixed Decks", () => {
  beforeEach(() => {
    // Reset the singleton instance before each test
    Blackjack.destroy();
  });

  afterEach(() => {
    // Get the current instance and destroy it
    Blackjack.destroy();
  });

  it("should result in player bust with fixed deck 'player-bust'", () => {
    const game = Blackjack.create({ deck: "player-bust" });
    game.handleStart();
    // Simulate player's turn by hitting until the hand becomes busted.
    while (!game.player.hand.isBusted) {
      game.handlePlayerAction({
        type: EVENT.VOTE_END,
        data: { command: COMMAND.HIT },
      });
    }
    game.handleDealerAction();
    game.handleJudge();
    expect(game.state).toBe(STATE.PLAYER_BUST);
  });

  it("should result in dealer bust with fixed deck 'dealer-bust'", () => {
    const game = Blackjack.create({ deck: "dealer-bust" });
    game.handleStart();
    // Simulate player's turn: assume player has a strong hand and stands.
    game.handlePlayerAction({
      type: EVENT.VOTE_END,
      data: { command: COMMAND.STAND },
    });
    // Let the dealer play its turn.
    game.handleDealerAction();
    while (!game.dealer.isDone) {
      game.handleDealerAction();
    }
    game.handleJudge();
    expect(game.state).toBe(STATE.DEALER_BUST);
  });

  it("should result in a push with fixed deck 'push'", () => {
    const game = Blackjack.create({ deck: "push" });
    game.handleStart();
    // For a push the player stands with a score equal to the dealer.
    game.handlePlayerAction({
      type: EVENT.VOTE_END,
      data: { command: COMMAND.STAND },
    });
    game.handleDealerAction();
    while (!game.dealer.isDone) {
      game.handleDealerAction();
    }
    game.handleJudge();
    expect(game.state).toBe(STATE.PUSH);
  });

  it("should result in a player natural blackjack with fixed deck 'natural-blackjack'", () => {
    const game = Blackjack.create({ deck: "natural-blackjack" });
    game.handleStart();
    // Player has a natural blackjack, dealer has a weak hand.
    game.handleDealerAction();
    game.handleJudge();
    expect(game.state).toBe(STATE.PLAYER_BLACKJACK);
  });

  it("should result in a player blackjack with fixed deck 'player-blackjack'", () => {
    const game = Blackjack.create({ deck: "player-blackjack" });
    game.handleStart();
    // Simulate player's turn by hitting until the hand becomes blackjack.
    while (!game.player.hand.isBlackjack) {
      game.handlePlayerAction({
        type: EVENT.VOTE_END,
        data: { command: COMMAND.HIT },
      });
    }
    game.handleDealerAction();
    game.handleJudge();
    expect(game.state).toBe(STATE.PLAYER_BLACKJACK);
  });

  it("should result in a dealer blackjack with fixed deck 'dealer-blackjack'", () => {
    const game = Blackjack.create({ deck: "dealer-blackjack" });
    game.handleStart();
    // Simulate player's turn: assume player has a strong hand and stands.
    game.handlePlayerAction({
      type: EVENT.VOTE_END,
      data: { command: COMMAND.STAND },
    });
    game.handleDealerAction();
    while (!game.dealer.isDone) {
      game.handleDealerAction();
    }
    game.handleJudge();
    expect(game.state).toBe(STATE.DEALER_BLACKJACK);
  });

  it("should result in a player win with fixed deck 'player-win'", () => {
    const game = Blackjack.create({ deck: "player-win" });
    game.handleStart();
    // Simulate player's turn: assume player has a strong hand and stands.
    game.handlePlayerAction({
      type: EVENT.VOTE_END,
      data: { command: COMMAND.STAND },
    });
    game.handleDealerAction();
    while (!game.dealer.isDone) {
      game.handleDealerAction();
    }
    game.handleJudge();
    expect(game.state).toBe(STATE.PLAYER_WIN);
  });

  it("should result in a dealer win with fixed deck 'dealer-win'", () => {
    const game = Blackjack.create({ deck: "dealer-win" });
    game.handleStart();
    // Simulate player's turn: assume player has a strong hand and stands.
    game.handlePlayerAction({
      type: EVENT.VOTE_END,
      data: { command: COMMAND.STAND },
    });
    game.handleDealerAction();
    while (!game.dealer.isDone) {
      game.handleDealerAction();
    }
    game.handleJudge();
    expect(game.state).toBe(STATE.DEALER_WIN);
  });
});

describe("Blackjack Event Handlers", () => {
  let game: Blackjack;
  let eventBus: EventBus;

  beforeEach(() => {
    // Reset by creating and destroying
    eventBus = EventBus.create();
    game = Blackjack.create(undefined, eventBus);
    // Mock the eventBus emit method
    vi.spyOn(eventBus, "emit").mockImplementation(() => {});
  });

  afterEach(() => {
    Blackjack.destroy();
    EventBus.destroy();
    vi.restoreAllMocks();
  });

  it("should handle game start correctly", () => {
    // Spy on reset and deal methods
    const resetSpy = vi.spyOn(game, "reset");
    const dealSpy = vi.spyOn(game, "handleStart");

    // Call the handler
    game.handleStart();

    // Verify the game was reset and cards were dealt
    expect(resetSpy).toHaveBeenCalledTimes(0);
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

  it("should handle game restart correctly", () => {
    // Spy on reset and deal methods
    const resetSpy = vi.spyOn(game, "reset");
    const dealSpy = vi.spyOn(game, "handleStart");

    // Call the handler
    game.handleStart();
    game.handleStart();

    // Verify the game was reset and cards were dealt
    expect(resetSpy).toHaveBeenCalledTimes(1);
    expect(dealSpy).toHaveBeenCalledTimes(2);

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
    game.handleStart();

    // Call the handler with HIT command
    game.handlePlayerAction({
      type: EVENT.VOTE_END,
      data: { command: COMMAND.HIT },
    });

    // Verify the event was emitted with correct data
    expect(eventBus.emit).toHaveBeenCalledWith("gamestate", {
      type: EVENT.PLAYER_ACTION,
      data: {
        player: game.player,
        state: game.state,
      },
    });
  });

  it("should handle player stand action correctly", () => {
    // Setup the game
    game.handleStart();

    // Call the handler with STAND command
    game.handlePlayerAction({
      type: EVENT.VOTE_END,
      data: { command: COMMAND.STAND },
    });

    // Verify the event was emitted with correct data
    expect(eventBus.emit).toHaveBeenCalledWith("gamestate", {
      type: EVENT.PLAYER_ACTION,
      data: {
        player: game.player,
        state: game.state,
      },
    });
  });

  it("should handle dealer action when hole card is not revealed", () => {
    // Setup the game
    game.handleStart();

    // Spy on reveal method
    const revealSpy = vi.spyOn(game, "handleDealerAction");

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
    game.handleStart();
    game.handleDealerAction();

    // Spy on decide method
    const decideSpy = vi.spyOn(game, "handleDealerAction");

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
    game.handleStart();

    // Spy on judge method
    const judgeSpy = vi.spyOn(game, "handleJudge");

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
