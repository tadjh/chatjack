import { Layer } from "@/lib/canvas/layer";
import { LAYER } from "@/lib/canvas/types";
import { Debug } from "@/lib/debug";

export class StaticLayer extends Layer {
  constructor(
    id: LAYER,
    canvas: HTMLCanvasElement,
    debug = new Debug("StaticLayer", "Tan")
  ) {
    super(id, "static", canvas, debug);
  }

  public resize() {
    super.resize();
  }

  public update() {
    this.shouldUpdate = false;
  }

  public render() {
    this.clearRect();

    this.forEach((entity) => {
      entity.render(this.ctx);
    });

    this.shouldRender = false;
  }

  public clear() {
    super.clear();
  }
}

