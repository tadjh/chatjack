import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Vector3 } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const font = (size: number, font: string): string => `${size}px ${font}`;

export const rgba = (color: Vector3, alpha: number): string =>
  `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;

export const rgb = (color: Vector3): string => rgba(color, 1);

export const easeOut = (x: number, y: number): number => 1 - Math.pow(1 - x, y);

