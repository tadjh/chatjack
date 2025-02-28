export type Vector3 = [number, number, number];

export enum LAYER {
  BG = "Background",
  GAME = "Game",
  UI = "Ui",
}

export enum POSITION {
  CENTER = "center",
  EYELINE = "eyeline",
  LEFT = "left",
  RIGHT = "right",
  TOP = "top",
  BOTTOM = "bottom",
  TOP_LEFT = "top left",
  TOP_RIGHT = "top right",
  BOTTOM_LEFT = "bottom left",
  BOTTOM_RIGHT = "bottom right",
}

export enum State {
  Init,
  Dealing,
  PlayerHit,
  PlayerStand,
  PlayerSplit,
  RevealHoleCard,
  DealerHit,
  DealerStand,
  PlayerBust,
  DealerBust,
  Push,
  PlayerBlackjack,
  DealerBlackjack,
  PlayerWin,
  DealerWin,
}
