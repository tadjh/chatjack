import { Twitch, TwitchOptions } from "@/lib/integrations/twitch";
import { COMMAND } from "@/lib/types";
import { useRef } from "react";
import { faker } from "@faker-js/faker";

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
    hit: () =>
      twitchRef.current.handleVoteUpdate(
        faker.internet.username(),
        COMMAND.HIT
      ),
    stand: () =>
      twitchRef.current.handleVoteUpdate(
        faker.internet.username(),
        COMMAND.STAND
      ),
    start: () => twitchRef.current.handlePlayerAction(COMMAND.START),
    restart: () => twitchRef.current.handlePlayerAction(COMMAND.RESTART),
    stop: () => twitchRef.current.handlePlayerAction(COMMAND.STOP),
  };
}

