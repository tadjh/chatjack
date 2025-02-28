import { Palette } from "./constants";
import { Debug } from "./debug";
import { TextEntity } from "./entity.text";
import { Layer } from "./layer";
import { LAYER } from "./types";

export class DynamicLayer extends Layer {
  constructor(
    id: LAYER,
    canvas: HTMLCanvasElement,
    debug = new Debug("DynamicLayer", Palette.Tan)
  ) {
    super(id, "dynamic", canvas, debug);
  }

  public resize() {
    super.resize();
  }

  public update() {
    this.forEach((entity) => {
      if (entity.delay && entity.delay > 0) {
        entity.delay -= 1;
        entity.props.opacity = 0;
        return;
      }

      if (entity.startTime === 0) {
        entity.startTime = performance.now();
      }

      entity.update();
    });
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
      entity.render(this.ctx);
    });

    if (action) {
      action.render(this.ctx);
    }
  }

  public clear() {
    super.clear();
  }
}

