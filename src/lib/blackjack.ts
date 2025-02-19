import { State } from "./constants";
import { Dealer } from "./dealer";
import { Deck } from "./deck";
import { Player } from "./player";

export class Blackjack {
  #state = State.Init;
  #table: [Dealer, ...Player[]] = [new Dealer()];
  #deck: Deck = new Deck();
  #playerTurn = 0;

  constructor(deckCount = 1, playerCount = 1) {
    this.init(deckCount, playerCount);
  }

  get table() {
    return this.#table;
  }

  get dealer() {
    return this.#table[0];
  }

  get player() {
    const [, player] = this.#table;
    return player;
  }

  get players() {
    const [, ...players] = this.#table;
    return players;
  }

  get hasDealt() {
    return this.#state > State.Init;
  }

  get isDealerTurn() {
    return this.#state === State.DealerTurn;
  }

  get playerTurn() {
    return this.#playerTurn;
  }

  get remaining() {
    return this.#deck.length;
  }

  get state() {
    return this.#state;
  }

  init(deckCount: number, playerCount: number) {
    this.#state = State.Init;
    this.#deck.init(deckCount);
    for (let i = 1; i <= playerCount; i++) {
      const player = new Player(`Player ${i}`, i);
      this.#table.push(player);
    }
    return this;
  }

  draw(isHidden = false) {
    return this.#deck.draw(isHidden);
  }

  public empty() {
    this.#deck.empty();
    return this;
  }

  public deal() {
    if (this.#state !== State.Init) {
      throw new Error("Game has already started");
    }

    // Deal a card to each player
    this.players.forEach((player) => {
      player.hit(this.draw());
    });

    this.dealer.hit(this.draw());

    // Deal a second card to each player except the dealer
    this.players.forEach((player) => {
      player.hit(this.draw());
    });

    this.dealer.hit(this.draw(true));

    this.#state = State.Dealing;
    this.#playerTurn++;
    return this;
  }

  hit(player: Player, index = 0) {
    if (player.seat !== this.#playerTurn) {
      throw new Error(`It is not ${player.name}'s turn`);
    }

    player.hit(this.draw(), index);
    // TODO Support hitting a split hand
    if (player.hand.isBusted) {
      this.#state = State.PlayerBust;
    } else if (player.hand.isBlackjack) {
      this.#state = State.DealerTurn;
    } else {
      this.#state = State.PlayerTurn;
    }
    return this;
  }

  stand(player: Player, index = 0) {
    if (player.seat !== this.#playerTurn) {
      throw new Error(`It is not ${player.name}'s turn`);
    }

    player.stand(index);
    this.#playerTurn++;
    if (this.#playerTurn === this.players.length) {
      this.#state = State.DealerTurn;
      this.dealer.hand[1].show();
    }
    return this;
  }

  split(player: Player) {
    console.log(player.seat, this.#playerTurn);

    if (player.seat !== this.#playerTurn) {
      throw new Error(`It is not ${player.name}'s turn`);
    }

    player.split();
    return this;
  }

  dealerTurn() {
    if (this.#state !== State.DealerTurn) {
      throw new Error("Dealer cannot play");
    }

    while (true) {
      if (!this.#deck.length) {
        console.log("No more cards in the deck");
        break;
      }

      const decision = this.dealer.decide(this.#deck);

      if (decision === "stand") break;

      const card = this.#deck.shift()!;

      this.dealer.hit(card);
      console.log(`Dealer hits and draws: ${card.name}`);

      if (this.dealer.isBusted) {
        console.log("Dealer busts");
        break;
      }
    }

    this.judge();
  }

  judge() {
    // TODO Support multiple players
    // TODO Support player with a split hand
    if (
      this.player.hand.status === "blackjack" &&
      this.dealer.hand.status === "blackjack"
    ) {
      this.#state = State.Push;
    } else if (this.player.hand.status === "blackjack") {
      this.#state = State.PlayerBlackJack;
    } else if (this.dealer.hand.status === "blackjack") {
      this.#state = State.DealerBlackJack;
    } else if (this.player.hand.status === "busted") {
      this.#state = State.PlayerBust;
    } else if (this.dealer.hand.status === "busted") {
      this.#state = State.DealerBust;
    } else if (this.player.hand.score > this.dealer.hand.score) {
      this.#state = State.PlayerWin;
    } else if (this.dealer.hand.score > this.player.hand.score) {
      this.#state = State.DealerWin;
    }

    return this;
  }

  reset(deckCount = 1, playerCount = 1) {
    this.#table.forEach((player) => player.reset());
    this.#table = [this.dealer];
    this.#playerTurn = -1;
    this.#deck.empty();
    this.init(deckCount, playerCount);
    return this;
  }
}

