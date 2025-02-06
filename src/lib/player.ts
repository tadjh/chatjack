import { Card, Face } from "./card";

export class Player {
  name: string;
  hand: Card[] = [];
  score = 0;
  constructor(name: string) {
    this.name = name;
  }

  addCard(...cards: Card[]) {
    this.hand.push(...cards);
    for (const card of cards) {
      this.accumulateScore(card);
    }
  }

  accumulateScore(card: Card) {
    if (card.face === Face.Ace) {
      if (this.score + 11 > 21) {
        this.score += card.score();
      } else {
        this.score += card.score(true);
      }
    } else {
      this.score += card.score();
    }
  }

  reset() {
    this.hand = [];
    this.score = 0;
  }
}

