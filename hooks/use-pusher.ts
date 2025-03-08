"use client";

import { RendererOptions } from "@/lib/canvas/renderer";
import { Debug } from "@/lib/debug";
import {
  ChatEventSchema,
  EventBus,
  EventBusAllData,
  GameEventSchema,
  VoteStartSchema,
} from "@/lib/event-bus";
import { Dealer } from "@/lib/game/dealer";
import { Player } from "@/lib/game/player";
import { EVENT } from "@/lib/types";
import Pusher from "pusher-js";
import { useEffect, useRef, useState } from "react";

export interface PusherState extends RendererOptions {
  update: EventBusAllData;
  debug: boolean;
}

export function usePusher(
  channelName: string,
  eventBus: EventBus,
  debug: boolean,
) {
  const debugRef = useRef(new Debug("Pusher", "LightGreen"));
  const [state, setState] = useState<PusherState>({
    debug,
    channel: channelName,
    mode: "spectator",
    caption: "connecting...",
    update: {
      type: "",
      data: {},
    },
  });

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe(channelName);
    channel.bind("gamestate", ({ type, data }: GameEventSchema) => {
      debugRef.current.log("gamestate", type, data);
      switch (type) {
        case EVENT.DEALING:
          eventBus.emit(
            "gamestate",
            {
              type,
              data: {
                dealer: Dealer.fromJSON(data.dealer),
                player: Player.fromJSON(data.player),
              },
            },
            false,
          );
          break;
        case EVENT.PLAYER_ACTION:
          eventBus.emit(
            "gamestate",
            {
              type,
              data: {
                player: Player.fromJSON(data.player),
                state: data.state,
              },
            },
            false,
          );
          break;
        case EVENT.REVEAL_HOLE_CARD:
          eventBus.emit(
            "gamestate",
            {
              type,
              data: {
                dealer: Dealer.fromJSON(data.dealer),
              },
            },
            false,
          );
          break;
        case EVENT.DEALER_ACTION:
          eventBus.emit(
            "gamestate",
            {
              type,
              data: {
                dealer: Dealer.fromJSON(data.dealer),
                state: data.state,
              },
            },
            false,
          );
          break;
        case EVENT.JUDGE:
          eventBus.emit(
            "gamestate",
            {
              type,
              data: {
                state: data.state,
              },
            },
            false,
          );
          break;
        case EVENT.STOP:
          eventBus.emit(
            "gamestate",
            {
              type,
              data: {
                state: data.state,
              },
            },
            false,
          );
          break;
        default:
          break;
      }
      setState((prev) => ({
        ...prev,
        update: {
          type,
          data,
        },
      }));
    });

    channel.bind("chat", (args: ChatEventSchema) => {
      debugRef.current.log("chat", args);
      switch (args.type) {
        case EVENT.CONNECTED:
        case EVENT.DISCONNECTED:
        case EVENT.VOTE_UPDATE:
        case EVENT.VOTE_END:
          eventBus.emit("chat", args, false);
          setState((prev) => ({
            ...prev,
            update: args,
          }));
          break;
        default:
          break;
      }
    });

    channel.bind("mediator", (args: VoteStartSchema) => {
      debugRef.current.log("mediator", args);
      switch (args.type) {
        case EVENT.VOTE_START:
          eventBus.emit("mediator", args, false);
          setState((prev) => ({
            ...prev,
            update: args,
          }));
          break;
        default:
          break;
      }
    });

    channel.bind("snapshot", (snapshot: RendererOptions) => {
      debugRef.current.log("snapshot", snapshot);
      // setState(snapshot);
    });

    return () => {
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, []);

  return state;
}
