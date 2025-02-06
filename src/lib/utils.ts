// Fisher-Yates Shuffle Algorithm
export function shuffleDeck<T>(deck: T[]): T[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap elements
  }
  return deck;
}
