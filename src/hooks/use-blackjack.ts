import { Blackjack, BlackjackOptions } from "@/lib/game/blackjack";
import { COMMAND } from "@/lib/types";
import { useRef, useState } from "react";

export function useBlackjack(options: BlackjackOptions) {
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

