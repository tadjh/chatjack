import { Entity, LayerOrder } from "./types";

export class Layer extends Map<string, Entity> {
  #order: LayerOrder;

  constructor(order: LayerOrder) {
    super();
    this.#order = order;
  }

  get order() {
    return this.#order;
  }
}

