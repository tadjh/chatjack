import { SpriteEntity, SpriteEntityProps } from "@/lib/canvas/entity.sprite";
import { TextEntity, TextEntityProps } from "@/lib/canvas/entity.text";
import { TimerEntity, TimerEntityProps } from "@/lib/canvas/entity.timer";

export type EntityProps =
  | SpriteEntityProps
  | TextEntityProps
  | TimerEntityProps;

export type EntityType = SpriteEntity | TextEntity | TimerEntity;

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

