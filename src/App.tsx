import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Card } from "./lib/card";
import { Blackjack } from "./lib/blackjack";

function App() {
  const [card, setCard] = useState<Card | null>(null);

  const blackjack = new Blackjack();

  function drawCard() {
    setCard(blackjack.draw());
  }

  console.log("Card drawn:", card);

  if (!card) {
    drawCard();
  }

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
        <button onClick={drawCard}>{`card is ${
          card !== null ? card.abbr() : "null"
        }`}</button>
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

