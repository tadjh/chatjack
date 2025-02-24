import { Palette } from "./constants";
import { Debug } from "./debug";

export class Counter {
  #current = 0;

  constructor(
    private name: string,
    private targetCount: number,
    private callback: () => void,
    private debug = new Debug("Counter", Palette.DarkGrey)
  ) {}

  get current() {
    return this.#current;
  }

  // Call this when one unit of work is completed
  tick = () => {
    this.#current++;
    if (this.current >= this.targetCount) {
      this.callback();
    }
  };

  destroy() {
    this.#current = this.targetCount;
    this.callback = () => {
      this.debug.log(`Destroying Counter: ${this.name}`);
    };
    this.callback();
  }
}

