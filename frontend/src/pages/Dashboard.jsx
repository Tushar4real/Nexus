import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@config/supabase';
import FocusTimer from '@components/FocusTimer';
import { useSubjects } from '@context/SubjectContext';
import { useTasks } from '@hooks/useTasks';
import { getWeeklyStudyMinutes } from '../lib/subjects';
import { localDateKey, shiftLocalDateKey } from '@utils/helpers';

const DEFAULT_TASK_WEIGHT = 40;
const MS_PER_DAY = 86400000;

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const formatHeaderDate = (date = new Date()) => new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
}).format(date);

const getDisplayName = (user) => user?.name?.trim()?.split(/\s+/)[0] || 'User';

const getDateFromKey = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getExamDayKey = (examDate) => localDateKey(new Date(examDate));

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

const getStreak = (tasks, today) => {
  const completionDays = new Set(
    tasks
      .filter((task) => task.completed && task.completedDay)
      .map((task) => task.completedDay)
  );

  let streak = 0;
  let cursor = today;

  while (completionDays.has(cursor)) {
    streak += 1;
    cursor = shiftLocalDateKey(cursor, -1);
  }

  return streak;
};

const getWeekStartKey = (date = new Date()) => {
  const start = new Date(date);
  const day = start.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + delta);
  return localDateKey(start);
};

const formatHours = (minutes) => {
  const hours = Math.round((minutes / 60) * 10) / 10;
  return Number.isInteger(hours) ? `${hours}` : hours.toFixed(1);
};

const formatEstimatedTime = (minutes) => {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return '';
  }

  return `~${minutes} min`;
};

const getSubjectMeta = (subjectMap, subjectId) => (
  subjectMap.get(subjectId) || {
    id: '',
    name: 'No subject',
    color: 'var(--text-muted)'
  }
);

const sortTasksForToday = (tasks) => [...tasks].sort((a, b) => {
  if (a.completed !== b.completed) {
    return Number(a.completed) - Number(b.completed);
  }

  const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return aCreated - bCreated;
});

