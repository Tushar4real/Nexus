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

export const DIFF_SCORES = { Easy: 10, Medium: 25, Hard: 50 };
export const LEVEL_XP = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800, 4700, 5700, 6800, 8000, 9500];
export const LEVEL_NAMES = ["Novice","Apprentice","Learner","Contributor","Builder","Achiever","Expert","Master","Elite","Legend","Champion","Veteran","Specialist","Guru","Titan"];

export const BADGE_DEFS = [
  { id: "first", icon: "🚀", name: "First Step", desc: "Complete first task", check: s => s.completed >= 1 },
  { id: "h5", icon: "💪", name: "Challenger", desc: "5 hard tasks done", check: s => s.hardTasks >= 5 },
  { id: "h10", icon: "🏆", name: "Hard Mode", desc: "10 hard tasks done", check: s => s.hardTasks >= 10 },
  { id: "x500", icon: "⭐", name: "Rising Star", desc: "500+ score", check: s => s.score >= 500 },
  { id: "x1000", icon: "👑", name: "Elite", desc: "1000+ score", check: s => s.score >= 1000 },
  { id: "x2000", icon: "💎", name: "Legendary", desc: "2000+ score", check: s => s.score >= 2000 },
];

export const CATEGORIES = ["Development", "Design", "Health", "Learning", "Work", "Other"];
export const DIFFICULTIES = ["Easy", "Medium", "Hard"];
export const POST_CATEGORIES = ["Discussion", "Strategy", "Lifestyle", "Groups", "Tips", "Question"];
