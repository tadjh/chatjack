import { Palette } from "./constants";
import { Debug } from "./debug";
import { FPS } from "./renderer";
import { AnimationPhase, AnimationSpec, LAYER, Position } from "./types";
import { clamp, rgb } from "./utils";

type EntityType = "text" | "sprite" | "animated-sprite" | "timer";

interface EntityProps<
  Phase extends string,
  Props extends Record<string, number>,
> extends AnimationSpec<Phase, Props> {
  id: string;
  type: EntityType;
  layer: LAYER;
  position?: Position;
}

export abstract class Entity<
  Phase extends string,
  Props extends Record<string, number>,
> implements AnimationSpec<Phase, Props>
{
  readonly id: string;
  readonly type: EntityType;
  readonly layer: LAYER;
  readonly position: Position = "center";
  readonly speed: number;
  public progress: number = 0;
  public totalDuration: number;
  //   offsetX: number = 0;
  //   offsetY: number = 0;
  x: number = 0;
  y: number = 0;
  opacity: number = 1;
  debug: Debug;
  //   float: { x: number; y: number; speed: number } = { x: 0, y: 0, speed: 1 / 2 };
  phases: AnimationPhase<Phase, Props>[];
  props: Props;
  onBegin?: (layer: LAYER, id: string) => void | undefined;
  onEnd?: (layer: LAYER, id: string) => void | undefined;
  current: AnimationPhase<Phase, Props> | null = null;
  elapsed: number = 0;
  public localProgress: number = 0;

  constructor(
    entity: EntityProps<Phase, Props>,
    debug = new Debug("Entity", rgb(Palette.Black))
  ) {
    this.id = entity.id;
    this.type = entity.type;
    this.layer = entity.layer;
    this.phases = entity.phases;
    this.props = entity.props;
    this.debug = debug;

    if (entity.position) {
      this.position = entity.position;
    }

    if (entity.onBegin) {
      this.onBegin = entity.onBegin;
    }

    if (entity.onEnd) {
      this.onEnd = entity.onEnd;
    }

    if (entity.onBegin) {
      this.onBegin = entity.onBegin;
      this.debug.log(`${this.id} called onBegin`);
      this.onBegin(this.layer, this.id);
    }

    this.totalDuration = this.phases.reduce(
      (sum, phase) => sum + phase.duration,
      0
    );

    this.speed = 1 / (this.totalDuration * FPS);
  }

  setPhase() {
    let count = 0;
    let elapsed = 0;
    let current = this.phases[this.phases.length - 1];
    for (const p of this.phases) {
      count += p.duration;
      if (this.progress * this.totalDuration <= count) {
        current = p;
        break;
      }
      elapsed = count;
    }
    this.current = current;
    this.elapsed = elapsed;
  }

  setLocalProgress() {
    if (this.current === null) {
      throw new Error("No current phase for local progress");
    }
    const localProgress =
      (this.progress * this.totalDuration - this.elapsed) /
      this.current.duration;
    this.localProgress = clamp(localProgress, 0, 1);
  }

  update() {
    this.progress = Math.min(this.progress + this.speed, 1);
    this.setPhase();
    this.setLocalProgress();
  }

  abstract resize(scaleFactor: number): void;
  abstract easing(): void;
  abstract interpolate(): void;
  abstract render(ctx: CanvasRenderingContext2D): void;
}