const Dashboard = ({ user }) => {
  const today = localDateKey();
  const weekStart = getWeekStartKey();
  const { tasks, loading, error, addTask, toggleTask } = useTasks(user?.uid);
  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects();
  const [todayDraft, setTodayDraft] = useState('');
  const [todaySubjectId, setTodaySubjectId] = useState('');
  const [actionError, setActionError] = useState('');
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [focusLoading, setFocusLoading] = useState(true);
  const [focusError, setFocusError] = useState(null);
  const [isFocusTimerOpen, setIsFocusTimerOpen] = useState(false);

  const subjectMap = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects]);

  const examSubjects = useMemo(() => (
    subjects
      .filter((subject) => subject.examDate)
      .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
  ), [subjects]);

  const examCards = useMemo(() => (
    examSubjects.map((subject) => {
      const examDayKey = getExamDayKey(subject.examDate);
      const daysUntil = getDaysUntil(examDayKey, today);
      const urgencyTone = getExamUrgencyTone(daysUntil);
      const subjectTasks = tasks.filter((task) => task.subjectId === subject.id);
      const completedTasks = subjectTasks.filter((task) => task.completed).length;
      const readiness = subjectTasks.length
        ? Math.round((completedTasks / subjectTasks.length) * 100)
        : 0;

      return {
        ...subject,
        daysUntil,
        urgencyTone,
        statusLabel: getExamStatusLabel(daysUntil),
        readiness
      };
    })
  ), [examSubjects, tasks, today]);

  const todayTasks = useMemo(() => (
    sortTasksForToday(
      tasks.filter((task) => (
        task.targetDate === today
        || (!task.targetDate && task.createdAt && localDateKey(new Date(task.createdAt)) === today)
      ))
    )
  ), [tasks, today]);

  const todayGroups = useMemo(() => {
    const groups = new Map();

    todayTasks.forEach((task) => {
      const subject = getSubjectMeta(subjectMap, task.subjectId);
      const groupKey = subject.id || 'unassigned';

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          name: subject.name,
          color: subject.color,
          tasks: []
        });
      }

      groups.get(groupKey).tasks.push(task);
    });

    return Array.from(groups.values());
  }, [subjectMap, todayTasks]);

  const incompleteDueTodayCount = todayTasks.filter((task) => !task.completed && task.targetDate === today).length;
  const streak = useMemo(() => getStreak(tasks, today), [tasks, today]);
  const completedThisWeek = useMemo(
    () => tasks.filter((task) => task.completed && task.completedDay >= weekStart && task.completedDay <= today).length,
    [tasks, today, weekStart]
  );

  useEffect(() => {
    if (!supabase || !user?.uid) {
      setFocusMinutes(0);
      setFocusLoading(false);
      setFocusError(null);
      return undefined;
    }

    let active = true;

    const loadFocusMinutes = async () => {
      setFocusLoading(true);

      try {
        const groupedMinutes = await getWeeklyStudyMinutes(user.uid);

        if (!active) {
          return;
        }

        const nextMinutes = groupedMinutes.reduce(
          (sum, session) => sum + (Number(session.durationMinutes) || 0),
          0
        );

        setFocusMinutes(nextMinutes);
        setFocusError(null);
        setFocusLoading(false);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setFocusMinutes(0);
        setFocusError(loadError);
        setFocusLoading(false);
      }
    };

    void loadFocusMinutes();

    const channel = supabase
      .channel(`study_sessions:${user.uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_sessions',
          filter: `user_id=eq.${user.uid}`
        },
        () => {
          void loadFocusMinutes();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [today, user?.uid]);

  const handleToggleTask = async (task) => {
    setActionError('');

    try {
      await toggleTask(task);
    } catch (err) {
      setActionError(err.message || 'Unable to update task right now.');
    }
  };

  const handleAddTodayTask = async (event) => {
    event.preventDefault();
    setActionError('');

    if (!todayDraft.trim()) {
      return;
    }

    try {
      await addTask(todayDraft, DEFAULT_TASK_WEIGHT, {
        subjectId: todaySubjectId || null
      });
      setTodayDraft('');
    } catch (err) {
      setActionError(err.message || 'Unable to add task right now.');
    }
  };

  return (
    <section className="dashboard-view page">
      <header className="dashboard-header-bar anim-enter">
        <h1 className="dashboard-header-title">
          {getGreeting()}, {getDisplayName(user)}.
        </h1>
        <p className="dashboard-header-date">{formatHeaderDate()}</p>
      </header>

      {!subjectsLoading && subjects.length === 0 && (
        <section className="dashboard-section anim-enter" style={{ '--delay': '0.06s' }}>
          <div className="dashboard-empty-card empty-state-card">
            <p className="empty-state-copy">
              You haven&apos;t added any subjects yet, so exam readiness can&apos;t be shown.
            </p>
            <Link className="empty-state-action" to="/subjects">
              + Add your first subject
            </Link>
          </div>
        </section>
      )}

      <section className="dashboard-section anim-enter" style={{ '--delay': '0.06s' }}>
        <div className="dashboard-section-head">
          <div>
            <p className="section-label">Upcoming Exams</p>
            <h2 className="section-title">Exam readiness</h2>
          </div>
        </div>

        {subjectsError && (
          <p className="section-note section-note-danger">
            Something went wrong loading subjects. Please refresh.
          </p>
        )}

        {subjectsLoading ? (
          <div className="exam-strip">
            {[0, 1, 2].map((item) => (
              <div key={item} className="exam-strip-card card-skeleton-shell">
                <div className="exam-strip-color skeleton-block skeleton-color-strip" />
                <div className="exam-strip-body">
                  <div className="skeleton-block" style={{ height: '18px', width: '48%' }} />
                  <div className="skeleton-block" style={{ height: '16px', width: '74%' }} />
                  <div className="skeleton-block" style={{ height: '8px', width: '100%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : examCards.length > 0 ? (
          <div className="exam-strip">
            {examCards.map((subject) => (
              <article key={subject.id} className="exam-strip-card">
                <div className="exam-strip-color" style={{ backgroundColor: subject.color }} />
                <div className="exam-strip-body">
                  <div className="exam-strip-topline">
                    <strong className="exam-strip-name">{subject.name}</strong>
                    <div className="exam-strip-meta">
                      <span className={`exam-strip-status urgency-${subject.urgencyTone}`}>
                        {subject.statusLabel}
                      </span>
                      <span className="exam-progress-label">{subject.readiness}% ready</span>
                    </div>
                  </div>
                  <div className="exam-progress-row">
                    <div className="exam-progress-track">
                      <div
                        className={`exam-progress-fill urgency-${subject.urgencyTone}`}
                        style={{ width: `${subject.readiness}%`, backgroundColor: subject.color }}
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !subjectsError && (
            <div className="dashboard-empty-card empty-state-card">
              <p className="empty-state-copy">
                Your subjects don&apos;t have exam dates yet, so there&apos;s nothing to track here.
              </p>
              <Link className="empty-state-action" to="/subjects">
                Add exam dates in Subjects
              </Link>
            </div>
          )
        )}
      </section>

      <section className="dashboard-section dashboard-today-section anim-enter" style={{ '--delay': '0.12s' }}>
        <div className="dashboard-section-head">
          <div>
            <p className="section-label">Today</p>
            <h2 className="section-title">Today</h2>
          </div>
          <span className="dashboard-count-badge mono">{incompleteDueTodayCount}</span>
        </div>

        {actionError && <p className="section-note section-note-danger">{actionError}</p>}
        {loading && (
          <div className="today-panel card card-skeleton-shell">
            <div className="skeleton-stack">
              <div className="skeleton-block" style={{ height: '16px', width: '34%' }} />
              <div className="skeleton-block" style={{ height: '52px', width: '100%' }} />
              <div className="skeleton-block" style={{ height: '52px', width: '100%' }} />
              <div className="skeleton-block" style={{ height: '48px', width: '100%' }} />
            </div>
          </div>
        )}
        {!loading && error && (
          <p className="section-note section-note-danger">
            Something went wrong loading today&apos;s tasks. Please refresh.
          </p>
        )}

        {!loading && !error && (
          <div className="today-panel card">
            {todayGroups.length === 0 ? (
              <div className="empty-state-card empty-state-inline">
                <p className="empty-state-copy">
                  Nothing is scheduled for today yet, so your plan is clear for now.
                </p>
                <button
                  type="button"
                  className="empty-state-action"
                  onClick={() => {
                    document.querySelector('.quick-input')?.focus();
                  }}
                >
                  + Add a task
                </button>
              </div>
            ) : (
              <div className="today-groups">
                {todayGroups.map((group) => (
                  <section key={group.key} className="today-group">
                    <div className="today-group-header">
                      <span className="today-group-dot" style={{ backgroundColor: group.color }} />
                      <h3 className="today-group-title">{group.name}</h3>
                    </div>

                    <div className="today-task-list">
                      {group.tasks.map((task) => {
                        const subject = getSubjectMeta(subjectMap, task.subjectId);

                        return (
                          <label key={task.id} className={`today-task-row${task.completed ? ' completed' : ''}`}>
                            <input
                              className="task-check"
                              type="checkbox"
                              checked={Boolean(task.completed)}
                              onChange={() => {
                                void handleToggleTask(task);
                              }}
                            />
                            <div className="today-task-copy">
                              <span className="today-task-title">{task.text}</span>
                              <div className="today-task-meta">
                                {formatEstimatedTime(task.estimatedMinutes) && (
                                  <span className="today-task-estimate">
                                    {formatEstimatedTime(task.estimatedMinutes)}
                                  </span>
                                )}
                                <span
                                  className="today-task-subject-tag"
                                  style={{
                                    '--subject-tag-color': subject.color
                                  }}
                                >
                                  {subject.name}
                                </span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}

            <form className="today-inline-form" onSubmit={handleAddTodayTask}>
              <input
                className="quick-input"
                type="text"
                value={todayDraft}
                onChange={(event) => setTodayDraft(event.target.value)}
                placeholder="+ Add Task for Today"
                aria-label="Add task for today"
              />
              <select
                className="subject-input"
                value={todaySubjectId}
                onChange={(event) => setTodaySubjectId(event.target.value)}
                aria-label="Assign subject to task"
                disabled={subjectsLoading}
              >
                <option value="">No subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="quick-submit">Add</button>
            </form>
          </div>
        )}
      </section>

      <section className="dashboard-section anim-enter" style={{ '--delay': '0.18s' }}>
        <div className="stats-row">
          <article className="stats-card">
            <span className="stats-label">Study Streak</span>
            <strong className="stats-value">{`🔥 ${streak} day${streak === 1 ? '' : 's'}`}</strong>
          </article>
          <article className="stats-card">
            <span className="stats-label">This Week</span>
            <strong className="stats-value">{completedThisWeek} tasks completed</strong>
          </article>
          <article className="stats-card">
            <span className="stats-label">Focus Time</span>
            {focusLoading ? (
              <div className="skeleton-block" style={{ height: '24px', width: '58%' }} />
            ) : focusError ? (
              <p className="section-note section-note-danger stats-error">
                Something went wrong loading focus time. Please refresh.
              </p>
            ) : (
              <strong className="stats-value">{`${formatHours(focusMinutes)} hrs this week`}</strong>
            )}
          </article>
        </div>
      </section>

      <section className="dashboard-section anim-enter" style={{ '--delay': '0.24s' }}>
        <button
          type="button"
          className="dashboard-focus-button"
          onClick={() => setIsFocusTimerOpen(true)}
        >
          ▶ Start Focus Session
        </button>
      </section>

      {isFocusTimerOpen && (
        <FocusTimer
          userId={user?.uid}
          tasks={tasks}
          onClose={() => setIsFocusTimerOpen(false)}
        />
      )}
    </section>
  );
};

export default Dashboard;
