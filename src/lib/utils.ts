import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Vector3 } from "./types";

/**
 * Merges conditional class names.
 *
 * Uses `clsx` to construct a class string from conditions and `twMerge`
 * to merge any Tailwind CSS class names.
 *
 * @param inputs - One or more values that represent class names.
 * @returns A string of merged class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

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
export function rgba(color: Vector3, alpha: number): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

/**
 * Returns an RGB color value with full opacity.
 *
 * @param color - A Vector3 representing the red, green, and blue components.
 * @returns A string usable in CSS representing an RGB color.
 */
export function rgb(color: Vector3): string {
  return rgba(color, 1);
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
