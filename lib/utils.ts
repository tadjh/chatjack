import { RenderMode } from "@/lib/canvas/renderer";
import { CURRENT_URL } from "@/lib/constants";
import { Props } from "@/lib/types";
import { clsx, type ClassValue } from "clsx";
import { Metadata } from "next";
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
export function parseBoolean(str: string | null): boolean {
  return str === "" ? true : Boolean(str);
}

/**
 * Parses a string value as a number.
 *
 * @param value - The string value to parse.
 * @param fallback - The fallback value to return if parsing fails.
 * @returns A number value.
 */
export function parseNumber(value: string | null, fallback = 0): number {
  if (!value) return fallback;
  const num = parseInt(value);
  if (isNaN(num)) return fallback;
  return num;
}

/**
 * Capitolizes the first letter of a string.
 *
 * @param str - The string to capitalize.
 * @returns The capitalized string.
 */
export function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Formats metadata for a given mode and channel.
 *
 * @param params - The parameters for the metadata.
 * @param mode - The mode of the metadata.
 * @returns A Metadata object.
 */
export async function formatMetadata(
  { params }: Pick<Props, "params">,
  mode: RenderMode,
): Promise<Metadata> {
  const { channel } = await params;
  if (!channel) {
    throw new Error("Channel is required for metadata formatting");
  }
  const title = `${capitalize(mode)} - ${channel} - ChatJack`;
  const description = `${mode === "play" ? "Host" : "Watch"} a ChatJack session for ${channel}`;
  const url = `${CURRENT_URL}/${mode}/${channel}`;
  const imageUrl = `${url}/opengraph-image`;
  return {
    title,
    description,
    authors: [{ name: "Tadjh", url: "https://tadjh.com" }],
    keywords: ["Twitch", "Blackjack", "Chat", "Game", "Play", "ChatJack"],
    creator: "Tadjh",
    publisher: "Tadjh",
    applicationName: "ChatJack",
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "ChatJack",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@tadjh_",
      creator: "@tadjh_",
    },
  };
}
