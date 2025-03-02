const isDevelopment = process.env.NODE_ENV === "development";

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
  [
    FONT.DISPLAY,
    `${isDevelopment ? "/src" : ""}/assets/fonts/${FONT.DISPLAY}-Regular.ttf`,
  ],
  [
    FONT.SANS_SERIF,
    `${isDevelopment ? "/src" : ""}/assets/fonts/${FONT.SANS_SERIF}-Regular.ttf`,
  ],
]);

export enum IMAGE {
  CARDS = "cards",
  // UI = "ui",
}

export const images: Map<IMAGE, string> = new Map([
  [IMAGE.CARDS, `${isDevelopment ? "/src" : ""}/assets/sprites/cards.png`],
  // [IMAGE.UI, `${isDevelopment ? "/src" : ""}/assets/sprites/ui.png`],
]);

