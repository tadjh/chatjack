import { Player, Role } from "@/lib/player";
import { Card, Suit, Rank } from "@/lib/card";
import { Dealer } from "@/lib/dealer";

describe("Player", () => {
  test("should create a player with default values", () => {
    const player = new Player();
    expect(player.name).toBe("Player");
    expect(player.role).toBe(Role.Player);
    expect(player.hands.length).toBe(1);
  });

  test("should create a dealer with correct values", () => {
    const dealer = new Dealer();
    expect(dealer.name).toBe("Dealer");
    expect(dealer.role).toBe(Role.Dealer);
    expect(dealer.hands.length).toBe(1);
  });

  test("should add cards to the player's hand and accumulate score", () => {
    const player = new Player();
    const card1 = new Card(Suit.Clubs + Rank.Ace); // Ace of Clubs
    const card2 = new Card(Suit.Clubs + Rank.Jack); // Jack of Clubs
    player.hand.add(card1).add(card2);
    expect(player.hand.length).toBe(2);
    expect(player.score).toBe(21);
  });

  test("should accumulate score correctly with multiple Aces", () => {
    const player = new Player();
    const card1 = new Card(Suit.Clubs + Rank.Ace); // Ace of Clubs
    const card2 = new Card(Suit.Diamonds + Rank.Ace); // Ace of Diamonds
    player.hand.add(card1).add(card2);
    expect(player.score).toBe(12); // One Ace counts as 11, the other as 1
  });

  test("should reset the player's hand", () => {
    const player = new Player("John");
    const card1 = new Card(Suit.Clubs + Rank.Ace); // Ace of Clubs
    player.hand.add(card1);
    player.hand.reset();
    expect(player.hand.length).toBe(0);
    expect(player.score).toBe(0);
    expect(player.name).toBe("John");
  });
});

