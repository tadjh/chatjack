import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
