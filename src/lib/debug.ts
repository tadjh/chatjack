import { Palette } from "./constants";
import { Vector3 } from "./types";
import { rgb } from "./utils";

/**
 * Debug utility class for conditional console logging with colored scope labels.
 * Only logs messages when NODE_ENV is set to "development".
 */
export class Debug {
  /** The scope label that will be prepended to log messages */
  scope: string;

  /** CSS color string for the scope label */
  color: string;

  /**
   * Creates a new Debug instance with a labeled scope and color.
   * @param scope - The scope name to identify this debug instance's logs
   * @param color - RGB color vector for the scope label (defaults to Palette.Green)
   */
  constructor(scope: string, color: Vector3 = Palette.Green) {
    this.scope = `[${scope}]`;
    this.color = `color: ${rgb(color)}`;
  }

  /**
   * Logs a message with the debug instance's scope and color if in development environment.
   * @param message - The main message to log
   * @param optionalParams - Additional parameters to log after the main message
   */
  public log(message?: unknown, ...optionalParams: unknown[]) {
    if (process.env.NODE_ENV === "development") {
      console.log(`%c${this.scope}`, this.color, message, ...optionalParams);
    }
  }
}

