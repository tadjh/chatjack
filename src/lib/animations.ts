import {
  TITLE_TEXT,
  SUBTITLE_TEXT,
  Palette,
  SANS_SERIF_FONT,
  DISPLAY_FONT,
} from "./constants";
import { Anim } from "./types";

export const titleAnimation: Anim[] = [
  {
    id: "card",
    type: "sprite",
    playback: "loop",
    easing: "easeOutQuint",
    spriteProgress: 0,
    spriteDuration: 6,
    sprites: [
      { x: 0, y: 19968 },
      { x: 256, y: 19968 },
      { x: 512, y: 19968 },
      { x: 0, y: 14976 },
      { x: 256, y: 14976 },
      { x: 512, y: 14976 },
      { x: 256, y: 14976, flipX: true },
      { x: 0, y: 14976, flipX: true },
      { x: 512, y: 19968, flipX: true },
      { x: 256, y: 19968, flipX: true },
      { x: 0, y: 19968 },
      { x: 256, y: 19968 },
      { x: 512, y: 19968 },
      { x: 0, y: 9984 },
      { x: 256, y: 9984 },
      { x: 512, y: 9984 },
      { x: 256, y: 9984, flipX: true },
      { x: 0, y: 9984, flipX: true },
      { x: 512, y: 19968, flipX: true },
      { x: 256, y: 19968, flipX: true },
    ],
    delay: 24,
    opacity: { start: 0, end: 1 },
    translateY: { start: 200, end: 0 },
    float: { x: 0, y: 5, speed: 1 / 2 },
    shadow: {
      color: Palette.DarkestGreen,
      opacity: 1,
      offsetX: 48,
      offsetY: 48,
      blur: 0,
    },
  },
  {
    id: "title",
    type: "text",
    text: TITLE_TEXT,
    easing: "easeOutCubic",
    style: {
      color: Palette.Yellow,
      maxWidth: "full",
      fontSize: 112,
      position: "center",
      fontFamily: DISPLAY_FONT,
      lineHeight: 1.2,
      shadow: { color: Palette.DarkestGreen, x: 8, y: 8, size: 16 },
      stroke: { width: 16, color: Palette.Black },
    },
    translateY: { start: 50, end: 0 },
    kerning: { start: 40, end: 0 },
    float: { x: 0, y: 3, speed: 1 / 6 },
    index: 0,
  },
  {
    id: "subtitle",
    type: "text",
    text: SUBTITLE_TEXT,
    easing: "easeOutCubic",
    delay: 12,
    style: {
      color: Palette.Yellow,
      maxWidth: "title",
      fontSize: 48,
      position: "center",
      fontFamily: DISPLAY_FONT,
      lineHeight: 1.2,
      shadow: { color: Palette.DarkestGreen, x: 4, y: 4, size: 16 },
      stroke: { width: 8, color: Palette.Black },
    },
    translateY: { start: 50, end: 0 },
    float: { x: 0, y: 3, speed: 1 / 6 },
    index: 1,
  },
  {
    id: "start",
    type: "text",
    text: "!start",
    easing: "easeOutCubic",
    delay: 32,
    style: {
      color: Palette.Yellow,
      maxWidth: "full",
      fontSize: 24,
      fontFamily: SANS_SERIF_FONT,
      lineHeight: 1,
      position: "bottom",
      shadow: { color: Palette.DarkestGreen, x: 4, y: 4, size: 16 },
      stroke: { width: 6, color: Palette.Black },
    },
    translateY: { start: 50, end: 0 },
    float: { x: 0, y: 2, speed: 1 / 6 },
    index: 2,
  },
];

export const bustedAnimation: Anim[] = [
  {
    id: "title",
    type: "text",
    text: "Busted!",
    easing: "easeOutCubic",
    style: {
      color: Palette.Yellow,
      maxWidth: "full",
      fontSize: 112,
      position: "center",
      fontFamily: DISPLAY_FONT,
      lineHeight: 1.2,
      shadow: { color: Palette.DarkestGreen, x: 8, y: 8, size: 16 },
      stroke: { width: 16, color: Palette.Black },
    },
    translateY: { start: 50, end: 0 },
    kerning: { start: 40, end: 0 },
    float: { x: 0, y: 3, speed: 1 / 6 },
    index: 0,
  },
  {
    id: "subtitle",
    type: "text",
    text: "Better luck next time!",
    easing: "easeOutCubic",
    delay: 12,
    style: {
      color: Palette.Yellow,
      maxWidth: "title",
      fontSize: 48,
      position: "center",
      fontFamily: DISPLAY_FONT,
      lineHeight: 1.2,
      shadow: { color: Palette.DarkestGreen, x: 4, y: 4, size: 16 },
      stroke: { width: 8, color: Palette.Black },
    },
    translateY: { start: 50, end: 0 },
    float: { x: 0, y: 3, speed: 1 / 6 },
    index: 1,
  },
  {
    id: "start",
    type: "text",
    text: "!restart",
    easing: "easeOutCubic",
    delay: 32,
    style: {
      color: Palette.Yellow,
      maxWidth: "full",
      fontSize: 24,
      fontFamily: SANS_SERIF_FONT,
      lineHeight: 1,
      position: "bottom",
      shadow: { color: Palette.DarkestGreen, x: 4, y: 4, size: 16 },
      stroke: { width: 6, color: Palette.Black },
    },
    translateY: { start: 50, end: 0 },
    float: { x: 0, y: 2, speed: 1 / 6 },
    index: 2,
  },
];

