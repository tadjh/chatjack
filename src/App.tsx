import "./App.css";
import { Blackjack } from "./lib/blackjack";
import { useRef, useState } from "react";

function App() {
  const gameRef = useRef<Blackjack>(new Blackjack());
  const [, setTable] = useState<boolean>(false);
  const blackjack = gameRef.current;

  function dealCards() {
    blackjack.deal();
    setTable(true);
  }

  const { dealer, players } = blackjack;

  return (
    <>
      <h1>ChatJack</h1>
      <div className="card">
        <button onClick={dealCards}>Deal Card</button>
        <div>
          <h2>Dealer</h2>
          <p>{dealer.hand.map((card) => card.abbr).join(" ")}</p>
          <p>{`Score: ${dealer.hand.score}`}</p>
        </div>
        {players.map((player) => (
          <div key={player.name}>
            <h2>{player.name}</h2>
            {player.hands.length > 1 ? (
              player.hands.map((hand, i) => (
                <div key={i}>
                  <p>{hand.map((card) => card.abbr).join(" ")}</p>
                  <p>{`Score: ${hand.score}`}</p>
                </div>
              ))
            ) : (
              <>
                <p>{player.hand.map((card) => card.abbr).join(" ")}</p>
                <p>{`Score: ${player.hand.score}`}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default App;

