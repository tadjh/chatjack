import { Debug } from "@/lib/debug";
import { AnimationEvent, ChatEvent, EventBus } from "@/lib/event-bus";
import { COMMAND, EVENT } from "@/lib/types";

export type MediatorOptions = {
  buffer?: number;
  timer?: number;
};

export class Mediator {
  public static readonly defaultOptions: Required<MediatorOptions> = {
    buffer: 0,
    timer: 10,
  };
  static #instance: Mediator | null = null;
  protected debug: Debug;
  #eventBus: EventBus;
  #buffer: number;
  #timer: number;

  public static create(
    options: MediatorOptions,
    eventBus?: EventBus,
  ): Mediator {
    if (!Mediator.#instance) {
      Mediator.#instance = new Mediator(options, eventBus);
    }
    return Mediator.#instance;
  }

  public static destroy() {
    if (Mediator.#instance) {
      Mediator.#instance.teardown();
    }
    Mediator.#instance = null;
  }

  private constructor(
    {
      buffer = Mediator.defaultOptions.buffer,
      timer = Mediator.defaultOptions.timer,
    }: MediatorOptions = {},
    eventBusInstance: EventBus = EventBus.create(),
    debug = new Debug(Mediator.name, "Yellow"),
  ) {
    this.debug = debug;
    this.debug.log(`Creating: ${Mediator.name} instance`);
    this.#eventBus = eventBusInstance;
    this.#buffer = buffer;
    this.#timer = timer;
  }

  public setup() {
    this.debug.log(`Setup: ${Mediator.name} subscriptions`);
    this.#eventBus.subscribe("chat", this.handleChat, Mediator.name);
    this.#eventBus.subscribe(
      "animationComplete",
      this.handleAnimationComplete,
      Mediator.name,
    );
  }

  public teardown() {
    this.debug.log(`Teardown: ${Mediator.name} subscriptions`);
    this.#eventBus.unsubscribe("chat", this.handleChat);
    this.#eventBus.unsubscribe(
      "animationComplete",
      this.handleAnimationComplete,
    );
  }

  public handleChat = (event: ChatEvent) => {
    switch (event.type) {
      case EVENT.CONNECTED:
        this.debug.log("Waiting for start");
        this.#eventBus.emit("mediator", { type: EVENT.WAIT_FOR_START });
        break;
      case EVENT.DISCONNECTED:
        this.debug.log("Disconnected");
        this.#eventBus.emit("mediator", { type: EVENT.WAIT_FOR_START });
        break;
    }
  };

  private handleVoteStart() {
    this.#eventBus.emit("mediator", {
      type: EVENT.VOTE_START,
      data: {
        options: [COMMAND.HIT, COMMAND.STAND],
        startTime: Date.now(), // + this.#buffer * 1000,
        duration: this.#timer,
      },
    });
  }

  public handleAnimationComplete = (event: AnimationEvent) => {
    switch (event.type) {
      case EVENT.DEALING:
        this.debug.log("Dealing animation complete");
        if (event.data.player.isDone) {
          this.#eventBus.emit("mediator", { type: EVENT.DEALER_DECIDE });
        } else {
          this.handleVoteStart();
        }
        break;
      case EVENT.PLAYER_ACTION:
        this.debug.log("Player action animation complete");
        if (event.data.player.isDone) {
          this.#eventBus.emit("mediator", { type: EVENT.DEALER_DECIDE });
        } else {
          this.handleVoteStart();
        }
        break;
      case EVENT.REVEAL_HOLE_CARD:
        this.debug.log("Reveal hole card animation complete");
        if (event.data.dealer.isDone) {
          this.#eventBus.emit("mediator", { type: EVENT.JUDGE });
        } else {
          this.#eventBus.emit("mediator", { type: EVENT.DEALER_DECIDE });
        }
        break;
      case EVENT.DEALER_ACTION:
        this.debug.log("Dealer action animation complete");
        if (event.data.dealer.isDone) {
          this.#eventBus.emit("mediator", { type: EVENT.JUDGE });
        } else {
          this.#eventBus.emit("mediator", { type: EVENT.DEALER_DECIDE });
        }
        break;
      case EVENT.JUDGE:
        this.debug.log("Judge animation complete");
        this.#eventBus.emit("mediator", { type: EVENT.WAIT_FOR_START });
        break;
    }
  };

  public updateOptions(options: MediatorOptions) {
    this.debug.log(
      `Mediator options updated: buffer=${this.#buffer}, timer=${this.#timer}`,
    );
    this.#buffer = options.buffer ?? this.#buffer;
    this.#timer = options.timer ?? this.#timer;
  }
}
