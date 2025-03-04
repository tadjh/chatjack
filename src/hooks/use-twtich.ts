import { Twitch, TwitchOptions } from "@/lib/integrations/twitch";
import { COMMAND } from "@/lib/types";
import { useRef } from "react";

export interface ChatActions {
  hit: () => void;
  stand: () => void;
  start: () => void;
  restart: () => void;
  stop: () => void;
}

export function useTwitch(options: TwitchOptions): ChatActions {
  const twitchRef = useRef<Twitch>(Twitch.create(options));
  return {
    hit: () => twitchRef.current.handlePlayerAction(COMMAND.HIT),
    stand: () => twitchRef.current.handlePlayerAction(COMMAND.STAND),
    start: () => twitchRef.current.handlePlayerAction(COMMAND.START),
    restart: () => twitchRef.current.handlePlayerAction(COMMAND.RESTART),
    stop: () => twitchRef.current.handlePlayerAction(COMMAND.STOP),
  };
}

