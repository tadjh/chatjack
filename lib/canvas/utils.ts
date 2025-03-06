import { Vector3 } from "@/lib/types";
import { BASELINE_HEIGHT, BASELINE_WIDTH } from "@/lib/canvas/constants";
/**
 * Constructs a font style string.
 *
 * @param size - The font size in pixels.
 * @param font - The font family name.
 * @returns A string representing the CSS font property.
 */
export function font(size: number, font: string): string {
  return `${size}px ${font}`;
}

/**
 * Converts an RGB vector and an alpha value to an RGBA string.
 *
 * @param color - A Vector3 representing the red, green, and blue components.
 * @param alpha - The alpha (opacity) value.
 * @returns A string usable in CSS representing an RGBA color.
 */
export function rgba(color: Vector3, alpha: number = 1): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

/**
 * Converts an RGB vector to an RGB string.
 *
 * @param color - A Vector3 representing the red, green, and blue components.
 * @returns A string usable in CSS representing an RGB color.
 */
export function rgb(color: Vector3): string {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

/**
 * Applies an ease-out function to a given value.
 *
 * This function calculates an easing value for smoother animations.
 *
 * @param x - The current time or progress value.
 * @param y - The easing exponent; a higher value will result in a slower start.
 * @returns The eased value.
 */
export function easeOut(x: number, y: number): number {
  return 1 - Math.pow(1 - x, y);
}

/**
 * Applies an ease-out cubic function to a given value.
 *
 * This function calculates an easing value for smoother animations.
 *
 * @param x - The current time or progress value.
 * @returns The eased value.
 */
export function easeOutCubic(x: number): number {
  return easeOut(x, 3);
}

/**
 * Applies an "ease out back" easing function to the given normalized value.
 *
 * This function creates an animation effect where the transition overshoots slightly
 * before smoothly easing into the final state.
 *
 * @param x - The normalized input value (typically between 0 and 1).
 * @returns The eased output value.
 */
export function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;

  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/**
 * Applies an "ease out bounce" easing function to the given normalized value.
 *
 * This function creates an animation effect where the transition overshoots slightly
 * before smoothly easing into the final state.
 *
 * @param x - The normalized input value (typically between 0 and 1).
 * @returns The eased output value.
 */
export function easeOutBounce(x: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (x < 1 / d1) {
    return n1 * x * x;
  } else if (x < 2 / d1) {
    return n1 * (x -= 1.5 / d1) * x + 0.75;
  } else if (x < 2.5 / d1) {
    return n1 * (x -= 2.25 / d1) * x + 0.9375;
  } else {
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
}

/**
 * Applies an "ease in bounce" easing function to the given normalized value.
 *
 * This function creates an animation effect where the transition overshoots slightly
 * before smoothly easing into the final state.
 *
 * @param x - The normalized input value (typically between 0 and 1).
 * @returns The eased output value.
 */
export function easeInBounce(x: number): number {
  return 1 - easeOutBounce(1 - x);
}

/**
 * Applies an "ease in out bounce" easing function to the given normalized value.
 *
 * This function creates an animation effect where the transition overshoots slightly
 * before smoothly easing into the final state.
 *
 * @param x - The normalized input value (typically between 0 and 1).
 * @returns The eased output value.
 */
export function easeInOutBounce(x: number): number {
  return x < 0.5
    ? (1 - easeOutBounce(1 - 2 * x)) / 2
    : (1 + easeOutBounce(2 * x - 1)) / 2;
}

/**
 * Linearly interpolates between two values.
 *
 * This function calculates an intermediate value between `start` and `end`
 * based on the interpolation factor `t` where t=0 returns `start` and t=1 returns `end`.
 * A warning is logged if t is outside of the [0, 1] range.
 *
 * @param start - The starting value.
 * @param end - The ending value.
 * @param t - The interpolation factor, usually between 0 and 1.
 * @returns The interpolated number between `start` and `end`.
 */
export function lerp(start: number, end: number, t: number): number {
  if (t < 0 || t > 1) {
    console.warn("lerp: interpolation factor t is outside the [0, 1] range.");
  }
  return start + (end - start) * t;
}

/**
 * Clamps a number within the inclusive [min, max] range.
 *
 * If the value is below the minimum, the minimum is returned;
 * if it is above the maximum, the maximum is returned.
 *
 * @param value - The value to clamp.
 * @param min - The lower boundary.
 * @param max - The upper boundary.
 * @returns The clamped value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Converts degrees to radians.
 *
 * @param degrees - The angle in degrees.
 * @returns The angle in radians.
 */
export function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates the scale factor based on the window dimensions.
 *
 * This function determines the scale factor by comparing the window's width and height
 * to the baseline dimensions. It returns the smaller of the two ratios, ensuring that
 * the canvas is not scaled beyond the available space.
 *
 * @returns The scale factor.
 */
export function getScaleFactor(): number {
  return Math.min(getHorizontalScaleFactor(), getVerticalScaleFactor());
}

/**
 * Calculates the vertical scale factor based on the window dimensions.
 *
 * This function determines the vertical scale factor by comparing the window's height
 * to the baseline height.
 *
 * @returns The vertical scale factor.
 */
export function getVerticalScaleFactor(): number {
  if (typeof window !== "undefined") {
    return window.innerHeight / BASELINE_HEIGHT;
  }
  return 1;
}

/**
 * Calculates the horizontal scale factor based on the window dimensions.
 *
 * This function determines the horizontal scale factor by comparing the window's width
 * to the baseline width.
 *
 * @returns The horizontal scale factor.
 */
export function getHorizontalScaleFactor(): number {
  if (typeof window !== "undefined") {
    return window.innerWidth / BASELINE_WIDTH;
  }
  return 1;
}
