import { Twitch, TwitchOptions } from "@/lib/integrations/twitch";
import { COMMAND } from "@/lib/types";
import { useEffect, useRef } from "react";

export interface ChatActions {
  hit: () => void;
  stand: () => void;
  start: () => void;
  restart: () => void;
  stop: () => void;
}

export function useTwitch({ channel }: TwitchOptions): ChatActions {
  const twitchRef = useRef<Twitch | null>(null);

  if (!twitchRef.current) {
    twitchRef.current = Twitch.create({ channel });
  }

  useEffect(() => {
    if (!twitchRef.current) {
      twitchRef.current = Twitch.create({ channel });
    }

    twitchRef.current.setup(channel);

    return () => {
      if (twitchRef.current) {
        twitchRef.current.teardown();
        twitchRef.current = null;
      }
    };
  }, [channel]);

  return {
    hit: () => twitchRef.current?.handleVoteUpdate(channel, COMMAND.HIT),
    stand: () => twitchRef.current?.handleVoteUpdate(channel, COMMAND.STAND),
    start: () => twitchRef.current?.handlePlayerAction(COMMAND.START),
    restart: () => twitchRef.current?.handlePlayerAction(COMMAND.RESTART),
    stop: () => twitchRef.current?.handlePlayerAction(COMMAND.STOP),
  };
}
