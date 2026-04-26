import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@config/supabase';
import { useSubjects } from '@context/SubjectContext';
import { useTasks } from '@hooks/useTasks';
import { localDateKey, shiftLocalDateKey } from '@utils/helpers';

const MS_PER_DAY = 86400000;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getCompletedDays = (tasks) => tasks.reduce((acc, task) => {
  if (!task.completed || !task.completedDay) {
    return acc;
  }

  acc.add(task.completedDay);
  return acc;
}, new Set());

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

const getCurrentStreak = (completedDays, today) => {
  let streak = 0;
  let cursor = today;

  while (completedDays.has(cursor)) {
    streak += 1;
    cursor = shiftLocalDateKey(cursor, -1);
  }

  return streak;
};

const getDateFromKey = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getDaysUntil = (targetDateKey, todayKey) => {
  const todayDate = getDateFromKey(todayKey);
  const targetDate = getDateFromKey(targetDateKey);
  return Math.round((targetDate.getTime() - todayDate.getTime()) / MS_PER_DAY);
};

const getExamUrgencyTone = (daysUntil) => {
  if (daysUntil > 14) return 'safe';
  if (daysUntil >= 7) return 'mid';
  if (daysUntil >= 3) return 'high';
  return 'critical';
};

const getExamStatusLabel = (daysUntil) => {
  if (daysUntil < 0) {
    return `Exam was ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} ago`;
  }

  if (daysUntil === 0) {
    return 'Exam today';
  }

  return `Exam in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
};

const getSubjectMeta = (subjectMap, subjectId) => (
  subjectMap.get(subjectId) || {
    id: '',
    name: 'No subject',
    color: '#94a3b8',
    examDate: null
  }
);

const formatHours = (minutes) => {
  const hours = Math.round(((Number(minutes) || 0) / 60) * 10) / 10;
  return Number.isInteger(hours) ? `${hours}` : hours.toFixed(1);
};

const toAlphaColor = (color, alpha) => {
  if (!color) {
    return `rgba(148, 163, 184, ${alpha})`;
  }

  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const normalized = hex.length === 3
      ? hex.split('').map((char) => `${char}${char}`).join('')
      : hex;

    if (normalized.length === 6) {
      const red = Number.parseInt(normalized.slice(0, 2), 16);
      const green = Number.parseInt(normalized.slice(2, 4), 16);
      const blue = Number.parseInt(normalized.slice(4, 6), 16);
      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }
  }

  const rgbMatch = color.match(/rgba?\(([^)]+)\)/i);
  if (rgbMatch) {
    const [red = '148', green = '163', blue = '184'] = rgbMatch[1].split(',').map((part) => part.trim());
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  return color;
};

const Analytics = ({ user }) => {
  const { tasks, loading, error } = useTasks(user?.uid);
  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects();
  const [studySessions, setStudySessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);
  const today = localDateKey();
  const sevenDaysAgo = shiftLocalDateKey(today, -6);
  const twentyEightDaysAgo = shiftLocalDateKey(today, -27);

  useEffect(() => {
    if (!supabase || !user?.uid) {
      setStudySessions([]);
      setSessionsLoading(false);
      setSessionsError(null);
      return undefined;
    }

    let active = true;

    const loadSessions = async () => {
      setSessionsLoading(true);

      const { data, error: loadError } = await supabase
        .from('study_sessions')
        .select('id, subject_id, duration_minutes, session_date')
        .eq('user_id', user.uid)
        .order('session_date', { ascending: false });

      if (!active) {
        return;
      }

      if (loadError) {
        setStudySessions([]);
        setSessionsError(loadError);
        setSessionsLoading(false);
        return;
      }

      setStudySessions(data || []);
      setSessionsError(null);
      setSessionsLoading(false);
    };

    void loadSessions();

    const channel = supabase
      .channel(`analytics-study-sessions:${user.uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_sessions',
          filter: `user_id=eq.${user.uid}`
        },
        () => {
          void loadSessions();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user?.uid]);

  const subjectMap = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects]
  );

  const {
    currentStreak,
    longestStreak,
    weeklySubjectRows,
    completionBars,
    readinessCards,
    heatmapDays
  } = useMemo(() => {
    const completedDays = getCompletedDays(tasks);
    const sortedCompletedDays = [...completedDays].sort();
    const weeklyTaskCounts = new Map();
    const weeklyStudyMinutes = new Map();
    const subjectTaskTotals = new Map();
    const subjectCompletedTotals = new Map();
    const subjectStudyTotals = new Map();
    const completionCountsByDay = new Map();
    const heatmapCountsByDay = new Map();

    tasks.forEach((task) => {
      const key = task.subjectId || 'unassigned';

      if (!subjectTaskTotals.has(key)) {
        subjectTaskTotals.set(key, 0);
        subjectCompletedTotals.set(key, 0);
      }

      subjectTaskTotals.set(key, (subjectTaskTotals.get(key) || 0) + 1);

      if (task.completed) {
        subjectCompletedTotals.set(key, (subjectCompletedTotals.get(key) || 0) + 1);
      }

      if (task.completed && task.completedDay) {
        if (task.completedDay >= sevenDaysAgo && task.completedDay <= today) {
          weeklyTaskCounts.set(key, (weeklyTaskCounts.get(key) || 0) + 1);
          completionCountsByDay.set(task.completedDay, (completionCountsByDay.get(task.completedDay) || 0) + 1);
        }

        if (task.completedDay >= twentyEightDaysAgo && task.completedDay <= today) {
          heatmapCountsByDay.set(task.completedDay, (heatmapCountsByDay.get(task.completedDay) || 0) + 1);
        }
      }
    });

    studySessions.forEach((session) => {
      const key = session.subject_id || 'unassigned';
      const minutes = Number(session.duration_minutes) || 0;

      subjectStudyTotals.set(key, (subjectStudyTotals.get(key) || 0) + minutes);

      if (session.session_date >= sevenDaysAgo && session.session_date <= today) {
        weeklyStudyMinutes.set(key, (weeklyStudyMinutes.get(key) || 0) + minutes);
      }
    });

    const weeklySubjectIds = new Set([
      ...weeklyTaskCounts.keys(),
      ...weeklyStudyMinutes.keys()
    ]);

    const weeklyRows = Array.from(weeklySubjectIds).map((subjectId) => {
      const subject = getSubjectMeta(subjectMap, subjectId === 'unassigned' ? '' : subjectId);
      const tasksCompleted = weeklyTaskCounts.get(subjectId) || 0;
      const minutes = weeklyStudyMinutes.get(subjectId) || 0;

      return {
        id: subjectId,
        name: subject.name,
        color: subject.color,
        tasksCompleted,
        minutes,
        totalActivity: tasksCompleted + minutes / 60
      };
    }).sort((a, b) => b.totalActivity - a.totalActivity || a.name.localeCompare(b.name));

    const maxWeeklyActivity = weeklyRows[0]?.totalActivity || 0;

    const nextWeeklyRows = weeklyRows.map((row) => ({
      ...row,
      widthPercent: maxWeeklyActivity ? Math.max((row.totalActivity / maxWeeklyActivity) * 100, 8) : 0
    }));

    const nextCompletionBars = Array.from({ length: 7 }, (_, index) => {
      const dayKey = shiftLocalDateKey(sevenDaysAgo, index);
      const date = getDateFromKey(dayKey);

      return {
        dayKey,
        label: DAY_LABELS[date.getDay()],
        count: completionCountsByDay.get(dayKey) || 0
      };
    });

    const examSubjects = subjects
      .filter((subject) => subject.examDate)
      .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

    const nextReadinessCards = examSubjects.map((subject) => {
      const taskKey = subject.id || 'unassigned';
      const totalTasks = subjectTaskTotals.get(taskKey) || 0;
      const completedTasks = subjectCompletedTotals.get(taskKey) || 0;
      const remainingTasks = Math.max(totalTasks - completedTasks, 0);
      const studyMinutes = subjectStudyTotals.get(taskKey) || 0;
      const examDayKey = localDateKey(new Date(subject.examDate));
      const daysUntil = getDaysUntil(examDayKey, today);

      return {
        id: subject.id,
        name: subject.name,
        color: subject.color,
        statusLabel: getExamStatusLabel(daysUntil),
        urgencyTone: getExamUrgencyTone(daysUntil),
        completedTasks,
        remainingTasks,
        studyMinutes,
        readinessPercent: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
      };
    });

    const nextHeatmapDays = Array.from({ length: 28 }, (_, index) => {
      const dayKey = shiftLocalDateKey(twentyEightDaysAgo, index);
      const count = heatmapCountsByDay.get(dayKey) || 0;
      const date = getDateFromKey(dayKey);

      let tone = 'none';
      if (count >= 5) {
        tone = 'strong';
      } else if (count >= 3) {
        tone = 'mid';
      } else if (count >= 1) {
        tone = 'light';
      }

      return {
        dayKey,
        count,
        tone,
        label: `${DAY_LABELS[date.getDay()]} ${date.getDate()}`
      };
    });

    return {
      currentStreak: getCurrentStreak(completedDays, today),
      longestStreak: getLongestStreak(sortedCompletedDays),
      weeklySubjectRows: nextWeeklyRows,
      completionBars: nextCompletionBars,
      readinessCards: nextReadinessCards,
      heatmapDays: nextHeatmapDays
    };
  }, [studySessions, subjectMap, subjects, tasks, sevenDaysAgo, today, twentyEightDaysAgo]);

  const maxCompletionCount = Math.max(...completionBars.map((bar) => bar.count), 0);
  const hasCompletionData = completionBars.some((bar) => bar.count > 0);
  const hasConsistencyData = heatmapDays.some((day) => day.count > 0);
  const chartHeight = 180;
  const chartWidth = 420;
  const barWidth = 36;
  const chartBaseY = 144;
  const chartTopY = 20;
  const chartStep = 56;

  return (
    <section className="analytics-view page">
      <header className="page-header anim-enter">
        <div>
          <p className="page-kicker">Analytics</p>
          <h1 className="analytics-title">Study insights</h1>
          <p className="analytics-subtitle">
            Read subject balance, readiness, and consistency without any game layer.
          </p>
        </div>
      </header>

      {subjectsError && (
        <p className="section-note section-note-danger">
          Something went wrong loading subjects. Please refresh.
        </p>
      )}
      {!loading && error && (
        <p className="section-note section-note-danger">
          Something went wrong loading this section. Please refresh.
        </p>
      )}
      {!sessionsLoading && sessionsError && (
        <p className="section-note section-note-danger">
          Something went wrong loading study sessions. Please refresh.
        </p>
      )}

      {(loading || subjectsLoading || sessionsLoading) && (
        <div className="analytics-grid">
          {[0, 1, 2, 3].map((item) => (
            <section key={item} className="analytics-card card card-skeleton-shell">
              <div className="skeleton-stack">
                <div className="skeleton-block" style={{ height: '16px', width: '28%' }} />
                <div className="skeleton-block" style={{ height: '24px', width: '42%' }} />
                <div className="skeleton-block" style={{ height: '160px', width: '100%' }} />
              </div>
            </section>
          ))}
        </div>
      )}

      {!loading && !subjectsLoading && !sessionsLoading && !error && !subjectsError && !sessionsError && (
        <div className="analytics-grid">
          <section className="analytics-card card anim-enter analytics-span-7" style={{ '--delay': '0.04s' }}>
            <div className="section-head">
              <div>
                <p className="section-label">Weekly Subject Balance</p>
                <h2 className="section-title">This Week by Subject</h2>
              </div>
            </div>

            {weeklySubjectRows.length === 0 ? (
              <div className="analytics-empty-state empty-state-card empty-state-inline">
                <p className="empty-state-copy">
                  There&apos;s no study activity this week yet, so subject balance can&apos;t be shown.
                </p>
                <Link className="empty-state-action" to="/">
                  Start a focus session
                </Link>
              </div>
            ) : (
              <div className="subject-balance-list">
                {weeklySubjectRows.map((row) => (
                  <div key={row.id} className="subject-balance-row">
                    <div className="subject-balance-label">
                      <span className="subject-balance-dot" style={{ backgroundColor: row.color }} />
                      <span className="subject-balance-name">{row.name}</span>
                    </div>
                    <div className="subject-balance-bar-track">
                      <div
                        className="subject-balance-bar-fill"
                        style={{
                          width: `${row.widthPercent}%`,
                          backgroundColor: toAlphaColor(row.color, 0.7)
                        }}
                      />
                    </div>
                    <span className="subject-balance-meta mono">
                      {`${row.tasksCompleted} task${row.tasksCompleted === 1 ? '' : 's'} · ${formatHours(row.minutes)} hrs`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="analytics-card card anim-enter analytics-span-5" style={{ '--delay': '0.08s' }}>
            <div className="section-head">
              <div>
                <p className="section-label">Completion Rate Over Time</p>
                <h2 className="section-title">Last 7 days</h2>
              </div>
            </div>

            {hasCompletionData ? (
              <div className="completion-chart-shell">
                <svg
                  className="completion-chart"
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  role="img"
                  aria-label="Bar chart of tasks completed over the last seven days"
                >
                  <line x1="20" y1={chartBaseY} x2={chartWidth - 12} y2={chartBaseY} className="completion-chart-axis" />
                  {completionBars.map((bar, index) => {
                    const height = maxCompletionCount
                      ? ((bar.count / maxCompletionCount) * (chartBaseY - chartTopY))
                      : 0;
                    const x = 34 + index * chartStep;
                    const y = chartBaseY - height;

                    return (
                      <g key={bar.dayKey}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={height}
                          rx="10"
                          className="completion-chart-bar"
                        />
                        <text x={x + barWidth / 2} y={chartBaseY + 20} textAnchor="middle" className="completion-chart-label">
                          {bar.label}
                        </text>
                        <text x={x + barWidth / 2} y={Math.max(y - 8, 14)} textAnchor="middle" className="completion-chart-value">
                          {bar.count}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div className="analytics-empty-state empty-state-card empty-state-inline">
                <p className="empty-state-copy">
                  No tasks were completed in the last seven days, so this chart is empty.
                </p>
                <Link className="empty-state-action" to="/">
                  + Add a task
                </Link>
              </div>
            )}
          </section>

          <section className="analytics-card card anim-enter analytics-span-7" style={{ '--delay': '0.12s' }}>
            <div className="section-head">
              <div>
                <p className="section-label">Exam Readiness per Subject</p>
                <h2 className="section-title">Readiness by exam</h2>
              </div>
            </div>

            {readinessCards.length === 0 ? (
              <div className="analytics-empty-state empty-state-card empty-state-inline">
                <p className="empty-state-copy">
                  No subjects have exam dates yet, so readiness cannot be calculated here.
                </p>
                <Link className="empty-state-action" to="/subjects">
                  Add exam dates
                </Link>
              </div>
            ) : (
              <div className="exam-readiness-list">
                {readinessCards.map((card) => (
                  <article key={card.id} className="exam-readiness-card">
                    <div className="exam-readiness-header">
                      <div>
                        <h3 className="exam-readiness-name">{card.name}</h3>
                      </div>
                      <span className={`exam-strip-status urgency-${card.urgencyTone}`}>{card.statusLabel}</span>
                    </div>

                    <div className="exam-readiness-pills">
                      <span className="exam-readiness-pill">{`Completed tasks: ${card.completedTasks}`}</span>
                      <span className="exam-readiness-pill">{`Remaining tasks: ${card.remainingTasks}`}</span>
                      <span className="exam-readiness-pill">{`Study time: ${formatHours(card.studyMinutes)} hrs`}</span>
                    </div>

                    <div className="exam-progress-row">
                      <div className="exam-progress-track">
                        <div
                          className={`exam-progress-fill urgency-${card.urgencyTone}`}
                          style={{ width: `${card.readinessPercent}%` }}
                        />
                      </div>
                      <span className="exam-progress-label mono">{`${card.readinessPercent}% ready`}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="analytics-card card anim-enter analytics-span-5" style={{ '--delay': '0.16s' }}>
            <div className="section-head">
              <div>
                <p className="section-label">Streak and Consistency</p>
                <h2 className="section-title">Keep the chain visible</h2>
              </div>
            </div>

            <div className="analytics-stats streak-stats">
              <div className="analytics-stat">
                <span className="analytics-stat-label">Current streak</span>
                <strong className="analytics-stat-value mono">{`${currentStreak} day${currentStreak === 1 ? '' : 's'}`}</strong>
              </div>
              <div className="analytics-stat">
                <span className="analytics-stat-label">Best streak</span>
                <strong className="analytics-stat-value mono">{`${longestStreak} day${longestStreak === 1 ? '' : 's'}`}</strong>
              </div>
            </div>

            {hasConsistencyData ? (
              <div className="consistency-heatmap" role="img" aria-label="4 week task completion heatmap">
                {heatmapDays.map((day) => (
                  <div
                    key={day.dayKey}
                    className={`heatmap-cell heatmap-${day.tone}`}
                    title={`${day.label}: ${day.count} completed task${day.count === 1 ? '' : 's'}`}
                    aria-label={`${day.label}: ${day.count} completed task${day.count === 1 ? '' : 's'}`}
                  />
                ))}
              </div>
            ) : (
              <div className="analytics-empty-state empty-state-card empty-state-inline">
                <p className="empty-state-copy">
                  You haven&apos;t completed any tasks in the last four weeks, so consistency isn&apos;t visible yet.
                </p>
                <Link className="empty-state-action" to="/">
                  + Add a task
                </Link>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
};

export default Analytics;
