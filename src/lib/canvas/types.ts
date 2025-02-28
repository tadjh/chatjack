import { SpriteEntity, SpriteEntityProps } from "@/lib/canvas/entity.sprite";
import { TextEntity, TextEntityProps } from "@/lib/canvas/entity.text";
import { TimerEntity, TimerEntityProps } from "@/lib/canvas/entity.timer";

export type EntityProps =
  | SpriteEntityProps
  | TextEntityProps
  | TimerEntityProps;

export type EntityType = SpriteEntity | TextEntity | TimerEntity;

