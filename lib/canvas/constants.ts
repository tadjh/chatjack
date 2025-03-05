import { StaticImageData } from "next/image";
import cards from "../../public/sprites/cards.png";
import { Jacquard_24, Press_Start_2P } from "next/font/google";

const jacquard = Jacquard_24({
  variable: "--font-jacquard",
  weight: ["400"],
  preload: true,
  display: "block",
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: ["400"],
  preload: true,
  display: "block",
});
// const isDevelopment = process.env.NODE_ENV === "development";

export const FPS = 12;
export const BASELINE_PADDING = 16;
export const BASELINE_GUTTER = 8;
export const BASELINE_WIDTH = 800;
export const BASELINE_HEIGHT = 400;

export const FONT = {
  DISPLAY: jacquard.style.fontFamily,
  SANS_SERIF: pressStart.style.fontFamily,
};

// export const Fonts: Map<FONT, string> = new Map([
//   [FONT.DISPLAY, Jacquard24],
//   [FONT.SANS_SERIF, PressStart2P],
// ]);

export enum IMAGE {
  CARDS = "cards",
  // UI = "ui",
}

export const images: Map<IMAGE, StaticImageData> = new Map([
  [IMAGE.CARDS, cards],
  // [IMAGE.UI, `${isDevelopment ? "/src" : ""}/assets/sprites/ui.png`],
]);
