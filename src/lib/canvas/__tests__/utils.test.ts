import { BASELINE_HEIGHT, BASELINE_WIDTH } from "@/lib/canvas/constants";
import {
  clamp,
  easeOut,
  easeOutBack,
  easeOutCubic,
  font,
  getHorizontalScaleFactor,
  getScaleFactor,
  getVerticalScaleFactor,
  lerp,
  radians,
  rgb,
  rgba,
} from "@/lib/canvas/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("utils", () => {
  it("should create font string", () => {
    expect(font(16, "Arial")).toBe("16px Arial");
    expect(font(24, "Helvetica")).toBe("24px Helvetica");
  });

  it("should create rgba string", () => {
    expect(rgba([255, 0, 0])).toBe("rgba(255, 0, 0, 1)");
    expect(rgba([0, 255, 0], 0.5)).toBe("rgba(0, 255, 0, 0.5)");
  });

  it("should create rgb string", () => {
    expect(rgb([255, 0, 0])).toBe("rgb(255, 0, 0)");
    expect(rgb([0, 255, 0])).toBe("rgb(0, 255, 0)");
  });

  it("should calculate easeOut correctly", () => {
    expect(easeOut(0.5, 2)).toBeCloseTo(0.75);
    expect(easeOut(0, 2)).toBe(0);
    expect(easeOut(1, 2)).toBe(1);
  });

  it("should calculate easeOutCubic correctly", () => {
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it("should calculate easeOutBack correctly", () => {
    expect(easeOutBack(0)).toBeCloseTo(0);
    expect(easeOutBack(1)).toBeCloseTo(1);
    expect(easeOutBack(0.5)).toBeGreaterThan(0.5); // Should overshoot
  });

  it("should interpolate values correctly", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 100, 0.25)).toBe(25);

    // Test warning for out of range t
    const consoleSpy = vi.spyOn(console, "warn");
    lerp(0, 10, 1.5);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should clamp values correctly", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("should convert degrees to radians", () => {
    expect(radians(180)).toBeCloseTo(Math.PI);
    expect(radians(90)).toBeCloseTo(Math.PI / 2);
    expect(radians(0)).toBe(0);
  });

  describe("scale factors", () => {
    beforeEach(() => {
      vi.stubGlobal("window", {
        innerWidth: 1024,
        innerHeight: 768,
      });
    });

    it("should calculate horizontal scale factor", () => {
      expect(getHorizontalScaleFactor()).toBe(1024 / BASELINE_WIDTH);
    });

    it("should calculate vertical scale factor", () => {
      expect(getVerticalScaleFactor()).toBe(768 / BASELINE_HEIGHT);
    });

    it("should return minimum of horizontal and vertical scale factors", () => {
      expect(getScaleFactor()).toBe(
        Math.min(1024 / BASELINE_WIDTH, 768 / BASELINE_HEIGHT)
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });
  });
});

