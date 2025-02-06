import { Player } from "./player";

export class Dealer extends Player {
  isDealer = true;
  constructor() {
    super("Dealer");
  }
}

