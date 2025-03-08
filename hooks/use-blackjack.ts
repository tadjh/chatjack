import { Blackjack, BlackjackOptions } from "@/lib/game/blackjack";
import { Dealer } from "@/lib/game/dealer";
import { Player } from "@/lib/game/player";
import { COMMAND, EVENT, STATE } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

export interface UseBlackjackReturnType {
  dealer: Dealer | null;
  player: Player | null;
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
): UseBlackjackReturnType {
  const blackjackRef = useRef<Blackjack | null>(null);
  const [gameState, setGameState] = useState<{
    dealer: Dealer | null;
    player: Player | null;
  }>({
    dealer: null,
    player: null,
  });

  useEffect(() => {
    if (!blackjackRef.current) {
      blackjackRef.current = Blackjack.create(options);
    }

    const blackjack = blackjackRef.current;

    const updateFromInstance = () => {
      setGameState({
        dealer: blackjack.dealer,
        player: blackjack.player,
      });
    };

    const unsubscribeMediator = blackjack.eventBus.subscribe(
      "mediator",
      updateFromInstance,
      "useBlackjack",
    );
    const unsubscribeGamestate = blackjack.eventBus.subscribe(
      "gamestate",
      updateFromInstance,
      "useBlackjack",
    );
    const unsubscribeChat = blackjack.eventBus.subscribe(
      "chat",
      updateFromInstance,
      "useBlackjack",
    );

    return () => {
      if (blackjackRef.current) {
        unsubscribeMediator();
        unsubscribeGamestate();
        unsubscribeChat();
        blackjackRef.current.teardown();
        blackjackRef.current = null;
      }
    };
  }, [options]);

  function updateSnapshot() {
    if (!blackjackRef.current) return;
    setGameState({
      dealer: blackjackRef.current.dealer,
      player: blackjackRef.current.player,
    });
  }

  function deal() {
    blackjackRef.current?.handleStart();
    updateSnapshot();
  }

  function hit() {
    blackjackRef.current?.handlePlayerAction({
      type: EVENT.VOTE_END,
      data: { command: COMMAND.HIT },
    });
    updateSnapshot();
  }

  function stand() {
    blackjackRef.current?.handlePlayerAction({
      type: EVENT.VOTE_END,
      data: { command: COMMAND.STAND },
    });
    updateSnapshot();
  }

  // function split() {
  //   blackjackRef.current?.handlePlayerTurn(COMMAND.SPLIT);
  //   updateSnapshot();
  // }

  function reveal() {
    blackjackRef.current?.handleDealerAction();
    updateSnapshot();
  }

  function decide() {
    if (blackjackRef.current?.dealer.isDone) {
      blackjackRef.current?.handleJudge();
    } else {
      blackjackRef.current?.handleDealerAction();
    }
    updateSnapshot();
  }

  function exit() {
    blackjackRef.current?.handleStop();
    updateSnapshot();
  }

  function restart() {
    blackjackRef.current?.handleStart();
    updateSnapshot();
  }

  return {
    dealer: gameState.dealer,
    player: gameState.player,
    hasDealt: blackjackRef.current?.hasDealt || false,
    isRevealed: blackjackRef.current?.isRevealed || false,
    isGameover: blackjackRef.current?.isGameover || false,
    isPlayerDone: blackjackRef.current?.isPlayerDone || false,
    state: blackjackRef.current?.state || STATE.INIT,
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
