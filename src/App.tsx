import { useBlackjack } from "./hooks/use-blackjack";

function App() {
  const { dealer, players, deal, hit, split, play } = useBlackjack();

  return (
    <>
      <h1>ChatJack</h1>
      <div>
        <button onClick={deal}>Deal</button>
        <div>
          <h2>Dealer</h2>
          <p>{dealer.hand.map((card) => card.abbr).join(" ")}</p>
          <p>{`Score: ${dealer.hand.score}`}</p>
          <button onClick={play}>Hit</button>
        </div>
        {players.map((player) => (
          <div key={player.name}>
            <h2>{player.name}</h2>
            <div className="flex">
              {player.hands.map((hand, i) => (
                <div key={i}>
                  <p>{hand.map((card) => card.abbr).join(" ")}</p>
                  <p>{`Score: ${hand.score}`}</p>
                  <button onClick={() => hit(player, i)}>Hit</button>
                </div>
              ))}
            </div>
            <button onClick={() => split(player)}>Split</button>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;

