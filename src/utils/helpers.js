import { LEVEL_XP, LEVEL_NAMES, DIFF_SCORES, BADGE_DEFS } from './constants';

export const getLevel = (score) => {
  let lvl = 1;
  for (let i = 1; i < LEVEL_XP.length; i++) {
    if (score >= LEVEL_XP[i]) lvl = i + 1;
    else break;
  }
  return Math.min(lvl, LEVEL_XP.length);
};

export const getLevelInfo = (score) => {
  const lvl = getLevel(score);
  const curr = LEVEL_XP[lvl - 1] ?? 0;
  const next = LEVEL_XP[lvl] ?? curr + 2000;
  return { lvl, name: LEVEL_NAMES[lvl - 1] ?? "Titan", progress: (score - curr) / (next - curr), next };
};

export const calcTaskScore = (difficulty, deadline, completedAt) => {
  const base = DIFF_SCORES[difficulty] || 10;
  const dl = new Date(deadline);
  const ct = new Date(completedAt);
  if (ct <= dl) {
    const early = Math.floor((dl - ct) / 86400000);
    return base + Math.min(15, early * 3);
  }
  return Math.max(1, base - 10);
};

export const earnedBadges = (stats) => BADGE_DEFS.filter(b => b.check(stats));

export const localDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const shiftLocalDateKey = (dateKey, delta) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + delta);
  return localDateKey(date);
};

export const todayStr = () => new Date().toISOString().split("T")[0];
export const dAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().split("T")[0];
export const dFwd = (n) => new Date(Date.now() + n * 86400000).toISOString().split("T")[0];

export const relDate = (d) => {
  const days = Math.round((new Date(d) - Date.now()) / 86400000);
  if (days === 0) return "Today";
  if (days === -1) return "Yesterday";
  if (days === 1) return "Tomorrow";
  if (days < 0) return `${-days}d ago`;
  return `in ${days}d`;
};

export const overdue = (d) => new Date(d) < new Date() && d !== todayStr();

let _id = 2000;
export const uid = () => `i${++_id}`;
