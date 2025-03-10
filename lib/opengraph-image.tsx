/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "ChatJack - Twitch Chat plays BlackJack";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// Types for the loadAssets function result
export interface LoadedAssets {
  pressStart2P: Buffer;
  bgImageSrc: ArrayBuffer;
}

// Extracted function to make it testable
export async function loadAssets(): Promise<LoadedAssets> {
  const pressStart2P = await readFile(
    join(process.cwd(), "assets/fonts/PressStart2P-Regular.ttf"),
  );
  const background = await readFile(
    join(process.cwd(), "assets/images/opengraph-image.png"),
  );
  const bgImageSrc = Uint8Array.from(background).buffer;

  return {
    pressStart2P,
    bgImageSrc,
  };
}

export default async function OpenGraphImage({
  params,
}: {
  params: { channel?: string };
}) {
  const { pressStart2P, bgImageSrc } = await loadAssets();

  const channelText = params.channel ? params.channel : "";

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 40,
          color: "#fee761",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          textShadow:
            "0px -3px 0px #181425, \
            0px 3px 0px #181425, \
            -3px 0px 0px #181425, \
            3px 0px 0px #181425, \
            -3px -3px 0px #181425, \
            -3px 3px 0px #181425, \
            3px 3px 0px #181425, \
            3px -3px 0px #181425, \
            7px 7px 0px #193c3e",
        }}
      >
        <img
          src={bgImageSrc as unknown as string}
          alt={alt}
          width={size.width}
          height={size.height}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <p>{channelText}</p>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Press Start 2P",
          data: pressStart2P,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
