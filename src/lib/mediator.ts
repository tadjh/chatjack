import { Palette } from "@/lib/constants";
import { Debug } from "@/lib/debug";
import {
  AnimationCompleteEvent,
  ChatEvent,
  EventBus,
  eventBus,
  GameEvent,
} from "@/lib/event-bus";
import { EVENT } from "@/lib/types";

export type MediatorOptions = {
  debug: boolean;
};

export class Mediator {
  static #instance: Mediator | null = null;
  protected debug: Debug;
  #eventBus: EventBus;
  #isPlayerDone: boolean = false;
  #isDealerDone: boolean = false;

  public static create(): Mediator {
    if (!Mediator.#instance) {
      Mediator.#instance = new Mediator();
    }
    return Mediator.#instance;
  }

  private constructor(
    eventBusInstance = eventBus,
    debug = new Debug("Mediator", Palette.Yellow)
  ) {
    this.debug = debug;
    this.#eventBus = eventBusInstance;
    this.debug.log("Mediator initialized");
    this.setup();
  }

  setup() {
    this.#eventBus.subscribe("chat", this.handleChat);
    this.#eventBus.subscribe("gamestate", this.handleGamestate);
    this.#eventBus.subscribe("animationComplete", this.handleAnimationComplete);
  }

  destroy() {
    this.#eventBus.unsubscribe("chat", this.handleChat);
    this.#eventBus.unsubscribe("gamestate", this.handleGamestate);
    this.#eventBus.unsubscribe(
      "animationComplete",
      this.handleAnimationComplete
    );
  }

  handleChat = (event: ChatEvent) => {
    switch (event.type) {
      case EVENT.CONNECTED:
        this.debug.log("Waiting for start");
        this.#eventBus.emit("waitForStart");
        break;
      case EVENT.START:
        this.debug.log("Starting game");
        this.#eventBus.emit("start");
        break;
      case EVENT.VOTE_UPDATE:
        this.debug.log("Voting");
        this.#eventBus.emit("animate", event);
        break;
      case EVENT.VOTE_END:
        this.debug.log("Player action", event.data.command);
        this.#eventBus.emit("playerAction", event.data.command);
        break;
      case EVENT.DISCONNECTED:
        this.debug.log("Disconnected");
        this.#eventBus.emit("waitForStart");
        break;
    }
  };

  handleGamestate = (event: GameEvent) => {
    switch (event.type) {
      case EVENT.DEALING:
        this.debug.log("Dealing");
        this.#isPlayerDone = event.data.player.isDone;
        this.#isDealerDone = event.data.dealer.isDone;
        this.#eventBus.emit("animate", event);
        break;
      case EVENT.PLAYER_TURN:
        this.debug.log("Player turn", event.data.player.isDone);
        this.#isPlayerDone = event.data.player.isDone;
        this.#eventBus.emit("animate", event);
        break;
      case EVENT.REVEAL_HOLE_CARD:
        this.debug.log("Revealing hole card");
        this.#isDealerDone = event.data.dealer.isDone;
        this.#eventBus.emit("animate", event);
        break;
      case EVENT.DEALER_TURN:
        this.debug.log("Dealer turn", event.data.dealer.isDone);
        this.#isDealerDone = event.data.dealer.isDone;
        this.#eventBus.emit("animate", event);
        break;
      case EVENT.JUDGE:
        this.debug.log("Judge");
        this.#eventBus.emit("animate", event);
        break;
    }
  };

  handleAnimationComplete = (event: AnimationCompleteEvent) => {
    switch (event) {
      case EVENT.DEALING:
        this.debug.log("Dealing animation complete");
        if (!this.#isPlayerDone) {
          this.#eventBus.emit("vote");
        } else {
          this.#eventBus.emit("dealerTurn");
        }
        break;
      case EVENT.PLAYER_TURN:
        this.debug.log("Player turn animation complete");
        if (!this.#isPlayerDone) {
          this.#eventBus.emit("vote");
        } else {
          this.#eventBus.emit("dealerTurn");
        }
        break;
      case EVENT.REVEAL_HOLE_CARD:
        this.debug.log("Reveal hole card animation complete");
        this.#eventBus.emit("dealerTurn");
        break;
      case EVENT.DEALER_TURN:
        this.debug.log("Dealer turn animation complete");
        if (!this.#isDealerDone) {
          this.#eventBus.emit("dealerTurn");
        } else {
          this.#eventBus.emit("judge");
        }
        break;
      case EVENT.JUDGE:
        this.debug.log("Judge animation complete");
        this.#eventBus.emit("waitForStart");
        break;
    }
  };
}

