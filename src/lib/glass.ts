/**
 * Glass surface variants and class helpers — LIA theme.
 */
import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const glassClass = (tier: "subtle" | "default" | "strong") => {
  switch (tier) {
    case "subtle":
      return "glass-subtle";
    case "strong":
      return "glass-strong";
    default:
      return "glass";
  }
};

/**
 * CSS gradient class strings for product placeholder imagery.
 * LIA-aligned palette: wine / pearl / gold / blush / noir / ivory.
 */
export const PRODUCT_GRADIENTS = {
  mist: "gradient-mist",
  oat: "gradient-oat",
  rose: "gradient-rose-quartz",
  blush: "gradient-lia-rose",
  pearl: "gradient-lia-pearl",
  deep: "gradient-deep",
  noir: "gradient-lia-noir",
} as const;

export type GradientKey = keyof typeof PRODUCT_GRADIENTS;

/** Admin surface tokens — dark luxury glass. Used by admin pages. */
export const glass = {
  surface: "rounded-2xl border border-edge bg-canvas-soft backdrop-blur-lg",
  modal: "rounded-2xl border border-edge bg-canvas-soft backdrop-blur-2xl",
} as const;
