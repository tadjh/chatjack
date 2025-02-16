import { useEffect, useRef } from "react";

const TITLE_TEXT = "ChatJack";
const SUBTITLE_TEXT = "Twitch Chat Plays Blackjack";
const FONT_NAME = "Jacquard";
const FPS = 12;
const TICK_RATE = 1000 / FPS;
const ANIMATION_SPEED = 1 / 24;
const FLOAT_SPEED = 1 / 6;
const FLOAT_AMPLITUDE = 3;
const SPACING = { 1: 4, 2: 8, 4: 16, 8: 32 } as const;
const isDevelopment = import.meta.env.MODE === "development";

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
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function Blackjack() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastTickRef = useRef(0);
  const timeRef = useRef(0);
  const animationsRef = useRef([
    {
      id: "title",
      text: TITLE_TEXT,
      color: Palette.Yellow,
      progress: { fade: 0, slide: 0, kerning: 0 },
      fadeInDelay: 0,
      maxWidth: "full",
      offsetX: { start: 0, end: 0 },
      offsetY: { start: 50, end: 0 },
      kerning: { start: 40, end: 0 },
      shadow: {
        color: Palette.DarkestGreen,
        x: spacing(2),
        y: spacing(2),
        size: spacing(4),
      },
      stroke: {
        width: spacing(4),
        color: Palette.Black,
      },
    },
    {
      id: "subtitle",
      text: SUBTITLE_TEXT,
      color: Palette.Yellow,
      progress: { fade: 0, slide: 0, kerning: 1 },
      fadeInDelay: 12,
      maxWidth: "title",
      offsetX: { start: 0, end: 0 },
      offsetY: { start: 50, end: 0 },
      kerning: { start: 0, end: 0 },
      shadow: {
        color: Palette.DarkestGreen,
        x: spacing(),
        y: spacing(),
        size: spacing(4),
      },
      stroke: {
        width: spacing(2),
        color: Palette.Black,
      },
    },
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loadFont = async () => {
      const font = new FontFace(
        "Jacquard",
        `url("${isDevelopment ? "/src" : ""}/assets/fonts/Jacquard24-Regular.ttf")`
      );
      if (!document.fonts.has(font)) {
        await font.load();
        document.fonts.add(font);
      } else {
        return Promise.resolve();
      }
    };

    const drawBackground = () => {
      ctx.fillStyle = rgb(Palette.DarkGreen);
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawText = () => {
      const baseMaxWidth = canvas.width * 0.8;
      const baseFontSize = canvas.width * 0.15;
      const baseCenterX = canvas.width / 2;
      const baseCenterY = canvas.height / 3;

      ctx.textAlign = "center";
      ctx.fillStyle = rgb(Palette.White);

      const widthMap: Map<string, number> = new Map();

      animationsRef.current.forEach((anim, index) => {
        let fontSize = baseFontSize;
        ctx.font = font(fontSize);

        const textWidth = ctx.measureText(anim.text).width;
        let maxWidth = baseMaxWidth;

        if (anim.maxWidth !== "full" || anim.maxWidth !== undefined) {
          maxWidth = widthMap.get(anim.maxWidth) || maxWidth;
        }

        if (textWidth > maxWidth) {
          fontSize *= maxWidth / textWidth;
          ctx.font = font(fontSize);
        }
        const opacity = easeOutCubic(anim.progress.fade);

        let offsetX = anim.offsetX.end;
        let offsetY = anim.offsetY.end;
        let kerning = anim.kerning.end;

        if (anim.offsetX.start !== anim.offsetX.end) {
          offsetX =
            anim.offsetX.start +
            (anim.offsetX.end - anim.offsetX.start) *
              easeOutCubic(anim.progress.slide);
        }

        if (anim.offsetY.start !== anim.offsetY.end) {
          offsetY =
            anim.offsetY.start +
            (anim.offsetY.end - anim.offsetY.start) *
              easeOutCubic(anim.progress.slide);
        }

        if (anim.kerning.start !== anim.kerning.end) {
          kerning =
            anim.kerning.start +
            (anim.kerning.end - anim.kerning.start) *
              easeOutCubic(anim.progress.kerning);
        }

        offsetY += Math.sin(timeRef.current * FLOAT_SPEED) * FLOAT_AMPLITUDE;

        const lineHeight = fontSize * 1.2;
        const centerX = baseCenterX + offsetX;
        const centerY = baseCenterY + offsetY + index * lineHeight;
        ctx.letterSpacing = `${kerning}px`;

        widthMap.set(anim.id, ctx.measureText(anim.text).width);

        const shadowOffset = anim.progress.fade >= 1 ? offsetY : 0;

        if (Object.hasOwnProperty.call(anim, "shadow")) {
          ctx.strokeStyle = rgba(anim.shadow.color, opacity);
          ctx.lineWidth = fontSize / anim.shadow.size;
          ctx.strokeText(
            anim.text,
            centerX + anim.shadow.x,
            centerY + anim.shadow.y - shadowOffset
          );
        }

        if (Object.hasOwnProperty.call(anim, "stroke")) {
          ctx.strokeStyle = rgba(anim.stroke.color, opacity);
          ctx.lineWidth = fontSize / anim.stroke.width;
          ctx.strokeText(anim.text, centerX, centerY);
        }

        ctx.fillStyle = rgba(anim.color, opacity);
        ctx.fillText(anim.text, centerX, centerY);
      });
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
      if (timestamp - lastTickRef.current >= TICK_RATE) {
        lastTickRef.current = timestamp;
        timeRef.current += 1;

        animationsRef.current.forEach((anim) => {
          if (anim.fadeInDelay > 0) {
            anim.fadeInDelay -= 1; // Wait for delay before fading
          } else {
            if (anim.progress.fade < 1) {
              anim.progress.fade += ANIMATION_SPEED;
              if (anim.progress.fade > 1) anim.progress.fade = 1;
            }

            if (anim.progress.slide < 1) {
              anim.progress.slide += ANIMATION_SPEED;
              if (anim.progress.slide > 1) anim.progress.slide = 1;
            }

            if (anim.progress.kerning < 1) {
              anim.progress.kerning += ANIMATION_SPEED;
              if (anim.progress.kerning > 1) anim.progress.kerning = 1;
            }
          }
        });

        drawCanvas();
      }
      requestAnimationFrame(gameLoop);
    };

    const init = async () => {
      await loadFont();
      resizeCanvas();
      requestAnimationFrame(gameLoop);
    };

    init();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  });

  return <canvas id="canvas" ref={canvasRef}></canvas>;
}

