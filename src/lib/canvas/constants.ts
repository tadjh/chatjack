import Jacquard24 from "@/assets/fonts/Jacquard24-Regular.ttf";
import PressStart2P from "@/assets/fonts/PressStart2P-Regular.ttf";
import cards from "@/assets/sprites/cards.png";

// const isDevelopment = process.env.NODE_ENV === "development";

export const FPS = 12;
export const BASELINE_PADDING = 16;
export const BASELINE_GUTTER = 8;
export const BASELINE_WIDTH = 800;
export const BASELINE_HEIGHT = 400;

export enum FONT {
  DISPLAY = "Jacquard24",
  SANS_SERIF = "PressStart2P",
}

export const Fonts: Map<FONT, string> = new Map([
  [FONT.DISPLAY, Jacquard24],
  [FONT.SANS_SERIF, PressStart2P],
]);

export enum IMAGE {
  CARDS = "cards",
  // UI = "ui",
}

export const images: Map<IMAGE, string> = new Map([
  [IMAGE.CARDS, cards],
  // [IMAGE.UI, `${isDevelopment ? "/src" : ""}/assets/sprites/ui.png`],
]);

