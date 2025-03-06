import { Blackjack, BlackjackOptions } from "@/lib/game/blackjack";
import { Dealer } from "@/lib/game/dealer";
import { Player } from "@/lib/game/player";
import { COMMAND, EVENT, STATE } from "@/lib/types";
import { useRef, useState, useEffect } from "react";
import { EventBus } from "@/lib/event-bus";

export interface UseBlackjackReturnType {
  dealer: Dealer;
  player: Player;
  hasDealt: boolean;
  isRevealed: boolean;
  isGameover: boolean;
  isPlayerDone: boolean;
  state: STATE;
  deal: () => void;
  hit: () => void;
  stand: () => void;
  // split: () => void;
  reveal: () => void;
  decide: () => void;
  exit: () => void;
  restart: () => void;
}

export function useBlackjack(
  options: BlackjackOptions,
  eventBus: EventBus,
): UseBlackjackReturnType {
  const blackjackRef = useRef(Blackjack.create(options, eventBus));
  const blackjack = blackjackRef.current;

  const [gameState, setGameState] = useState({
    dealer: blackjack.dealer,
    player: blackjack.player,
  });

  // Add a state update effect that runs when events occur
  useEffect(() => {
    const blackjack = blackjackRef.current;

    // Function to update the state from the blackjack instance
    const updateFromInstance = () => {
      setGameState({
        dealer: blackjack.dealer,
        player: blackjack.player,
      });
    };

    // Subscribe to events that should trigger state updates
    const unsubscribeMediator = eventBus.subscribe(
      "mediator",
      updateFromInstance,
      "useBlackjack",
    );
    const unsubscribeGamestate = eventBus.subscribe(
      "gamestate",
      updateFromInstance,
      "useBlackjack",
    );
    const unsubscribeChat = eventBus.subscribe(
      "chat",
      updateFromInstance,
      "useBlackjack",
    );

    // Clean up subscriptions when the hook unmounts
    return () => {
      unsubscribeMediator();
      unsubscribeGamestate();
      unsubscribeChat();
    };
  }, []);

  function updateSnapshot() {
    setGameState({
      dealer: blackjack.dealer,
      player: blackjack.player,
    });
  }

  function deal() {
    blackjack.handleStart();
    updateSnapshot();
  }

  function hit() {
    blackjack.handlePlayerAction({
      type: EVENT.VOTE_END,
      data: { command: COMMAND.HIT },
    });
    updateSnapshot();
  }

  function stand() {
    blackjack.handlePlayerAction({
      type: EVENT.VOTE_END,
      data: { command: COMMAND.STAND },
    });
    updateSnapshot();
  }

  // function split() {
  //   blackjack.handlePlayerTurn(COMMAND.SPLIT);
  //   updateSnapshot();
  // }

  function reveal() {
    blackjack.handleDealerAction();
    updateSnapshot();
  }

  function decide() {
    if (blackjack.dealer.isDone) {
      blackjack.handleJudge();
    } else {
      blackjack.handleDealerAction();
    }
    updateSnapshot();
  }

  function exit() {
    blackjack.handleStop();
    updateSnapshot();
  }

  function restart() {
    // console.clear();
    blackjack.handleStart();
    updateSnapshot();
  }

  return {
    dealer: gameState.dealer,
    player: gameState.player,
    hasDealt: blackjack.hasDealt,
    isRevealed: blackjack.isRevealed,
    isGameover: blackjack.isGameover,
    isPlayerDone: blackjack.isPlayerDone,
    state: blackjack.state,
    deal,
    hit,
    stand,
    // split,
    reveal,
    decide,
    exit,
    restart,
  };
}
