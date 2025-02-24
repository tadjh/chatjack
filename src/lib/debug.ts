import { Palette } from "./constants";
import { Vector3 } from "./types";
import { rgb } from "./utils";

export class Debug {
  scope: string;
  color: string;
  constructor(scope: string, color: Vector3 = Palette.Green) {
    this.scope = `[${scope}]`;
    this.color = `color: ${rgb(color)}`;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public log(message?: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV === "development") {
      console.log(`%c${this.scope}`, this.color, message, ...optionalParams);
    }
  }
}

