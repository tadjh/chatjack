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
import Pusher, { Channel } from "pusher-js";

export interface PusherState extends RendererOptions {
  update: EventBusAllData;
  debug: boolean;
}

type StateChangeListener = (state: PusherState) => void;

export class PusherService {
  static #instance: PusherService | null = null;
  #pusher: Pusher | null = null;
  #channel: Channel | null = null;
  #channelName: string = "";
  public debug: Debug;
  #state: PusherState;
  #eventBus: EventBus;
  #stateChangeListeners: Set<StateChangeListener> = new Set();

  public static create(): PusherService {
    if (!PusherService.#instance) {
      PusherService.#instance = new PusherService();
    }
    return PusherService.#instance;
  }
  private constructor(
    eventBus: EventBus = EventBus.create(),
    debug = new Debug(PusherService.name, "LightGreen"),
  ) {
    this.debug = debug;
    this.debug.log(`Creating: ${PusherService.name} instance`);
    this.#eventBus = eventBus;
    this.#state = {
      debug: false,
      channel: "",
      mode: "spectate",
      caption: "disconnected",
      update: {
        type: "",
        data: {},
      },
    };
  }

  public getState(): PusherState {
    return this.#state;
  }

  public connect(channelName: string): void {
    this.debug.log("Subscribing to Pusher channel:", channelName);
    if (this.#pusher) {
      this.disconnect();
    }

    this.#channelName = channelName;
    this.#state.debug = false;
    this.#state.channel = channelName;
    this.#state.caption = "connecting...";

    if (!channelName) return;

    this.#pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY as string, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string,
    });

    this.#channel = this.#pusher.subscribe(channelName);

    this.bindEvents();
  }

  public disconnect(): void {
    if (this.#pusher && this.#channelName) {
      // this.debug.log("Unsubscribing from Pusher channel:", this.#channelName);
      // this.#pusher.unsubscribe(this.#channelName);
      this.debug.log("Disconnecting from Pusher");
      this.#pusher.disconnect();
      this.#pusher = null;
      this.#channel = null;
      this.#state.caption = "disconnected";
    }
  }

  public subscribe(listener: StateChangeListener): () => void {
    this.#stateChangeListeners.add(listener);

    return () => {
      this.#stateChangeListeners.delete(listener);
    };
  }

  private notifyStateChange(): void {
    this.#stateChangeListeners.forEach((listener) => {
      listener(this.#state);
    });
  }

  private bindEvents(): void {
    if (!this.#channel) return;

    this.#channel.bind("gamestate", this.handleGameState);
    this.#channel.bind("chat", this.handleChat);
    this.#channel.bind("mediator", this.handleMediator);
    this.#channel.bind("snapshot", (snapshot: RendererOptions) => {
      this.debug.log("snapshot", snapshot);
      // Update state with snapshot if needed
    });
  }

  private handleGameState = ({ type, data }: GameEventSchema): void => {
    this.debug.log("gamestate", type);

    switch (type) {
      case EVENT.DEALING:
        this.#eventBus.emit(
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
        this.#eventBus.emit(
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
        this.#eventBus.emit(
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
        this.#eventBus.emit(
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
      case EVENT.STOP:
        this.#eventBus.emit(
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

    this.updateState({
      type,
      data,
    });
  };

  private handleChat = (args: ChatEventSchema): void => {
    this.debug.log("chat", args.type);

    switch (args.type) {
      case EVENT.CONNECTED:
      case EVENT.DISCONNECTED:
      case EVENT.VOTE_UPDATE:
      case EVENT.VOTE_END:
        this.#eventBus.emit("chat", args, false);
        this.updateState(args);
        break;
      default:
        break;
    }
  };

  private handleMediator = (args: VoteStartSchema): void => {
    this.debug.log("mediator", args.type);

    switch (args.type) {
      case EVENT.VOTE_START:
        this.#eventBus.emit("mediator", args, false);
        this.updateState(args);
        break;
      default:
        break;
    }
  };

  private updateState(update: EventBusAllData): void {
    this.#state = {
      ...this.#state,
      update,
    };

    // Notify listeners when state changes
    this.notifyStateChange();
  }
}
