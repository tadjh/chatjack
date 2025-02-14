import { Button } from "@/components/ui/button";
import { useBlackjack } from "@/hooks/use-blackjack";

function App() {
  const {
    dealer,
    players,
    isDealt,
    playerTurn,
    isDealerTurn,
    deal,
    reset,
    hit,
    stand,
    play,
  } = useBlackjack();

  return (
    <div className="p-4 grid gap-2">
      <div>ChatJack</div>
      <div className="flex gap-2">
        <Button onClick={deal} disabled={isDealt}>
          Deal
        </Button>
        <Button onClick={reset} disabled={!isDealt}>
          Reset
        </Button>
      </div>
      <div className="flex gap-2 border p-2 items-center">
        <Button onClick={play} disabled={!isDealerTurn}>
          Play
        </Button>
        <div>
          <div>Dealer</div>
          <div>
            {`Score: ${dealer.hand.score} `}
            {dealer.hand.map((card) => card.abbr).join(" ")}
          </div>
        </div>
      </div>
      {players.map((player, p) => (
        <div key={player.name} className="grid gap-2 border p-2">
          <div>{player.name}</div>
          <div className="flex gap-4">
            {player.hands.map((hand, h) => (
              <div key={h} className="grid gap-2">
                <p className="h-5 text-center">
                  {hand.map((card) => card.abbr).join(" ")}
                </p>
                <p className="text-center min-w-18">{`Score: ${hand.score}`}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => hit(player, h)}
                    disabled={playerTurn !== p || hand.isBust || hand.isStand}
                  >
                    Hit
                  </Button>
                  {/* <Button
                    onClick={() => split(player)}
                    disabled={playerTurn !== p || hand.length !== 2}
                  >
                    Split
                  </Button> */}
                  <Button
                    disabled={playerTurn !== p || hand.isBust || hand.isStand}
                    onClick={() => stand(player, h)}
                  >
                    Stand
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;

