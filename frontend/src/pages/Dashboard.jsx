import { useEffect, useMemo, useRef, useState } from 'react';
import { useTasks } from '@hooks/useTasks';
import { localDateKey, shiftLocalDateKey } from '@utils/helpers';

const WEIGHT_OPTIONS = [
  { label: 'Easy', value: 10 },
  { label: 'Medium', value: 40 },
  { label: 'Hard', value: 100 }
];

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) {
    return '';
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
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

const Dashboard = ({ user }) => {
  const { tasks, loading, error, addTask, toggleTask } = useTasks(user?.uid);
  const [draft, setDraft] = useState('');
  const [weight, setWeight] = useState(10);
  const [actionError, setActionError] = useState('');
  const inputRef = useRef(null);
  const today = localDateKey();
  const completedTodayCount = tasks.filter((task) => task.completed && task.completedDay === today).length;

  const todaysPoints = useMemo(() => (
    tasks
      .filter((task) => task.completed && task.completedDay === today)
      .reduce((total, task) => total + (task.weight || 0), 0)
  ), [tasks, today]);

  const streak = useMemo(() => getStreak(tasks, today), [tasks, today]);

  const dueTasks = useMemo(() => (
    tasks
      .filter((task) => task.targetDate && task.targetDate <= today)
      .sort((a, b) => {
        if (a.completed !== b.completed) {
          return Number(a.completed) - Number(b.completed);
        }

        const targetCompare = a.targetDate.localeCompare(b.targetDate);
        if (targetCompare !== 0) {
          return targetCompare;
        }

        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aCreated - bCreated;
      })
  ), [tasks, today]);

  const progress = Math.min((todaysPoints / 100) * 100, 100);
  const progressState = todaysPoints >= 100 ? 'high' : todaysPoints >= 50 ? 'active' : 'low';

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setActionError('');

    if (!draft.trim()) {
      return;
    }

    try {
      await addTask(draft, weight);
      setDraft('');
      inputRef.current?.focus();
    } catch (err) {
      setActionError(err.message || 'Unable to add task right now.');
    }
  };

  const handleToggleTask = async (task) => {
    setActionError('');

    try {
      await toggleTask(task);
    } catch (err) {
      setActionError(err.message || 'Unable to update task right now.');
    }
  };

  return (
    <section className="dashboard-view">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="dashboard-subtitle">
            Execute what is due. Close the list.
          </p>
        </div>
        <div className="dashboard-meta">
          <span><strong className="mono">{todaysPoints}</strong> pts today</span>
          <span><strong className="mono">{streak}</strong> day streak</span>
        </div>
      </header>

      <form className="quick-input-shell" onSubmit={handleSubmit}>
        <div className="quick-input-row">
          <input
            className="quick-input"
            type="text"
            ref={inputRef}
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a task"
            aria-label="Quick add task"
          />
          <button type="submit" className="quick-submit">
            Add
          </button>
        </div>
        <div className="weight-toggle" role="tablist" aria-label="Task weight">
          {WEIGHT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`weight-chip${weight === option.value ? ' active' : ''}`}
              onClick={() => setWeight(option.value)}
            >
              <span>{option.label}</span>
              <span className="mono">{option.value}</span>
            </button>
          ))}
        </div>
      </form>

      {actionError && <p className="section-note section-note-danger">{actionError}</p>}

      <div className="dashboard-grid">
        <aside className={`metrics-panel progress-state-${progressState}`}>
          <div className="section-head">
            <span>Execution Score</span>
            <span><strong className="mono">100</strong> target</span>
          </div>

          <div className="goal-card">
            <div className="goal-kicker">Today</div>
            <div className="goal-value mono">{todaysPoints}/100</div>
            <progress className="goal-progress" value={progress} max="100" />
            <div className="goal-scale mono">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          <div className="metric-stack">
            <div className="metric-box">
              <span className="metric-label">Completed Today</span>
              <strong className="mono">{completedTodayCount}</strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">Open Due Tasks</span>
              <strong className="mono">
                {dueTasks.filter((task) => !task.completed).length}
              </strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">Streak</span>
              <strong className="mono">{streak}</strong>
            </div>
          </div>
        </aside>

        <div className="task-panel">
          <div className="section-head">
            <span>Due Now</span>
            <span><strong className="mono">{dueTasks.length}</strong> items</span>
          </div>

          {loading && <p className="section-note">Loading tasks...</p>}
          {!loading && error && <p className="section-note">Unable to load tasks.</p>}
          {!loading && !error && dueTasks.length === 0 && (
            <p className="section-note">Nothing due today yet.</p>
          )}

          {!loading && !error && dueTasks.length > 0 && (
            <div className="task-list">
              {dueTasks.map((task) => (
                <label key={task.id} className={`task-row${task.completed ? ' completed' : ''}`}>
                  <input
                    className="task-check"
                    type="checkbox"
                    checked={Boolean(task.completed)}
                    onChange={() => {
                      void handleToggleTask(task);
                    }}
                  />
                  <span className="task-points mono">{task.weight}</span>
                  <div className="task-copy">
                    <span>{task.text}</span>
                    <span className="task-date">
                      {task.targetDate}
                      {task.completed && task.completedDay === today && formatTimestamp(task.createdAt)
                        ? ` · created ${formatTimestamp(task.createdAt)}`
                        : ''}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
