import { SpriteEntity, SpriteEntityProps } from "@/lib/canvas/entity.sprite";
import { TextEntity, TextEntityProps } from "@/lib/canvas/entity.text";
import { TimerEntity, TimerEntityProps } from "@/lib/canvas/entity.timer";
import {
  VignetteEntity,
  VignetteEntityProps,
} from "@/lib/canvas/entity.vignette";
export type EntityProps =
  | SpriteEntityProps
  | TextEntityProps
  | TimerEntityProps
  | VignetteEntityProps;

export type EntityType =
  | SpriteEntity
  | TextEntity
  | TimerEntity
  | VignetteEntity;

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

