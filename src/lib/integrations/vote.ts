import { COMMAND } from "@/lib/types";

export class Vote<T extends COMMAND = COMMAND> {
  #cache: Map<string, T> = new Map<string, T>();
  #totals: Map<T, number> = new Map<T, number>();
  #callback: ((command: T, count: number) => void) | null = null;

  constructor() {}

  private increment(command: T): this {
    const prev = this.#totals.get(command) ?? 0;
    const next = prev + 1;
    this.#totals.set(command, next);
    if (this.#callback) {
      this.#callback(command, next);
    }
    return this;
  }

  private decrement(command: T): this {
    const prev = this.#totals.get(command) ?? 0;
    const next = prev - 1;
    this.#totals.set(command, next);
    if (this.#callback) {
      this.#callback(command, next);
    }
    return this;
  }

  private change(username: string, prev: T, next: T): this {
    this.decrement(prev);
    this.increment(next);
    this.#cache.set(username, next);
    return this;
  }

  private dedupe(username: string, command: T): this {
    const prev = this.#cache.get(username);

    if (!prev) {
      throw new Error("No previous vote found");
    }

    if (prev !== command) {
      this.change(username, prev, command);
    }

    return this;
  }

  private record(username: string, command: T): this {
    this.increment(command);
    this.#cache.set(username, command);
    return this;
  }

  public register = (
    username: string,
    command: T,
    callback: (command: T, count: number) => void
  ): this => {
    this.#callback = callback;
    if (this.#cache.has(username)) return this.dedupe(username, command);
    return this.record(username, command);
  };

  public tally(defaultCommand: T): T {
    let winner: T = defaultCommand;
    let max = 0;
    for (const [command, count] of this.#totals) {
      if (count > max) {
        max = count;
        winner = command;
      }
      if (count === max) {
        winner = defaultCommand;
      }
    }
    return winner;
  }

  public reset(): this {
    this.#cache.clear();
    this.#totals.clear();
    this.#callback = null;
    return this;
  }
}

