import { Palette } from "./constants";
import { Debug } from "./debug";
import { Layer } from "./layer";
import { LAYER } from "./types";

export class StaticLayer extends Layer {
  constructor(
    id: LAYER,
    canvas: HTMLCanvasElement,
    debug = new Debug("StaticLayer", Palette.Tan)
  ) {
    super(id, "static", canvas, debug);
  }

  public resize() {
    super.resize();
  }

  public update() {
    // this.forEach((entity) => {
    //   entity.update();
    // });

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

