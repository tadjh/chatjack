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

  function stand(player: Player, i = 0) {
    player.stand(i);
    updateSnapshot();
  }

  function split(player: Player) {
    blackjack.current.split(player);
    updateSnapshot();
  }

  function dealerTurn() {
    blackjack.current.dealerTurn();
    updateSnapshot();
  }

  function reset() {
    blackjack.current.reset();
    updateSnapshot();
  }

  return {
    dealer: gameState.dealer,
    players: gameState.players,
    isDealt: blackjack.current.isDealt,
    isDealerTurn: blackjack.current.isDealerTurn,
    playerTurn: blackjack.current.playerTurn,
    state: blackjack.current.state,
    deal,
    hit,
    stand,
    split,
    dealerTurn,
    reset,
  };
}

