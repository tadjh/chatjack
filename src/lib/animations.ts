import {
  TITLE_TEXT,
  SUBTITLE_TEXT,
  Palette,
  FONT_SANS_SERIF,
  FONT_DISPLAY,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
} from "./constants";
import { Text, AnimatedSprite, Sprite, LayerOrder } from "./types";

export const titleScreen: [AnimatedSprite, Text, Text, Text] = [
  {
    id: "flip-card",
    type: "animated-sprite",
    playback: "loop",
    layer: LayerOrder.Background,
    easing: "easeOutQuint",
    spriteElapsed: 0,
    spriteDuration: 6,
    spriteIndex: 0,
    sprites: [
      { x: 0, y: 4992 },
      { x: 256, y: 4992 },
      { x: 512, y: 4992 },
      { x: 3072, y: 0 },
      { x: 3328, y: 0 },
      { x: 3584, y: 0 },
      { x: 3328, y: 0, flipX: true },
      { x: 3072, y: 0, flipX: true },
      { x: 512, y: 4992, flipX: true },
      { x: 256, y: 4992, flipX: true },
      { x: 0, y: 4992 },
      { x: 256, y: 4992 },
      { x: 512, y: 4992 },
      { x: 2048, y: 0 },
      { x: 2304, y: 0 },
      { x: 2560, y: 0 },
      { x: 2304, y: 0, flipX: true },
      { x: 2048, y: 0, flipX: true },
      { x: 512, y: 4992, flipX: true },
      { x: 256, y: 4992, flipX: true },
    ],
    spriteWidth: SPRITE_WIDTH,
    spriteHeight: SPRITE_HEIGHT,
    delay: 24,
    translateY: { start: 200, end: 0 },
    opacity: { start: 0, end: 1 },
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
    layer: LayerOrder.Foreground,
    style: {
      color: Palette.Yellow,
      maxWidth: "full",
      fontSize: 112,
      fontFamily: FONT_DISPLAY,
      lineHeight: 1.2,
      shadow: { color: Palette.DarkestGreen, x: 8, y: 8, size: 16 },
      stroke: { width: 16, color: Palette.Black },
    },
    position: "center",
    translateY: { start: 50, end: 0 },
    opacity: { start: 0, end: 1 },
    kerning: { start: 40, end: 0 },
    float: { x: 0, y: 3, speed: 1 / 6 },
    index: 0,
  },
  {
    id: "subtitle",
    type: "text",
    text: SUBTITLE_TEXT,
    easing: "easeOutCubic",
    layer: LayerOrder.Foreground,
    delay: 12,
    style: {
      color: Palette.Yellow,
      maxWidth: "title",
      fontSize: 48,
      fontFamily: FONT_DISPLAY,
      lineHeight: 1.2,
      shadow: { color: Palette.DarkestGreen, x: 4, y: 4, size: 16 },
      stroke: { width: 8, color: Palette.Black },
    },
    position: "center",
    translateY: { start: 50, end: 0 },
    opacity: { start: 0, end: 1 },
    float: { x: 0, y: 3, speed: 1 / 6 },
    index: 1,
  },
  {
    id: "start",
    type: "text",
    text: "!start",
    easing: "easeOutCubic",
    layer: LayerOrder.Foreground,
    delay: 32,
    style: {
      color: Palette.Yellow,
      maxWidth: "full",
      fontSize: 24,
      fontFamily: FONT_SANS_SERIF,
      lineHeight: 1,
      shadow: { color: Palette.DarkestGreen, x: 4, y: 4, size: 16 },
      stroke: { width: 6, color: Palette.Black },
    },
    position: "bottom",
    translateY: { start: 50, end: 0 },
    opacity: { start: 0, end: 1 },
    float: { x: 0, y: 2, speed: 1 / 6 },
    index: 2,
  },
];

export const gameoverText: [Text, Text, Text] = [
  {
    id: "title",
    type: "text",
    text: "Dealer Win!",
    easing: "easeOutCubic",
    layer: LayerOrder.Foreground,
    style: {
      color: Palette.Yellow,
      maxWidth: "full",
      fontSize: 112,
      fontFamily: FONT_DISPLAY,
      lineHeight: 1.2,
      shadow: { color: Palette.DarkestGreen, x: 8, y: 8, size: 16 },
      stroke: { width: 16, color: Palette.Black },
    },
    position: "center",
    translateY: { start: 50, end: 0 },
    opacity: { start: 0, end: 1 },
    kerning: { start: 40, end: 0 },
    float: { x: 0, y: 3, speed: 1 / 6 },
    index: 0,
  },
  {
    id: "subtitle",
    type: "text",
    text: "Better luck next time",
    easing: "easeOutCubic",
    layer: LayerOrder.Foreground,
    delay: 12,
    style: {
      color: Palette.Yellow,
      maxWidth: "title",
      fontSize: 48,
      fontFamily: FONT_DISPLAY,
      lineHeight: 1.2,
      shadow: { color: Palette.DarkestGreen, x: 4, y: 4, size: 16 },
      stroke: { width: 8, color: Palette.Black },
    },
    position: "center",
    translateY: { start: 50, end: 0 },
    opacity: { start: 0, end: 1 },
    float: { x: 0, y: 3, speed: 1 / 6 },
    index: 1,
  },
  {
    id: "restart",
    type: "text",
    text: "!start",
    easing: "easeOutCubic",
    layer: LayerOrder.Foreground,
    delay: 32,
    style: {
      color: Palette.Yellow,
      maxWidth: "full",
      fontSize: 24,
      fontFamily: FONT_SANS_SERIF,
      lineHeight: 1,
      shadow: { color: Palette.DarkestGreen, x: 4, y: 4, size: 16 },
      stroke: { width: 6, color: Palette.Black },
    },
    position: "bottom",
    translateY: { start: 50, end: 0 },
    opacity: { start: 0, end: 1 },
    float: { x: 0, y: 2, speed: 1 / 6 },
    index: 2,
  },
];

export const actionText: Text = {
  id: "action",
  type: "text",
  text: "",
  layer: LayerOrder.Foreground,
  easing: "easeOutCubic",
  speed: 1 / 12,
  style: {
    color: Palette.Yellow,
    maxWidth: "full",
    fontSize: 60,
    fontFamily: FONT_SANS_SERIF,
    lineHeight: 1.2,
    shadow: { color: Palette.DarkestGreen, x: 8, y: 8, size: 16 },
    stroke: { width: 16, color: Palette.Black },
  },
  position: "bottom",
  opacity: { start: 0, end: 1 },
  translateY: { start: 50, end: 0 },
  kerning: { start: 40, end: 0 },
  float: { x: 0, y: 3, speed: 1 / 6 },
  index: 0,
};

export const cardSprite: Sprite = {
  id: "default-card",
  type: "sprite",
  easing: "easeOutQuint",
  layer: LayerOrder.Background,
  speed: 1 / 12,
  sprites: [{ x: 0, y: 4992 }],
  spriteWidth: SPRITE_WIDTH,
  spriteHeight: SPRITE_HEIGHT,
};

export const animatedCardSprite: AnimatedSprite = {
  id: "animated-card",
  type: "animated-sprite",
  playback: "once",
  easing: "easeOutQuint",
  layer: LayerOrder.Background,
  spriteWidth: SPRITE_WIDTH,
  spriteHeight: SPRITE_HEIGHT,
  spriteElapsed: 0,
  spriteDuration: 1,
  spriteIndex: 0,
  sprites: [
    { x: 0, y: 4992 },
    { x: 256, y: 4992 },
    { x: 512, y: 4992 },
  ],
};

