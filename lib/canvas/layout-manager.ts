import { BASELINE_GUTTER, BASELINE_PADDING } from "@/lib/canvas/constants";
import { TextEntity } from "@/lib/canvas/entity.text";
import { POSITION } from "@/lib/canvas/types";
import {
  getHorizontalScaleFactor,
  getVerticalScaleFactor,
} from "@/lib/canvas/utils";
import { Debug } from "@/lib/debug";

enum DIRECTION {
  UP = -1,
  DOWN = 1,
}

export class LayoutManager {
  #layouts: Map<POSITION, Generator<number, number, number>> = new Map();
  #padding: number;
  #gutter: number;
  debug: Debug;

  constructor(
    padding: number = getHorizontalScaleFactor() * BASELINE_PADDING,
    gutter: number = getVerticalScaleFactor() * BASELINE_GUTTER,
    debug = new Debug("LayoutManager", "DarkTan")
  ) {
    this.#padding = padding;
    this.#gutter = gutter;
    this.debug = debug;
  }

  public update(entities: TextEntity[]) {
    this.debug.log("Refreshing layouts");
    this.reset();
    this.init();
    this.place(entities);
  }

  private init() {
    this.#padding = getHorizontalScaleFactor() * BASELINE_PADDING;
    this.#gutter = getVerticalScaleFactor() * BASELINE_GUTTER;
    for (const position of Object.values(POSITION)) {
      let initialY: number;
      let direction = DIRECTION.DOWN;
      let gutterMultiplier = 1;

      switch (position) {
        case POSITION.TOP:
        case POSITION.TOP_LEFT:
        case POSITION.TOP_RIGHT:
          initialY = this.#padding;
          break;
        case POSITION.BOTTOM:
        case POSITION.BOTTOM_LEFT:
        case POSITION.BOTTOM_RIGHT:
          initialY = window.innerHeight - this.#padding;
          direction = DIRECTION.UP;
          break;
        case POSITION.EYELINE:
          initialY = window.innerHeight / 4;
          gutterMultiplier = 4;
          break;
        case POSITION.CENTER:
        case POSITION.LEFT:
        case POSITION.RIGHT:
          initialY = window.innerHeight / 2;
          break;
        default:
          initialY = this.#padding;
      }

      this.#layouts.set(
        position,
        verticalLayoutGenerator(
          initialY,
          this.#gutter * gutterMultiplier,
          direction
        )
      );
    }
  }

  // TODO Extend for non-text entities.
  private place(entities: TextEntity[]) {
    for (const entity of entities) {
      if (!this.#layouts.has(entity.position)) {
        throw new Error(`No layout for ${entity.position}`);
      }
      const nextY = this.#layouts
        .get(entity.position)!
        .next(entity.height).value;

      let offsetY = 0;

      switch (entity.position) {
        case POSITION.TOP:
        case POSITION.TOP_LEFT:
        case POSITION.TOP_RIGHT:
          break;
        case POSITION.BOTTOM:
        case POSITION.BOTTOM_LEFT:
        case POSITION.BOTTOM_RIGHT:
          offsetY = entity.height;
          break;
        case POSITION.EYELINE:
        case POSITION.CENTER:
        case POSITION.LEFT:
        case POSITION.RIGHT:
          offsetY = entity.height / 2;
          break;
        default:
          offsetY = 0;
      }

      entity.y = nextY - offsetY;

      this.debug.log(`Adding ${entity.id} to layout: ${entity.position}`);
    }
  }

  private reset() {
    this.#layouts.forEach((layout) => layout.return(0));
    this.#layouts.clear();
  }
}

export function* verticalLayoutGenerator(
  initialY: number,
  gutter: number = 10,
  direction: DIRECTION = DIRECTION.DOWN
): Generator<number, number, number> {
  let currentY = initialY;
  while (true) {
    // Yield the current Y position, then update with the provided entity height.
    const height = yield currentY;
    currentY = currentY + (height + gutter) * direction;
  }
}
