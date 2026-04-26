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
