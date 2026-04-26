export const C = {
  bg: "#0b0b0e", surface: "#111115", card: "#18181d",
  border: "#252530", borderHi: "#3a3a48",
  accent: "#f59e0b", accentFg: "#0b0b0e", accentGlow: "rgba(245,158,11,0.18)",
  success: "#22c55e", successBg: "rgba(34,197,94,0.1)",
  danger: "#ef4444", dangerBg: "rgba(239,68,68,0.1)",
  warning: "#f97316",
  blue: "#3b82f6", purple: "#a855f7",
  t1: "#f1f5f9", t2: "#94a3b8", t3: "#475569",
};

export const DIFF_COLOR = { Easy: C.success, Medium: C.warning, Hard: C.danger };
export const CAT_COLORS = { Development: C.blue, Design: C.purple, Health: C.success, Learning: C.accent, Work: C.warning };

export const CATEGORIES = ["Development", "Design", "Health", "Learning", "Work", "Other"];
export const DIFFICULTIES = ["Easy", "Medium", "Hard"];
export const POST_CATEGORIES = ["Discussion", "Strategy", "Lifestyle", "Groups", "Tips", "Question"];
