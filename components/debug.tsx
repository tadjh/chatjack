import { Button } from "@/components/ui/button";
import { UseBlackjackReturnType } from "@/hooks/use-blackjack";
import { ChatActions } from "@/hooks/use-twtich";

export function Debug({
  blackjack,
  enabled,
  chat,
}: {
  blackjack: UseBlackjackReturnType;
  enabled?: boolean;
  chat: ChatActions;
}) {
  if (!enabled) return null;

  const {
    dealer,
    player,
    hasDealt,
    isRevealed,
    isGameover,
    isPlayerDone,
    reveal,
    decide,
  } = blackjack;

  const { hit, stand, start, restart, stop } = chat;

  return (
    <div className="fixed top-1/2 left-0 z-[9999] flex h-full -translate-y-1/2 flex-col justify-center gap-2 p-4 font-mono">
      <div className="grid gap-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            className="cursor-pointer"
            onClick={restart}
            disabled={!hasDealt}
          >
            !restart
          </Button>
          <Button
            size="sm"
            className="cursor-pointer"
            onClick={stop}
            disabled={!hasDealt}
          >
            !stop
          </Button>
        </div>
        <div className="grid items-center gap-2">
          <div>Dealer</div>
          <div>{`Score: ${dealer.score} `}</div>
          <div>
            Hand:{" "}
            {dealer.hand.cards.map((card) => card.icon).join(" ") || "empty"}
          </div>
          <div>
            {!hasDealt ? (
              <Button size="sm" className="cursor-pointer" onClick={start}>
                !start
              </Button>
            ) : !isRevealed ? (
              <Button
                size="sm"
                className="cursor-pointer"
                onClick={reveal}
                disabled={!isPlayerDone}
              >
                !reveal
              </Button>
            ) : (
              <Button
                size="sm"
                className="cursor-pointer"
                onClick={decide}
                disabled={isGameover}
              >
                !decide
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
                Hand: {hand.cards.map((card) => card.icon).join(" ") || "empty"}
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
                  !hit
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
                  !stand
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
