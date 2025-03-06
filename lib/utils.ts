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
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a cache key for a given scope and key.
 *
 * @param scope - The scope of the cache key.
 * @param key - The key of the cache key.
 * @returns A string of the cache key.
 */
export function getCacheKey(scope: string, key: string) {
  return `${scope}:${key}`;
}

/**
 * Returns a cache key for the moderated channels.
 *
 * @param userId - The user ID of the user.
 * @returns A string of the cache key.
 */
export function getModeratedChannelsKey(userId: string) {
  return getCacheKey("moderatedChannels", userId);
}

/**
 * Returns a cache key for the snapshot.
 *
 * @param channel - The channel of the snapshot.
 * @returns A string of the cache key.
 */
export function getSnapshotKey(channel: string) {
  return getCacheKey("snapshot", channel);
}

/**
 * Parses a string value as a boolean.
 *
 * @param str - The string value to parse.
 * @returns A boolean value.
 */
export function parseDebug(str: string | null) {
  return str === "" ? true : Boolean(str);
}
