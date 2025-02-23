import { Blackjack } from "@/lib/blackjack";
import { Player } from "@/lib/player";
import { useRef, useState } from "react";

const blackjack = new Blackjack({ shoeSize: 1 });

export function useBlackjack() {
  const blackjackRef = useRef<Blackjack>(blackjack);

  const [gameState, setGameState] = useState({
    dealer: blackjackRef.current.dealer,
    player: blackjackRef.current.player,
  });

  function updateSnapshot() {
    setGameState({
      dealer: blackjackRef.current.dealer,
      player: blackjackRef.current.player,
    });
  }

  function deal() {
    blackjackRef.current.deal();
    updateSnapshot();
  }

  function hit(player: Player) {
    blackjackRef.current.hit(player);
    updateSnapshot();
  }

  function stand(player: Player, i = 0) {
    blackjackRef.current.stand(player, i);
    updateSnapshot();
  }

  function split(player: Player) {
    blackjackRef.current.split(player);
    updateSnapshot();
  }

  function reveal() {
    blackjackRef.current.reveal();
    updateSnapshot();
  }

  function decide() {
    if (blackjackRef.current.dealer.isDone) {
      blackjackRef.current.judge();
    } else {
      blackjackRef.current.decide();
    }
    updateSnapshot();
  }

  function exit() {
    blackjackRef.current.reset();
    updateSnapshot();
  }

  function restart() {
    console.clear();
    blackjackRef.current.reset();
    blackjackRef.current.deal();
    updateSnapshot();
  }

  return {
    dealer: gameState.dealer,
    player: gameState.player,
    isDealt: blackjackRef.current.hasDealt,
    isRevealed: blackjackRef.current.isRevealed,
    isGameover: blackjackRef.current.isGameover,
    state: blackjackRef.current.state,
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

