import { useMemo } from 'react';
import { useTasks } from '@hooks/useTasks';
import { localDateKey, shiftLocalDateKey } from '@utils/helpers';

const HEATMAP_DAYS = 84;
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const buildDailyPoints = (tasks) => tasks.reduce((acc, task) => {
  if (!task.completed || !task.completedDay) {
    return acc;
  }

  acc[task.completedDay] = (acc[task.completedDay] || 0) + (task.weight || 0);
  return acc;
}, {});

const getHeatLevel = (points) => {
  if (points >= 100) return 4;
  if (points >= 50) return 3;
  if (points >= 10) return 2;
  if (points > 0) return 1;
  return 0;
};

const getLongestStreak = (days) => {
  if (days.length === 0) {
    return 0;
  }

  let longest = 0;
  let current = 0;
  let previousDay = null;

  days.forEach((day) => {
    if (!previousDay || shiftLocalDateKey(previousDay, 1) === day) {
      current += 1;
    } else {
      current = 1;
    }

    longest = Math.max(longest, current);
    previousDay = day;
  });

  return longest;
};

const getCurrentStreak = (dailyPoints, today) => {
  let streak = 0;
  let cursor = today;

  while ((dailyPoints[cursor] || 0) > 0) {
    streak += 1;
    cursor = shiftLocalDateKey(cursor, -1);
  }

  return streak;
};

const Analytics = ({ user }) => {
  const { tasks, loading, error } = useTasks(user?.uid);
  const today = localDateKey();

  const { heatmapDays, totalPoints, averagePerDay, currentStreak, longestStreak } = useMemo(() => {
    const dailyPoints = buildDailyPoints(tasks);
    const completedDays = Object.keys(dailyPoints).sort();
    const total = Object.values(dailyPoints).reduce((sum, points) => sum + points, 0);
    const firstCompletedDay = completedDays[0] || today;

    let trackedDays = 1;
    let cursor = firstCompletedDay;
    while (cursor < today) {
      trackedDays += 1;
      cursor = shiftLocalDateKey(cursor, 1);
    }

    const rangeStart = shiftLocalDateKey(today, -(HEATMAP_DAYS - 1));
    const dayCells = [];
    let heatCursor = rangeStart;

    for (let index = 0; index < HEATMAP_DAYS; index += 1) {
      const points = dailyPoints[heatCursor] || 0;

      dayCells.push({
        key: heatCursor,
        date: heatCursor,
        points,
        level: getHeatLevel(points)
      });

      heatCursor = shiftLocalDateKey(heatCursor, 1);
    }

    return {
      heatmapDays: dayCells,
      totalPoints: total,
      averagePerDay: completedDays.length === 0 ? 0 : Math.round(total / trackedDays),
      currentStreak: getCurrentStreak(dailyPoints, today),
      longestStreak: getLongestStreak(completedDays)
    };
  }, [tasks, today]);

  return (
    <section className="analytics-view">
      <header className="analytics-header">
        <div>
          <p className="page-kicker">Analytics</p>
          <h1 className="analytics-title">Daily output</h1>
          <p className="analytics-subtitle">
            Read the work. No noise.
          </p>
        </div>
      </header>

      {loading && <p className="section-note">Loading analytics...</p>}
      {!loading && error && <p className="section-note">Unable to load analytics.</p>}

      {!loading && !error && (
        <>
          <section className="analytics-stats">
            <div className="analytics-stat">
              <span className="analytics-stat-label">Total Points</span>
              <strong className="analytics-stat-value mono">{totalPoints}</strong>
            </div>
            <div className="analytics-stat">
              <span className="analytics-stat-label">Average Per Day</span>
              <strong className="analytics-stat-value mono">{averagePerDay}</strong>
            </div>
            <div className="analytics-stat">
              <span className="analytics-stat-label">Current Streak</span>
              <strong className="analytics-stat-value mono">{currentStreak}</strong>
            </div>
            <div className="analytics-stat">
              <span className="analytics-stat-label">Longest Streak</span>
              <strong className="analytics-stat-value mono">{longestStreak}</strong>
            </div>
          </section>

          <section className="analytics-section">
            <div className="analytics-section-head">
              <h2 className="analytics-section-title">Heatmap</h2>
              <span className="analytics-section-meta">
                <strong className="mono">{HEATMAP_DAYS}</strong> days
              </span>
            </div>

            <div className="analytics-heatmap-shell">
              <div className="analytics-weekdays">
                {WEEKDAY_LABELS.map((label, index) => (
                  <span key={`${label}-${index}`}>{label}</span>
                ))}
              </div>

              <div className="analytics-heatmap-grid" aria-label="Daily points heatmap">
                {heatmapDays.map((day) => (
                  <div
                    key={day.key}
                    className={`analytics-heatmap-cell analytics-heatmap-level-${day.level}`}
                    title={`${day.date}: ${day.points} points`}
                    aria-label={`${day.date}: ${day.points} points`}
                  />
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </section>
  );
};

export default Analytics;
