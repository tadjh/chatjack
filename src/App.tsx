import { Button } from "@/components/ui/button";
import { useBlackjack } from "@/hooks/use-blackjack";
import { useRef, useEffect } from "react";
import { fonts, spriteSheet } from "./lib/constants";
import { Renderer } from "./lib/renderer";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer>(null);
  const {
    dealer,
    players,
    isDealt,
    isRevealed,
    isGameover,
    playerTurn,
    allPlayersDone,
    state,
    deal,
    hit,
    stand,
    reveal,
    decide,
    restart,
    exit,
  } = useBlackjack();

  useEffect(() => {
    if (!canvasRef.current) return;

    // TODO Simplify this asset loading api.
    rendererRef.current = new Renderer(canvasRef.current);

    if (!rendererRef.current) return;

    const loadAssets = async () => {
      [...fonts.entries()].forEach(async ([name, url]) => {
        await rendererRef.current!.loadFont(name, url);
      });
      await rendererRef.current!.createSpriteSheet(spriteSheet);
    };

    loadAssets().then(() => {
      rendererRef.current!.start();
    });

    return () => {
      rendererRef.current!.stop();
    };
  }, []);

  useEffect(() => {
    if (!rendererRef.current) return;

    rendererRef.current.update({
      dealer,
      players,
      state,
      playerTurn,
      isGameover,
    });

    rendererRef.current.resizeCanvas();
  }, [dealer, players, state, playerTurn, isGameover]);

  return (
    <>
      <canvas id="canvas" ref={canvasRef}></canvas>
      {/* Debug */}
      <div className="p-4 grid gap-2 absolute top-1/2 -translate-y-1/2 right-0 z-10">
        <div className="flex gap-2">
          {isDealt ? (
            <Button onClick={restart}>Restart</Button>
          ) : (
            <Button onClick={deal}>Deal</Button>
          )}
          <Button onClick={exit} disabled={!isDealt}>
            Exit
          </Button>
        </div>
        <div className="flex gap-2 border p-2 items-center">
          {isRevealed ? (
            <Button onClick={decide} disabled={isGameover}>
              Next
            </Button>
          ) : (
            <Button onClick={reveal} disabled={!allPlayersDone}>
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
        {players.map((player) => (
          <div key={player.name} className="grid gap-2 border p-2">
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
                      disabled={
                        playerTurn !== player.seat ||
                        hand.isBusted ||
                        hand.isStand
                      }
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
                      disabled={
                        playerTurn !== player.seat ||
                        hand.isBusted ||
                        hand.isStand
                      }
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
      {/* Debug */}
    </>
  );
}

export default App;

