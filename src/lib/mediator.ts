import { Debug } from "@/lib/debug";
import { AnimationEvent, ChatEvent, EventBus, eventBus } from "@/lib/event-bus";
import { EVENT } from "@/lib/types";

export type MediatorOptions = {
  debug: boolean;
};

export class Mediator {
  static #instance: Mediator | null = null;
  protected debug: Debug;
  #eventBus: EventBus;

  public static create(): Mediator {
    if (!Mediator.#instance) {
      Mediator.#instance = new Mediator();
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
    eventBusInstance = eventBus,
    debug = new Debug("Mediator", "Yellow")
  ) {
    this.debug = debug;
    this.#eventBus = eventBusInstance;
    this.debug.log("Mediator initialized");
    this.setup();
  }

  private setup() {
    this.#eventBus.subscribe("chat", this.handleChat);
    this.#eventBus.subscribe("animationComplete", this.handleAnimationComplete);
  }

  private teardown() {
    this.#eventBus.unsubscribe("chat", this.handleChat);
    this.#eventBus.unsubscribe(
      "animationComplete",
      this.handleAnimationComplete
    );
  }

  public handleChat = (event: ChatEvent) => {
    switch (event.type) {
      case EVENT.CONNECTED:
        this.debug.log("Waiting for start");
        this.#eventBus.emit("waitForStart");
        break;
      case EVENT.DISCONNECTED:
        this.debug.log("Disconnected");
        this.#eventBus.emit("waitForStart");
        break;
    }
  };

  public handleAnimationComplete = (event: AnimationEvent) => {
    switch (event.type) {
      case EVENT.DEALING:
        this.debug.log("Dealing animation complete");
        if (event.data.player.isDone) {
          this.#eventBus.emit("dealerAction");
        } else {
          this.#eventBus.emit("vote");
        }
        break;
      case EVENT.PLAYER_ACTION:
        this.debug.log("Player turn animation complete");
        if (event.data.player.isDone) {
          this.#eventBus.emit("dealerAction");
        } else {
          this.#eventBus.emit("vote");
        }
        break;
      case EVENT.REVEAL_HOLE_CARD:
        this.debug.log("Reveal hole card animation complete");
        if (event.data.dealer.isDone) {
          this.#eventBus.emit("judge");
        } else {
          this.#eventBus.emit("dealerAction");
        }
        break;
      case EVENT.DEALER_ACTION:
        this.debug.log("Dealer turn animation complete");
        if (event.data.dealer.isDone) {
          this.#eventBus.emit("judge");
        } else {
          this.#eventBus.emit("dealerAction");
        }
        break;
      case EVENT.JUDGE:
        this.debug.log("Judge animation complete");
        this.#eventBus.emit("waitForStart");
        break;
    }
  };
}

