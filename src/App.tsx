import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Blackjack } from "./lib/blackjack";
import { useState } from "react";
import { Dealer } from "./lib/dealer";
import { Player } from "./lib/player";

const blackjack = new Blackjack();

function App() {
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [players, setPlayers] = useState<Player[] | null>(null);
  function dealCards() {
    const [dHands, pHands] = blackjack.deal();
    setDealer(dHands);
    setPlayers(pHands);
  }

  console.log("hands", blackjack.players[0].hand, blackjack.dealer.hand);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={dealCards}>Deal Card</button>
        {dealer && dealer.hand.length > 0 && (
          <div>
            <h2>Dealer</h2>
            <p>{blackjack.dealer.hand.map((card) => card.abbr()).join(", ")}</p>
          </div>
        )}
        {players &&
          players.map((player) => (
            <div key={player.name}>
              <h2>{player.name}</h2>
              <p>{player.hand.map((card) => card.abbr()).join(", ")}</p>
            </div>
          ))}
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;

