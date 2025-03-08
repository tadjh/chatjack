import { EventBus } from "@/lib/event-bus";
import { Twitch, TwitchOptions } from "@/lib/integrations/twitch";
import { COMMAND } from "@/lib/types";
import { randUser } from "@ngneat/falso";
import { useEffect, useRef } from "react";

export interface ChatActions {
  hit: () => void;
  stand: () => void;
  start: () => void;
  restart: () => void;
  stop: () => void;
}

export function useTwitch(
  options: TwitchOptions,
  eventBus: EventBus,
): ChatActions {
  const twitchRef = useRef<Twitch>(Twitch.create(options, eventBus));

  useEffect(() => {
    const twitch = twitchRef.current;

    if (twitch.channel !== options.channel) {
      twitch.setup(options.channel);
    }

    return () => {
      if (twitch.channel) {
        twitch.teardown();
      }
    };
  }, [options.channel]);

  return {
    hit: () =>
      twitchRef.current.handleVoteUpdate(randUser().username, COMMAND.HIT),
    stand: () =>
      twitchRef.current.handleVoteUpdate(randUser().username, COMMAND.STAND),
    start: () => twitchRef.current.handlePlayerAction(COMMAND.START),
    restart: () => twitchRef.current.handlePlayerAction(COMMAND.RESTART),
    stop: () => twitchRef.current.handlePlayerAction(COMMAND.STOP),
  };
}
