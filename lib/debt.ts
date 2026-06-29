import type { DebtLevel } from "@/lib/api";

// Qarzdorlik darajasi → rang va belgi
export const DEBT_COLOR: Record<DebtLevel, string> = {
  red:    "#ef4444",
  yellow: "#f59e0b",
  green:  "#22c55e",
};

export const DEBT_DOT: Record<DebtLevel, string> = {
  red:    "🔴",
  yellow: "🟡",
  green:  "🟢",
};
