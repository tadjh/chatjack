import { Engine } from "@/lib/canvas/engine";
import { Blackjack, BlackjackOptions } from "@/lib/game/blackjack";
import { Player } from "@/lib/game/player";
import { useRef, useState } from "react";

export function useBlackjack(engine: Engine, options: BlackjackOptions) {
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
    engine.event({
      dealer: blackjack.dealer,
      player: blackjack.player,
      state: blackjack.state,
      isGameover: blackjack.isGameover,
    });
  }

  function deal() {
    blackjack.deal();
    updateSnapshot();
  }

  function hit(player: Player) {
    blackjack.hit(player);
    updateSnapshot();
  }

  function stand(player: Player, i = 0) {
    blackjack.stand(player, i);
    updateSnapshot();
  }

  function split(player: Player) {
    blackjack.split(player);
    updateSnapshot();
  }

  function reveal() {
    blackjack.reveal();
    updateSnapshot();
  }

  function decide() {
    if (blackjack.dealer.isDone) {
      blackjack.judge();
    } else {
      blackjack.decide();
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
    blackjack.deal();
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
    split,
    reveal,
    decide,
    exit,
    restart,
  };
}

