import { Button } from "@/components/ui/button";
import { useBlackjack } from "@/hooks/use-blackjack";
import { useCanvas } from "@/hooks/use-canvas";
import { useSearchParams } from "react-router";
import { useTwitch } from "./hooks/use-twtich";
import { useMediator } from "@/hooks/use-mediator";
import { useEventBus } from "@/hooks/use-event-bus";

function App() {
  const [searchParams] = useSearchParams();
  const fixedDeck = searchParams.get("deck");
  const debug = searchParams.get("debug");
  const channel = searchParams.get("channel");
  const isDebug = debug !== null && debug !== "false";

  const { bgRef, gameRef, uiRef } = useCanvas();
  const {
    dealer,
    player,
    hasDealt,
    isRevealed,
    isGameover,
    isPlayerDone,
    deal,
    hit,
    stand,
    reveal,
    decide,
    restart,
    exit,
  } = useBlackjack({
    fixedDeck,
    playerCount: 1,
    playerNames: ["Chat"],
  });
  useTwitch({ channel: channel ?? "", voteDuration: 10, debug: isDebug });
  useMediator();
  useEventBus();

  return (
    <>
      <canvas ref={bgRef} />
      <canvas ref={gameRef} />
      <canvas ref={uiRef} />
      {isDebug && (
        <div className="p-4 flex gap-2 font-mono flex-col justify-center h-full fixed top-1/2 -translate-y-1/2 left-0 z-10">
          <div className="grid gap-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                className="cursor-pointer"
                onClick={restart}
                disabled={!hasDealt}
              >
                Restart
              </Button>
              <Button
                size="sm"
                className="cursor-pointer"
                onClick={exit}
                disabled={!hasDealt}
              >
                X
              </Button>
            </div>
            <div className="grid gap-2 items-center">
              <div className="font-bold">Dealer</div>
              <div>{`Score: ${dealer.score} `}</div>
              <div>
                Hand:{" "}
                {dealer.hand.map((card) => card.icon).join(" ") || "empty"}
              </div>
              <div>
                {!hasDealt ? (
                  <Button size="sm" className="cursor-pointer" onClick={deal}>
                    Deal
                  </Button>
                ) : !isRevealed ? (
                  <Button
                    size="sm"
                    className="cursor-pointer"
                    onClick={reveal}
                    disabled={!isPlayerDone}
                  >
                    Reveal
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="cursor-pointer"
                    onClick={decide}
                    disabled={isGameover}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <div className="font-bold">{player.name}</div>
            <div className="flex gap-4">
              {player.hands.map((hand, h) => (
                <div key={h} className="grid gap-2">
                  <div>
                    Hand: {hand.map((card) => card.icon).join(" ") || "empty"}
                  </div>
                  <div>{`Score: ${hand.score}`}</div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="cursor-pointer"
                      onClick={hit}
                      disabled={
                        !hasDealt ||
                        hand.isBusted ||
                        hand.isStand ||
                        hand.isBlackjack
                      }
                    >
                      Hit
                    </Button>
                    <Button
                      size="sm"
                      className="cursor-pointer"
                      disabled={
                        !hasDealt ||
                        hand.isBusted ||
                        hand.isStand ||
                        hand.isBlackjack
                      }
                      onClick={stand}
                    >
                      Stand
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
