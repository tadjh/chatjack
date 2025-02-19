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

  function dealerTurn() {
    blackjack.current.dealerTurn();
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
    players: gameState.players,
    isDealt: blackjack.current.hasDealt,
    isDealerTurn: blackjack.current.isDealerTurn,
    isGameover: blackjack.current.isGameover,
    allPlayersDone: blackjack.current.allPlayersDone,
    playerTurn: blackjack.current.playerTurn,
    state: blackjack.current.state,
    deal,
    hit,
    stand,
    split,
    reveal,
    dealerTurn,
    exit,
    restart,
  };
}

