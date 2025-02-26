import { Palette } from "./constants";
import { Debug } from "./debug";
import { TextEntity } from "./entity.text";
import { EntityTypes, BaseEntityType, LAYER } from "./types";

export class Layer extends Map<string, EntityTypes> {
  readonly id: LAYER;
  #canvas: HTMLCanvasElement;
  #ctx: CanvasRenderingContext2D;
  protected debug: Debug;

  constructor(
    id: LAYER,
    canvas: HTMLCanvasElement,
    debug = new Debug(id, Palette.Tan)
  ) {
    super();
    this.#canvas = canvas;
    const ctx = this.#canvas.getContext("2d");
    if (!ctx) {
      throw new Error("2d rendering context not supported");
    }
    this.id = id;
    this.debug = debug;
    this.#ctx = ctx;
    this.#ctx.imageSmoothingEnabled = false;
    this.#canvas.style.position = "absolute";
    this.#canvas.style.top = "0";
    this.#canvas.style.left = "0";
    this.#canvas.style.zIndex = id;
  }

  public getByType(type: BaseEntityType) {
    return Array.from(this.values()).filter((entity) => entity.type === type);
  }

  private clearRect() {
    this.#ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  public render() {
    this.clearRect();

    let action: TextEntity | undefined;

    this.forEach((entity) => {
      if (entity.id === "action") {
        action = entity as TextEntity;
        return;
      }
      if (entity.delay > 0) return;
      entity.render(this.#ctx);
    });

    if (action) {
      action.render(this.#ctx);
    }
  }

  public resize() {
    this.debug.log(`Resizing ${this.id}`);
    const ratio = window.devicePixelRatio || 1;
    this.#canvas.width = window.innerWidth * ratio;
    this.#canvas.height = window.innerHeight * ratio;
    this.#canvas.style.width = `${window.innerWidth}px`;
    this.#canvas.style.height = `${window.innerHeight}px`;
    this.#ctx.scale(ratio, ratio);
    this.forEach((entity) => entity.resize());
  }

  public clear() {
    this.debug.log(`Clearing ${this.id}`);
    super.clear();
    this.clearRect();
  }
}
