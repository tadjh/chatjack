import { Button } from "@/components/ui/button";
import { useBlackjack } from "@/hooks/use-blackjack";
import { useRenderer } from "@/hooks/use-renderer";
import { useRef } from "react";

function App() {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<HTMLCanvasElement>(null);
  const uiRef = useRef<HTMLCanvasElement>(null);
  const {
    dealer,
    player,
    isDealt,
    isRevealed,
    isGameover,
    state,
    deal,
    hit,
    stand,
    reveal,
    decide,
    restart,
    exit,
  } = useBlackjack();
  useRenderer(bgRef, gameRef, uiRef, dealer, player, state, isGameover);

  return (
    <>
      <canvas
        ref={bgRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="fixed top-0 left-0 z-1"
        style={{ width: window.innerWidth, height: window.innerHeight }}
      />
      <canvas
        ref={gameRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="fixed top-0 left-0 z-2"
        style={{ width: window.innerWidth, height: window.innerHeight }}
      />
      <canvas
        ref={uiRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="fixed top-0 left-0 z-3"
        style={{ width: window.innerWidth, height: window.innerHeight }}
      />
      <div className="p-4 flex gap-2 flex-col justify-between h-full absolute top-1/2 -translate-y-1/2 right-0 z-10">
        <div className="grid gap-2">
          <div className="flex gap-2">
            <Button onClick={restart} disabled={!isDealt}>
              Restart
            </Button>
            <Button onClick={exit} disabled={!isDealt}>
              X
            </Button>
          </div>
          <div className="flex gap-2 border p-2 items-center">
            {!isDealt ? (
              <Button onClick={deal}>Deal</Button>
            ) : isRevealed ? (
              <Button onClick={decide} disabled={isGameover}>
                Next
              </Button>
            ) : (
              <Button onClick={reveal} disabled={!player.isDone}>
                Reveal
              </Button>
            )}
            <div>
              <div>Dealer</div>
              <div>
                {`Score: ${dealer.score} `}
                {dealer.hand.map((card) => card.icon).join(" ")}
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-2 border p-2">
          <div>{player.name}</div>
          <div className="flex gap-4">
            {player.hands.map((hand, h) => (
              <div key={h} className="grid gap-2">
                <p className="h-5 text-center">
                  {hand.map((card) => card.icon).join(" ")}
                </p>
                <p className="text-center min-w-18">{`Score: ${hand.score}`}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => hit(player)}
                    disabled={!isDealt || hand.isBusted || hand.isStand}
                  >
                    Hit
                  </Button>
                  <Button
                    disabled={!isDealt || hand.isBusted || hand.isStand}
                    onClick={() => stand(player, h)}
                  >
                    Stand
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;

