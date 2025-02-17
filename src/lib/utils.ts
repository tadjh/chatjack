import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Vector3 } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const font = (size: number, font: string) => `${size}px ${font}`;

export const rgba = (color: Vector3, alpha: number) =>
  `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;

export const rgb = (color: Vector3) => rgba(color, 1);

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

