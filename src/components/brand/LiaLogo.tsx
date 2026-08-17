/**
 * Shared LIA brand logo.
 *
 * The artwork is intentionally rendered as an image rather than inline SVG:
 * the same source is used by the header, footer, auth, admin, invoices and
 * browser chrome, and image isolation prevents SVG id collisions.
 *
 * Variant → asset mapping:
 *   • default / mark — circular badge (`/logo.svg`)
 *   • wordmark       — horizontal "LIA LINGERIE" wordmark
 *   • inverse        — light wordmark for light backgrounds
 */
import { cn } from "@/lib/glass";

type Variant = "default" | "wordmark" | "mark" | "inverse";

interface LiaLogoProps {
  variant?: Variant;
  size?: number;
  className?: string;
  title?: string;
}

const DEFAULT_LABEL: Record<Variant, string> = {
  default: "لوگوی لیا",
  wordmark: "لوگوی لیا",
  mark: "نشان لیا",
  inverse: "لوگوی لیا",
};

const LOGO_SRC: Record<Variant, string> = {
  default: "/logo.svg",
  mark: "/logo.svg",
  wordmark: "/logo-wordmark.svg",
  inverse: "/logo-light.svg",
};

/** Aspect ratio of the horizontal wordmark assets (width / height). */
const WORDMARK_RATIO = 200 / 52;

export function LiaLogo({
  variant = "default",
  size = 36,
  className,
  title,
}: LiaLogoProps) {
  const aria = title ?? DEFAULT_LABEL[variant];
  const isWordmark = variant === "wordmark" || variant === "inverse";
  const width = isWordmark ? Math.round(size * WORDMARK_RATIO) : size;

  return (
    <img
      src={LOGO_SRC[variant]}
      alt={aria}
      width={width}
      height={size}
      decoding="async"
      draggable={false}
      className={cn("select-none object-contain", className)}
    />
  );
}

/** Compact shared logo for navigation and admin chrome. */
export function LiaMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return <LiaLogo variant="mark" size={size} className={className} />;
}

/** Shared logo asset in the wider slot used by email/signature surfaces. */
export function LiaWordmark({
  height = 24,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return <LiaLogo variant="wordmark" size={height} className={className} />;
}
