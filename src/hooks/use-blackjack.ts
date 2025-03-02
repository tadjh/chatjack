import { Blackjack, BlackjackOptions } from "@/lib/game/blackjack";
import { Dealer } from "@/lib/game/dealer";
import { Player } from "@/lib/game/player";
import { COMMAND, STATE } from "@/lib/types";
import { useRef, useState } from "react";

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
  options: BlackjackOptions
): UseBlackjackReturnType {
  const blackjackRef = useRef(Blackjack.create(options));

  const blackjack = blackjackRef.current;

  const [gameState, setGameState] = useState({
    dealer: blackjack.dealer,
    player: blackjack.player,
  });

  function updateSnapshot() {
    setGameState({
      dealer: blackjack.dealer,
      player: blackjack.player,
    });
  }

  function deal() {
    blackjack.handleDeal();
    updateSnapshot();
  }

  function hit() {
    blackjack.handlePlayerAction(COMMAND.HIT);
    updateSnapshot();
  }

  function stand() {
    blackjack.handlePlayerAction(COMMAND.STAND);
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
    blackjack.reset();
    updateSnapshot();
  }

  function restart() {
    console.clear();
    blackjack.reset();
    blackjack.handleDeal();
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

