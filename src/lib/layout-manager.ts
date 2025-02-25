import { PADDING } from "./constants";
import { TextEntity } from "./entity.text";
import { Position } from "./types";

enum DIRECTION {
  UP = -1,
  DOWN = 1,
}

export class LayoutManager {
  #layouts: Map<Position, Generator<number, number, number>> = new Map();
  #padding: number;
  #gutter: number;

  constructor(
    padding: number = window.innerWidth * PADDING,
    gutter: number = (window.innerWidth * PADDING) / 4
  ) {
    this.#padding = padding;
    this.#gutter = gutter;
    this.init();
  }

  init() {
    this.#layouts.set(
      "top left",
      verticalLayoutGenerator(this.#padding, this.#gutter, DIRECTION.DOWN)
    );
    this.#layouts.set(
      "bottom left",
      verticalLayoutGenerator(
        window.innerHeight - this.#padding,
        this.#gutter,
        DIRECTION.UP
      )
    );
    this.#layouts.set(
      "eyeline",
      verticalLayoutGenerator(
        window.innerHeight / 3,
        this.#gutter,
        DIRECTION.DOWN
      )
    );
  }

  // TODO Extend for non-text entities.
  update(entities: TextEntity[]) {
    for (const entity of entities) {
      if (!this.#layouts.has(entity.position)) {
        throw new Error(`No layout for ${entity.position}`);
      }
      const nextY = this.#layouts
        .get(entity.position)!
        .next(entity.height).value;
      if (entity.position.includes("bottom")) {
        entity.y = nextY - entity.height;
      } else {
        entity.y = nextY;
      }
    }
  }

  reset() {
    this.#layouts.forEach((layout) => layout.return(0));
    this.#layouts.clear();
    this.init();
  }
}

function* verticalLayoutGenerator(
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

