import { useEffect, useRef } from "react";

const TITLE_TEXT = "ChatJack";
const SUBTITLE_TEXT = "Twitch Chat Plays Blackjack";
const FONT_NAME = "Jacquard";
const FPS = 12;
const TICK_RATE = 1000 / FPS;
const FADE_SPEED = 0.1;
const SPACING = { 1: 4, 2: 8, 4: 16, 8: 32 } as const;
const SUBTITLE_DELAY_FRAMES = 12;

type Vector3 = [number, number, number];

const Palette: Record<string, Vector3> = {
  White: [255, 255, 255],
  LightestGrey: [192, 203, 220], // "#c0cbdc"
  LightGrey: [139, 155, 180], // "#8b9bb4"
  Grey: [90, 105, 136], // "#5a6988"
  DarkGrey: [58, 68, 102], // "#3a4466"
  DarkestGrey: [38, 43, 68], // "#262b44"
  Black: [24, 20, 37], // "#181425"
  LightRed: [228, 59, 68], // "#e43b44"
  Red: [158, 40, 53], // "#9e2835"
  DarkRed: [63, 40, 50], // "#3f2832"
  LightGreen: [99, 199, 77], // "#63c74d"
  Green: [62, 137, 72], // "#3e8948"
  DarkGreen: [38, 92, 66], // "#265c42"
  DarkestGreen: [25, 60, 62], // "#193c3e"
  LightBlue: [44, 232, 245], // "#2ce8f5"
  Blue: [0, 149, 233], // "#0095e9"
  DarkBlue: [18, 78, 137], // "#124e89"
  Yellow: [254, 231, 97], // "#fee761"
  YellowOrange: [254, 174, 52], // "#feae34"
  Orange: [247, 118, 34], // "#f77622"
} as const;

const font = (size: number) => `${size}px ${FONT_NAME}`;
const spacing = (size: keyof typeof SPACING = 1) => SPACING[size];
const rgba = (color: Vector3, alpha: number) =>
  `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
const rgb = (color: Vector3) => rgba(color, 1);

export function Blackjack() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastTick = useRef(0);
  const fadeTitle = useRef(0);
  const fadeSubtitle = useRef(0);
  const frameCount = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawBackground = () => {
      ctx.fillStyle = rgb(Palette.DarkGreen);
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawText = () => {
      const maxWidth = canvas.width * 0.8;
      let titleFontSize = canvas.width * 0.15;
      ctx.font = font(titleFontSize);
      let titleWidth = ctx.measureText(TITLE_TEXT).width;

      if (titleWidth > maxWidth) {
        titleFontSize *= maxWidth / titleWidth;
      }

      ctx.font = font(titleFontSize);
      titleWidth = ctx.measureText(TITLE_TEXT).width;

      let subtitleFontSize = titleFontSize;
      ctx.font = font(subtitleFontSize);
      const subtitleWidth = ctx.measureText(SUBTITLE_TEXT).width;

      if (subtitleWidth !== titleWidth) {
        subtitleFontSize *= titleWidth / subtitleWidth;
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 3;

      if (fadeTitle.current > 0) {
        // shadow
        ctx.strokeStyle = rgba(Palette.DarkestGreen, fadeTitle.current);
        ctx.textAlign = "center";
        ctx.lineWidth = titleFontSize / spacing(4);
        ctx.strokeText(TITLE_TEXT, centerX + spacing(2), centerY + spacing(2));

        // stroke
        ctx.strokeStyle = rgba(Palette.Black, fadeTitle.current);
        ctx.textAlign = "center";
        ctx.lineWidth = titleFontSize / spacing(4);
        ctx.strokeText(TITLE_TEXT, centerX, centerY);

        // title
        ctx.font = font(titleFontSize);
        ctx.fillStyle = rgba(Palette.Yellow, fadeTitle.current);
        ctx.textAlign = "center";
        ctx.fillText(TITLE_TEXT, centerX, centerY);
      }

      if (fadeSubtitle.current > 0) {
        const lineHeight = subtitleFontSize * 1.2;
        ctx.font = font(subtitleFontSize);

        // shadow
        ctx.strokeStyle = rgba(Palette.DarkestGreen, fadeSubtitle.current);
        ctx.textAlign = "center";
        ctx.lineWidth = subtitleFontSize / spacing(4);
        ctx.strokeText(
          SUBTITLE_TEXT,
          centerX + spacing(),
          centerY + spacing() + lineHeight
        );

        // stroke
        ctx.strokeStyle = rgba(Palette.Black, fadeSubtitle.current);
        ctx.textAlign = "center";
        ctx.lineWidth = subtitleFontSize / spacing(2);
        ctx.strokeText(SUBTITLE_TEXT, centerX, centerY + lineHeight);

        // subtitle
        ctx.font = font(subtitleFontSize);
        ctx.fillStyle = rgba(Palette.Yellow, fadeSubtitle.current);
        ctx.textAlign = "center";
        ctx.fillText(SUBTITLE_TEXT, centerX, centerY + lineHeight);
      }
    };

    const drawCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBackground();
      drawText();
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawCanvas();
    };

    const gameLoop = (timestamp: number) => {
      if (timestamp - lastTick.current >= TICK_RATE) {
        lastTick.current = timestamp;

        if (fadeTitle.current < 1) {
          fadeTitle.current += FADE_SPEED;
          fadeTitle.current = Math.min(fadeTitle.current, 1);
        }

        if (frameCount.current >= SUBTITLE_DELAY_FRAMES) {
          if (fadeSubtitle.current < 1) {
            fadeSubtitle.current += FADE_SPEED;
            fadeSubtitle.current = Math.min(fadeSubtitle.current, 1);
          }
        } else {
          frameCount.current += 1;
        }

        drawCanvas();
      }
      requestAnimationFrame(gameLoop);
    };

    resizeCanvas();

    requestAnimationFrame(gameLoop);

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  });

  return <canvas id="canvas" ref={canvasRef}></canvas>;
}

