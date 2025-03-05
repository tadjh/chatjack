import { Debug } from "@/lib/debug";

export class Counter {
  readonly name: string;
  readonly targetCount: number;
  protected debug: Debug;
  #current = 0;
  #callback: (() => void) | null = null;

  constructor(
    name: string,
    targetCount: number,
    callback: () => void,
    debug = new Debug("Counter", "DarkGrey")
  ) {
    this.name = name;
    this.targetCount = targetCount;
    this.#callback = callback;
    this.debug = debug;
  }

  get current() {
    return this.#current;
  }

  get callback() {
    return this.#callback;
  }

  // Call this when one unit of work is completed
  public tick = () => {
    this.#current++;
    if (this.current >= this.targetCount) {
      if (this.#callback) {
        this.#callback();
      }
      this.destroy();
    }
  };

  public destroy() {
    this.debug.log(`Destroying Counter: ${this.name}`);
    this.#current = this.targetCount;
    this.#callback = null;
  }
}

