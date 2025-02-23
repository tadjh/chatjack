import { Palette } from "./constants";
import { rgb } from "./utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
export class Debug {
  constructor(
    private scope: string,
    private color = rgb(Palette.Green)
  ) {}
  public log(message?: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `%c[${this.scope}]`,
        `color: ${this.color}`,
        message,
        ...optionalParams
      );
    }
  }
}

