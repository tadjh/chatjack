import { Blackjack } from "@/lib/blackjack";
import { Player } from "@/lib/player";
import { useRef, useState } from "react";

export function useBlackjack(deckCount = 1) {
  const blackjack = useRef(new Blackjack(deckCount));
  const [gameState, setGameState] = useState({
    dealer: blackjack.current.dealer,
    player: blackjack.current.player,
  });

  function updateSnapshot() {
    setGameState({
      dealer: blackjack.current.dealer,
      player: blackjack.current.player,
    });
  }

  function deal() {
    blackjack.current.deal();
    updateSnapshot();
  }

  function hit(player: Player) {
    blackjack.current.hit(player);
    updateSnapshot();
  }

  function stand(player: Player, i = 0) {
    blackjack.current.stand(player, i);
    updateSnapshot();
  }

  function split(player: Player) {
    blackjack.current.split(player);
    updateSnapshot();
  }

  function reveal() {
    blackjack.current.reveal();
    updateSnapshot();
  }

  function decide() {
    if (blackjack.current.dealer.isDone) {
      blackjack.current.judge();
    } else {
      blackjack.current.decide();
    }
    updateSnapshot();
  }

  function exit() {
    blackjack.current.reset();
    updateSnapshot();
  }

  function restart() {
    blackjack.current.reset();
    blackjack.current.deal();
    updateSnapshot();
  }

  return {
    dealer: gameState.dealer,
    player: gameState.player,
    isDealt: blackjack.current.hasDealt,
    isRevealed: blackjack.current.isRevealed,
    isGameover: blackjack.current.isGameover,
    state: blackjack.current.state,
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

