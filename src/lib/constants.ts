import { GameoverStates, State, Vector3 } from "./types";

export const TITLE_TEXT = "ChatJack";
export const SUBTITLE_TEXT = "Twitch Chat Plays Blackjack";
const FPS = 12;
export const TICK_RATE = 1000 / FPS;
export const ANIMATION_SPEED = 1 / 24;
export const FLOAT_SPEED = 1 / 6;
export const FLOAT_AMPLITUDE = 3;
export const SPRITE_WIDTH = 256;
export const SPRITE_HEIGHT = 384;
export const BASE_FONT_SCALE = 1 / 960;
export const PADDING = 1 / 72;
export const FONT_DISPLAY = "Jacquard24";
export const FONT_SANS_SERIF = "PressStart2P";
const isDevelopment = import.meta.env.MODE === "development";

export const Palette: Record<string, Vector3> = {
  White: [255, 255, 255],
  LightestGrey: [192, 203, 220], // "#c0cbdc"
  LightGrey: [139, 155, 180], // "#8b9bb4"
  Grey: [90, 105, 136], // "#5a6988"
  DarkGrey: [58, 68, 102], // "#3a4466"
  Black: [24, 20, 37], // "#181425"
  Pink: [246, 117, 122], // "#f6757a"
  BrightRed: [255, 0, 68], // "#ff0044"
  LightRed: [228, 59, 68], // "#e43b44"
  Red: [158, 40, 53], // "#9e2835"
  Clay: [216, 118, 68], // "#d87644"
  Copper: [190, 74, 47], // "#be4a2f"
  Cream: [234, 212, 170], // "#ead4aa"
  LightTan: [228, 166, 114], // "#e4a672"
  Tan: [228, 166, 114], // "#e4a672"
  DarkTan: [194, 133, 105], // "#c28569"
  LightBrown: [184, 111, 80], // "#b86f50"
  Brown: [116, 63, 57], // "#743f39"
  DarkMagenta: [63, 40, 50], // "#3f2832"
  Purple: [181, 80, 136], // "#b55088"
  DarkPurple: [104, 56, 108], // "#68386c"
  LightGreen: [99, 199, 77], // "#63c74d"
  Green: [62, 137, 72], // "#3e8948"
  DarkGreen: [38, 92, 66], // "#265c42"
  DarkestGreen: [25, 60, 62], // "#193c3e"
  LightBlue: [44, 232, 245], // "#2ce8f5"
  Blue: [0, 149, 233], // "#0095e9"
  DarkBlue: [18, 78, 137], // "#124e89"
  DarkestBlue: [38, 43, 68], // "#262b44"
  Yellow: [254, 231, 97], // "#fee761"
  YellowOrange: [254, 174, 52], // "#feae34"
  Orange: [247, 118, 34], // "#f77622"
} as const;

export const fonts: Map<string, string> = new Map([
  [
    FONT_DISPLAY,
    `${isDevelopment ? "/src" : ""}/assets/fonts/${FONT_DISPLAY}-Regular.ttf`,
  ],
  [
    FONT_SANS_SERIF,
    `${isDevelopment ? "/src" : ""}/assets/fonts/${FONT_SANS_SERIF}-Regular.ttf`,
  ],
]);

export const spriteSheet = `${isDevelopment ? "/src" : ""}/assets/sprites/cards.png`;

export const gameoverTitles: Record<
  GameoverStates,
  { title: string; subtitle: string }
> = {
  [State.PlayerBust]: {
    title: "Player Bust!",
    subtitle: "Better luck next time!",
  },
  [State.DealerBust]: {
    title: "Dealer Bust!",
    subtitle: "How unfortunate...",
  },
  [State.Push]: {
    title: "Push!",
    subtitle: "No winner...",
  },
  [State.PlayerBlackJack]: {
    title: "Blackjack!",
    subtitle: "Chat Wins!",
  },
  [State.DealerBlackJack]: {
    title: "Dealer hit 21!",
    subtitle: "Better luck next time!",
  },
  [State.PlayerWin]: {
    title: "Player Wins!",
    subtitle: "You hand is stronger!",
  },
  [State.DealerWin]: {
    title: "Dealer Wins!",
    subtitle: "Better luck next time!",
  },
};
