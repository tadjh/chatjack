import { Palette } from "@/lib/constants";
import { Debug } from "@/lib/debug";

export class Counter {
  #current = 0;
  #name: string;
  #targetCount: number;
  #callback: () => void;
  protected debug: Debug;

  constructor(
    name: string,
    targetCount: number,
    callback: () => void,
    debug = new Debug("Counter", Palette.DarkGrey)
  ) {
    this.#name = name;
    this.#targetCount = targetCount;
    this.#callback = callback;
    this.debug = debug;
  }

  get current() {
    return this.#current;
  }

  // Call this when one unit of work is completed
  tick = () => {
    this.#current++;
    if (this.current >= this.#targetCount) {
      this.#callback();
      this.destroy();
    }
  };

  destroy() {
    this.#current = this.#targetCount;
    this.#callback = () => {
      this.debug.log(`Destroying Counter: ${this.#name}`);
    };
    this.#callback();
  }
}

