import { SearchProps } from "@/components/search-provider";

export type Vector3 = [number, number, number];

export type Props = {
  params: Promise<{ channel: string }>;
  searchParams: Promise<Partial<SearchProps>>;
};

export enum STATE {
  INIT,
  DEALING,
  PLAYER_HIT,
  PLAYER_STAND,
  PLAYER_SPLIT,
  REVEAL_HOLE_CARD,
  DEALER_HIT,
  DEALER_STAND,
  PLAYER_BUST,
  DEALER_BUST,
  PUSH,
  PLAYER_BLACKJACK,
  DEALER_BLACKJACK,
  PLAYER_WIN,
  DEALER_WIN,
}

export enum COMMAND {
  HIT = "!hit",
  STAND = "!stand",
  START = "!start",
  RESTART = "!restart",
  STOP = "!stop",
}

export type DEFAULT_COMMAND = COMMAND.STAND;

export enum EVENT {
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  WAIT_FOR_START = "waitForStart",
  START = "start",
  DEALING = "dealing",
  VOTE_START = "voteStart",
  VOTE_UPDATE = "voteUpdate",
  VOTE_END = "voteEnd",
  PLAYER_ACTION = "playerAction",
  REVEAL_HOLE_CARD = "revealHoleCard",
  DEALER_DECIDE = "dealerDecide",
  DEALER_ACTION = "dealerAction",
  JUDGE = "judge",
  STOP = "stop",
}
