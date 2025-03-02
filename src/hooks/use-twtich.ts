import { Twitch, TwitchOptions } from "@/lib/integrations/twitch";
import { useRef } from "react";

export function useTwitch(options: TwitchOptions) {
  const twitchRef = useRef<Twitch>(Twitch.create(options));
  return twitchRef.current;
}

