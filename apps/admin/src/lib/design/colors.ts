/**
 * Baby Shop — Color Constants (logo-derived)
 * ─────────────────────────────────────────────────────────────
 * Colors sampled directly from the BabyCentre Baby Shop logo.
 *
 * USAGE:
 *   Tailwind    → bg-blue-500, text-pink-500 (reads @theme in globals.css)
 *   Inline/JS   → import { colors } from "@/lib/design/colors"
 *   NEVER hardcode a hex elsewhere.
 * ─────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════
// 1. RAW PALETTE  (mirrored in globals.css @theme)
// ═══════════════════════════════════════════════════════════

export const palette = {
  /** Primary blue — "Baby", teddy shirt, bottle, bowtie */
  blue: {
    50: "#E6F6FD",
    100: "#C2EAF9",
    200: "#8DD6F2",
    300: "#4FBCE8",
    400: "#1AA0DD",
    500: "#0090D8",  // PRIMARY
    600: "#0075B0",
    700: "#005C8C",
    800: "#004368",
    900: "#002B44",
  },

  /** Primary pink — "Centre", hearts */
  pink: {
    50: "#FEEAF2",
    100: "#FCC9DC",
    200: "#F99CBF",
    300: "#F673A2",
    400: "#F2528D",
    500: "#F0417E",  // PRIMARY
    600: "#D42A66",
    700: "#AE1F52",
    800: "#85163E",
    900: "#5B0E29",
  },

  /** Soft accent pink — cheeks, heart highlights */
  blush: {
    50: "#FFF3F8",
    100: "#FFD9E7",
    200: "#FBB6CB",
    300: "#F893AE",
    400: "#F47394",
    500: "#F05579",
  },

  /** Teddy bear browns */
  teddy: {
    50: "#FBF3E8",
    100: "#F2DFC4",
    200: "#E5C194",
    300: "#D8A766",
    400: "#C68C53",  // bear fur
    500: "#A67140",
    600: "#8B5E34",  // bear outlines
    700: "#6B4726",
    800: "#4A301A",
    900: "#2D1D0F",
  },

  /** Cream / baby skin / background warmth */
  cream: {
    50: "#FFFBF4",
    100: "#FFF7EC",  // logo background
    200: "#FBEFDC",
    300: "#F5E1C1",
    400: "#EACD9D",
  },

  /** Neutral ink — text, borders (darker than tailwind slate) */
  ink: {
    50: "#F6F7F9",
    100: "#EBEEF2",
    200: "#D4DAE1",
    300: "#A6B0BC",
    400: "#6E7885",
    500: "#4A5461",
    600: "#333B47",
    700: "#232A34",
    800: "#151A22",
    900: "#0A0E14",
  },

  /** Accent yellow — bottle cap, milk drop */
  yellow: {
    300: "#FFE066",
    400: "#FFD633",
    500: "#FFC933",  // bottle cap
    600: "#E0AE1F",
  },

  /** Utility */
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
} as const;

// ═══════════════════════════════════════════════════════════
// 2. SEMANTIC COLORS
// ═══════════════════════════════════════════════════════════

export const semantic = {
  // Brand
  primary: palette.blue[500],
  primaryHover: palette.blue[600],
  primaryActive: palette.blue[700],
  primaryForeground: palette.white,

  secondary: palette.pink[500],
  secondaryHover: palette.pink[600],
  secondaryActive: palette.pink[700],
  secondaryForeground: palette.white,

  accent: palette.blush[200],
  accentForeground: palette.pink[700],

  // Surfaces
  background: palette.cream[100],
  surface: palette.white,
  surfaceMuted: palette.cream[200],
  surfaceElevated: palette.white,

  // Text
  textPrimary: palette.ink[900],
  textSecondary: palette.ink[600],
  textMuted: palette.ink[400],
  textInverse: palette.white,

  // Borders
  border: palette.cream[300],
  borderStrong: palette.cream[400],
  borderFocus: palette.blue[500],

  // States
  success: palette.blue[500],
  successSoft: palette.blue[50],
  successText: palette.blue[700],

  warning: palette.yellow[500],
  warningSoft: palette.yellow[300],
  warningText: palette.teddy[800],

  danger: palette.pink[600],
  dangerSoft: palette.pink[50],
  dangerText: palette.pink[800],

  info: palette.blue[400],
  infoSoft: palette.blue[50],
  infoText: palette.blue[700],

  // Disabled
  disabled: palette.ink[200],
  disabledText: palette.ink[400],
} as const;

// ═══════════════════════════════════════════════════════════
// 3. DOMAIN-SPECIFIC COLORS
// ═══════════════════════════════════════════════════════════

