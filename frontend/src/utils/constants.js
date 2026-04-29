export const C = {
  bg: "#081425", surface: "#111c2d", card: "#152031",
  border: "#45464d", borderHi: "#64748b",
  accent: "#bef264", accentFg: "#0f172a", accentGlow: "rgba(190,242,100,0.22)",
  success: "#bef264", successBg: "rgba(190,242,100,0.14)",
  danger: "#f87171", dangerBg: "rgba(248,113,113,0.12)",
  warning: "#84cc16",
  blue: "#64748b", purple: "#334155",
  t1: "#d8e3fb", t2: "#94a3b8", t3: "#64748b",
};

export const DIFF_COLOR = { Easy: C.success, Medium: C.warning, Hard: C.danger };
export const CAT_COLORS = { Development: C.blue, Design: C.purple, Health: C.success, Learning: C.accent, Work: C.warning };

export const CATEGORIES = ["Development", "Design", "Health", "Learning", "Work", "Other"];
export const DIFFICULTIES = ["Easy", "Medium", "Hard"];
export const POST_CATEGORIES = ["Discussion", "Strategy", "Lifestyle", "Groups", "Tips", "Question"];
