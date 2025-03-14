import { EntityType, LAYER } from "@/lib/canvas/types";
import { Debug } from "@/lib/debug";

export abstract class Layer extends Map<string, EntityType> {
  readonly id: LAYER;
  readonly type: "static" | "dynamic";
  public shouldUpdate = true;
  public shouldRender = true;
  #canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected debug: Debug;

  constructor(
    id: LAYER,
    type: "static" | "dynamic",
    canvas: HTMLCanvasElement,
    debug = new Debug(id, "Tan"),
  ) {
    super();
    this.#canvas = canvas;
    const ctx = this.#canvas.getContext("2d");
    if (!ctx) {
      throw new Error("2d rendering context not supported");
    }
    this.id = id;
    this.debug = debug;
    this.ctx = ctx;
    this.type = type;
    this.ctx.imageSmoothingEnabled = false;
    this.#canvas.style.position = "absolute";
    this.#canvas.style.top = "0";
    this.#canvas.style.left = "0";
    this.#canvas.style.zIndex =
      id === LAYER.BG ? "0" : id === LAYER.GAME ? "1" : "2";
  }

  public getByType(type: EntityType["type"]) {
    return Array.from(this.values()).filter((entity) => entity.type === type);
  }

  public requestUpdate() {
    this.shouldUpdate = true;
    this.shouldRender = true;
  }

  protected clearRect() {
    this.ctx.clearRect(
      0,
      0,
      document.documentElement.clientWidth,
      document.documentElement.clientHeight,
    );
  }

  abstract render(): void;

  public resize() {
    this.debug.log(`Resizing ${this.id}`);
    const ratio = window.devicePixelRatio || 1;
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    this.#canvas.width = Math.floor(width * ratio);
    this.#canvas.height = Math.floor(height * ratio);
    this.#canvas.style.width = `${width}px`;
    this.#canvas.style.height = `${height}px`;
    this.ctx.scale(ratio, ratio);
    this.forEach((entity) => entity.resize());
  }

  abstract update(): void;

  public clear() {
    this.debug.log(`Clearing ${this.id}`);
    super.clear();
    this.clearRect();
    this.shouldUpdate = true;
    this.shouldRender = true;
  }
}