/** Order status → color + soft background + text (badges) */
export const orderStatusColor = {
  PENDING: palette.yellow[500],
  PAID: palette.blue[400],
  PROCESSING: palette.blue[500],
  SHIPPED: palette.blue[600],
  DELIVERED: palette.teddy[500],
  CANCELLED: palette.ink[300],
  REFUNDED: palette.pink[500],
} as const;

export const orderStatusBg = {
  PENDING: palette.yellow[300],
  PAID: palette.blue[50],
  PROCESSING: palette.blue[50],
  SHIPPED: palette.blue[100],
  DELIVERED: palette.teddy[50],
  CANCELLED: palette.ink[100],
  REFUNDED: palette.pink[50],
} as const;

export const orderStatusText = {
  PENDING: palette.teddy[800],
  PAID: palette.blue[700],
  PROCESSING: palette.blue[700],
  SHIPPED: palette.blue[800],
  DELIVERED: palette.teddy[800],
  CANCELLED: palette.ink[600],
  REFUNDED: palette.pink[800],
} as const;

/** Payment status */
export const paymentStatusColor = {
  PENDING: palette.yellow[500],
  SUCCESS: palette.blue[500],
  FAILED: palette.pink[600],
  REFUNDED: palette.pink[400],
} as const;

export const paymentStatusBg = {
  PENDING: palette.yellow[300],
  SUCCESS: palette.blue[50],
  FAILED: palette.pink[50],
  REFUNDED: palette.pink[50],
} as const;

export const paymentStatusText = {
  PENDING: palette.teddy[800],
  SUCCESS: palette.blue[700],
  FAILED: palette.pink[800],
  REFUNDED: palette.pink[800],
} as const;

/** M-Pesa brand green — kept distinct from store palette */
export const mpesaBrand = {
  green: "#00A651",
  greenDark: "#008D45",
  red: "#ED1C24",
  redDark: "#C8181F",
} as const;

/** Stock status */
export const stockStatusColor = {
  IN_STOCK: palette.blue[500],
  LOW_STOCK: palette.yellow[500],
  OUT_OF_STOCK: palette.pink[500],
} as const;

export const stockStatusBg = {
  IN_STOCK: palette.blue[50],
  LOW_STOCK: palette.yellow[300],
  OUT_OF_STOCK: palette.pink[50],
} as const;

export const stockStatusText = {
  IN_STOCK: palette.blue[700],
  LOW_STOCK: palette.teddy[800],
  OUT_OF_STOCK: palette.pink[800],
} as const;

/** Admin role badges */
export const roleColor = {
  CUSTOMER: palette.ink[500],
  ADMIN: palette.blue[500],
  SUPER_ADMIN: palette.pink[500],
} as const;

export const roleBg = {
  CUSTOMER: palette.ink[100],
  ADMIN: palette.blue[50],
  SUPER_ADMIN: palette.pink[50],
} as const;

// ═══════════════════════════════════════════════════════════
// 4. UI HELPERS
// ═══════════════════════════════════════════════════════════

/** Add opacity to hex. addAlpha("#0090D8", 0.5) → "#0090D880" */
export function addAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

/** Chart color series */
export const chartColors = [
  palette.blue[500],
  palette.pink[500],
  palette.teddy[400],
  palette.blue[300],
  palette.pink[300],
  palette.yellow[500],
] as const;

/** Gradient presets — pull from logo */
export const gradients = {
  brand: `linear-gradient(135deg, ${palette.blue[500]} 0%, ${palette.pink[500]} 100%)`,
  soft: `linear-gradient(135deg, ${palette.blue[50]} 0%, ${palette.pink[50]} 100%)`,
  hero: `linear-gradient(135deg, ${palette.blue[400]} 0%, ${palette.pink[400]} 55%, ${palette.blush[200]} 100%)`,
  cta: `linear-gradient(90deg, ${palette.blue[500]} 0%, ${palette.blue[600]} 100%)`,
} as const;

// ═══════════════════════════════════════════════════════════
// 5. BARREL EXPORT
// ═══════════════════════════════════════════════════════════

export const colors = {
  palette,
  semantic,
  order: { color: orderStatusColor, bg: orderStatusBg, text: orderStatusText },
  payment: { color: paymentStatusColor, bg: paymentStatusBg, text: paymentStatusText },
  stock: { color: stockStatusColor, bg: stockStatusBg, text: stockStatusText },
  role: { color: roleColor, bg: roleBg },
  mpesa: mpesaBrand,
  chart: chartColors,
  gradients,
  addAlpha,
} as const;

export type ColorTokens = typeof colors;
