import { rgb } from "@/lib/canvas/utils";
import { Palette } from "@/lib/constants";
import { z } from "zod";

export const DebugSchema = z.object({
  scope: z.string(),
  color: z.string(),
  enabled: z.boolean(),
});

export type DebugJSON = z.infer<typeof DebugSchema>;

/**
 * Debug utility class for conditional console logging with colored scope labels.
 * Only logs messages when NODE_ENV is set to "development".
 */
export class Debug {
  /** The scope label that will be prepended to log messages */
  readonly scope: string;

  /** CSS color string for the scope label */
  readonly color: string;

  /** Whether the debug instance is enabled */
  readonly enabled: boolean;

  /**
   * Creates a new Debug instance with a labeled scope and color.
   * @param scope - The scope name to identify this debug instance's logs
   * @param color - RGB color vector for the scope label (defaults to Palette.Green)
   */
  constructor(
    scope: string,
    color: keyof typeof Palette = "Green",
    enabled = process.env.NEXT_PUBLIC_DEBUG === "true",
  ) {
    this.scope = `[${scope}]`;
    this.color = `color: ${rgb(Palette[color])}`;
    this.enabled = enabled;
  }

  /**
   * Logs a message with the debug instance's scope and color if in development environment.
   * @param message - The main message to log
   * @param optionalParams - Additional parameters to log after the main message
   */
  public log(message?: unknown, ...optionalParams: unknown[]) {
    if (this.enabled) {
      console.log(`%c${this.scope}`, this.color, message, ...optionalParams);
    }
  }

  /**
   * Logs an error message with the debug instance's scope and color if in development environment.
   * @param message - The main message to log
   * @param optionalParams - Additional parameters to log after the main message
   */
  public error(message?: unknown, ...optionalParams: unknown[]) {
    if (this.enabled) {
      console.error(`%c${this.scope}`, this.color, message, ...optionalParams);
    }
  }

  public toJSON(): DebugJSON {
    return {
      scope: this.scope,
      color: this.color,
      enabled: this.enabled,
    };
  }

  public static fromJSON(json: DebugJSON) {
    return new Debug(json.scope, json.color, json.enabled);
  }
}
