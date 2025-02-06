import { Player, Roles } from "@/lib/player";
import { Card, Suit, Face } from "@/lib/card";

describe("Player", () => {
  test("should create a player with default values", () => {
    const player = new Player();
    expect(player.name).toBe("Player");
    expect(player.role).toBe(Roles.Player);
    expect(player.isDealer).toBe(false);
    expect(player.isPlayer).toBe(true);
    expect(player.hands.length).toBe(1);
    expect(player.isPlaying).toBe(true);
  });

  test("should create a dealer with correct values", () => {
    const dealer = new Player({ name: "Dealer", role: Roles.Dealer });
    expect(dealer.name).toBe("Dealer");
    expect(dealer.role).toBe(Roles.Dealer);
    expect(dealer.isDealer).toBe(true);
    expect(dealer.isPlayer).toBe(false);
    expect(dealer.hands.length).toBe(1);
    expect(dealer.isPlaying).toBe(true);
  });

  test("should add cards to the player's hand and accumulate score", () => {
    const player = new Player();
    const card1 = new Card(Suit.Clubs + Face.Ace); // Ace of Clubs
    const card2 = new Card(Suit.Clubs + Face.Jack); // Jack of Clubs
    player.hand.add(card1).add(card2);
    expect(player.hand.length).toBe(2);
    expect(player.getScore()).toBe(21);
  });

  test("should accumulate score correctly with multiple Aces", () => {
    const player = new Player();
    const card1 = new Card(Suit.Clubs + Face.Ace); // Ace of Clubs
    const card2 = new Card(Suit.Diamonds + Face.Ace); // Ace of Diamonds
    player.hand.add(card1).add(card2);
    expect(player.getScore()).toBe(12); // One Ace counts as 11, the other as 1
  });

  test("should reset the player's hand", () => {
    const player = new Player({ name: "John" });
    const card1 = new Card(Suit.Clubs + Face.Ace); // Ace of Clubs
    player.hand.add(card1);
    player.hand.reset();
    expect(player.hand.length).toBe(0);
    expect(player.getScore()).toBe(0);
    expect(player.name).toBe("John");
  });
});

