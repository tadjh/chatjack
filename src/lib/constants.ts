import { Vector3 } from "./types";

export const TITLE_TEXT = "ChatJack";
export const SUBTITLE_TEXT = "Twitch Chat Plays Blackjack";
const FPS = 12;
export const TICK_RATE = 1000 / FPS;
export const ANIMATION_SPEED = 1 / 24;
export const FLOAT_SPEED = 1 / 6;
export const FLOAT_AMPLITUDE = 3;
export const SPRITE_WIDTH = 256;
export const SPRITE_HEIGHT = 384;
export const DISPLAY_FONT = "Jacquard";
export const SANS_SERIF_FONT = "PressStart2P";
const isDevelopment = import.meta.env.MODE === "development";

export const Palette: Record<string, Vector3> = {
  White: [255, 255, 255],
  LightestGrey: [192, 203, 220], // "#c0cbdc"
  LightGrey: [139, 155, 180], // "#8b9bb4"
  Grey: [90, 105, 136], // "#5a6988"
  DarkGrey: [58, 68, 102], // "#3a4466"
  DarkestGrey: [38, 43, 68], // "#262b44"
  Black: [24, 20, 37], // "#181425"
  LightRed: [228, 59, 68], // "#e43b44"
  Red: [158, 40, 53], // "#9e2835"
  DarkRed: [63, 40, 50], // "#3f2832"
  LightGreen: [99, 199, 77], // "#63c74d"
  Green: [62, 137, 72], // "#3e8948"
  DarkGreen: [38, 92, 66], // "#265c42"
  DarkestGreen: [25, 60, 62], // "#193c3e"
  LightBlue: [44, 232, 245], // "#2ce8f5"
  Blue: [0, 149, 233], // "#0095e9"
  DarkBlue: [18, 78, 137], // "#124e89"
  Yellow: [254, 231, 97], // "#fee761"
  YellowOrange: [254, 174, 52], // "#feae34"
  Orange: [247, 118, 34], // "#f77622"
} as const;

export const fonts: Map<string, string> = new Map([
  [
    DISPLAY_FONT,
    `${isDevelopment ? "/src" : ""}/assets/fonts/Jacquard24-Regular.ttf`,
  ],
  [
    SANS_SERIF_FONT,
    `${isDevelopment ? "/src" : ""}/assets/fonts/PressStart2P-Regular.ttf`,
  ],
]);

export const spriteSheet = `${isDevelopment ? "/src" : ""}/assets/sprites/cards.png`;

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
  PlayerBlackJack,
  DealerBlackJack,
  PlayerWin,
  DealerWin,
}

