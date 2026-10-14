/**
 * Baby Shop Design Tokens
 * ─────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for every visual constant in the app.
 *
 * RULES:
 *   1. Never hardcode a color/spacing/radius anywhere else.
 *   2. When adding a token, add it here AND to globals.css @theme.
 *   3. Import from "@/lib/design/tokens" everywhere.
 * ─────────────────────────────────────────────────────────────
 */

// ─── Colors ────────────────────────────────────────────────
export const colors = {
  cream: {
    50: "#FDFBF7",
    100: "#FAF5EC",
    200: "#F3E9D6",
    300: "#E9D9B8",
    400: "#D9C089",
  },
  rose: {
    50: "#FFF1F3",
    100: "#FFE1E5",
    200: "#FFC7CE",
    300: "#FBA5B0",
    400: "#F4838F",
    500: "#E85D74", // primary
    600: "#CC4258",
    700: "#A83145",
    800: "#7E2233",
    900: "#5B1524",
  },
  sage: {
    50: "#F3F7F2",
    100: "#E1EBDE",
    200: "#C3D7BD",
    300: "#9EBB96",
    400: "#7A9C71",
    500: "#5C7D53", // secondary
    600: "#476140",
    700: "#354A30",
    800: "#253420",
    900: "#182215",
  },
  ink: {
    50: "#F7F7F6",
    100: "#EFEEEC",
    200: "#DDDBD7",
    300: "#BFBCB5",
    400: "#8E8A81",
    500: "#6B6760",
    600: "#4F4C47",
    700: "#3A3834",
    800: "#252320",
    900: "#121110",
  },
  // Semantic colors — use THESE, not raw palette, in product UI
  semantic: {
    success: "#5C7D53",     // sage-500
    warning: "#D9C089",     // cream-400
    danger: "#CC4258",      // rose-600
    info: "#7A9C71",        // sage-400
    pending: "#D9C089",     // cream-400
  },
} as const;

// ─── Order Status → Color mapping ──────────────────────────
export const orderStatusColors: Record<string, string> = {
  PENDING: colors.cream[400],
  PAID: colors.sage[400],
  PROCESSING: colors.sage[500],
  SHIPPED: colors.sage[600],
  DELIVERED: colors.sage[700],
  CANCELLED: colors.ink[400],
  REFUNDED: colors.rose[600],
};

export const paymentStatusColors: Record<string, string> = {
  PENDING: colors.cream[400],
  SUCCESS: colors.sage[500],
  FAILED: colors.rose[600],
  REFUNDED: colors.rose[400],
};

// ─── Spacing ───────────────────────────────────────────────
export const spacing = {
  section: {
    sm: "3rem",   // py-12
    md: "4rem",   // py-16
    lg: "5rem",   // py-20
    xl: "7rem",   // py-28
  },
  container: {
    narrow: "64rem",  // max-w-5xl
    default: "72rem", // max-w-6xl
    wide: "80rem",    // max-w-7xl
  },
} as const;

// ─── Radii ─────────────────────────────────────────────────
export const radii = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  "3xl": "1.75rem",
  full: "9999px",
} as const;

// ─── Typography ────────────────────────────────────────────
export const typography = {
  fontFamily: {
    sans: "var(--font-sans)",
    display: "var(--font-display)",
  },
  size: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
  },
} as const;

// ─── Shadows ───────────────────────────────────────────────
export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
} as const;

// ─── Z-Index ───────────────────────────────────────────────
export const zIndex = {
  header: 40,
  drawer: 50,
  modal: 60,
  toast: 70,
} as const;

// ─── Breakpoints (matches Tailwind) ────────────────────────
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// ─── Convenience helpers ───────────────────────────────────
export const token = {
  colors,
  orderStatusColors,
  paymentStatusColors,
  spacing,
  radii,
  typography,
  shadows,
  zIndex,
  breakpoints,
} as const;

export type DesignTokens = typeof token;
