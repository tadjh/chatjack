import { Vector3 } from "./types";

const isDevelopment = import.meta.env.MODE === "development";
export const FPS = 12;
export const PADDING_MULTIPLIER = 2 / 100;
export const BASELINE_PADDING = 16;
export const BASELINE_GUTTER = 8;
export const BASELINE_WIDTH = 800;
export const BASELINE_HEIGHT = 400;

export const Palette: Record<string, Vector3> = {
  White: [255, 255, 255], // "#ffffff"
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

export enum FONT {
  DISPLAY = "Jacquard24",
  SANS_SERIF = "PressStart2P",
}

export const Fonts: Set<FontFace> = new Set([
  new FontFace(
    FONT.DISPLAY,
    `url(${isDevelopment ? "/src" : ""}/assets/fonts/${FONT.DISPLAY}-Regular.ttf)`
  ),
  new FontFace(
    FONT.SANS_SERIF,
    `url(${isDevelopment ? "/src" : ""}/assets/fonts/${FONT.SANS_SERIF}-Regular.ttf)`
  ),
]);

export enum IMAGE {
  CARDS = "cards",
  UI = "ui",
}

export const Images: Map<IMAGE, string> = new Map([
  [IMAGE.CARDS, `${isDevelopment ? "/src" : ""}/assets/sprites/cards.png`],
]);
