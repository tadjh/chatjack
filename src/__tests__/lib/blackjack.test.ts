import { Blackjack } from "@/lib/blackjack";
import { Card } from "@/lib/card";

describe("Blackjack", () => {
  let blackjack: Blackjack;

  beforeEach(() => {
    blackjack = new Blackjack();
  });

  it("should draw a card and log the correct message", () => {
    console.log = jest.fn(); // Mock console.log
    const card = blackjack.draw();
    expect(console.log).toHaveBeenCalledWith("Card drawn:", expect.anything());
    expect(card).toBeInstanceOf(Card);
  });

  it("should log 'none' if no card is drawn", () => {
    console.log = jest.fn(); // Mock console.log
    blackjack.empty(); // Empty the deck
    blackjack.draw();
    expect(console.log).toHaveBeenCalledWith("Card drawn:", "none");
  });
});

