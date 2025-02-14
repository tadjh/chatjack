import { Blackjack } from "@/lib/blackjack";
import { Player } from "@/lib/player";
import { useRef, useState } from "react";

export function useBlackjack(deckCount = 1, playerCount = 1) {
  const blackjack = useRef(new Blackjack(deckCount, playerCount));
  const [gameState, setGameState] = useState({
    dealer: blackjack.current.dealer,
    players: blackjack.current.players,
  });

  function updateSnapshot() {
    setGameState({
      dealer: blackjack.current.dealer,
      players: blackjack.current.players,
    });
  }

  function deal() {
    blackjack.current.deal();
    updateSnapshot();
  }

  function hit(player: Player, i = 0) {
    blackjack.current.hit(player, i);
    updateSnapshot();
  }

  function split(player: Player) {
    blackjack.current.split(player);
    updateSnapshot();
  }

  function play() {
    blackjack.current.play();
    updateSnapshot();
  }

  return {
    blackjack: gameState,
    dealer: gameState.dealer,
    players: gameState.players,
    deal,
    hit,
    split,
    play,
  };
}

