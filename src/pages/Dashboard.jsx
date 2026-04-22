import { useMemo, useState } from 'react';
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
  if (!timestamp?.toDate) {
    return '';
  }

  return timestamp.toDate().toLocaleTimeString([], {
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
  const today = localDateKey();

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

        const aCreated = a.createdAt?.seconds || 0;
        const bCreated = b.createdAt?.seconds || 0;
        return aCreated - bCreated;
      })
  ), [tasks, today]);

  const progress = Math.min((todaysPoints / 100) * 100, 100);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    await addTask(draft, weight);
    setDraft('');
  };

  return (
    <section className="dashboard-view">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="dashboard-subtitle">
            Your work due today, completed live.
          </p>
        </div>
        <div className="dashboard-meta mono">
          <span>{todaysPoints} pts today</span>
          <span>{streak} day streak</span>
        </div>
      </header>

      <form className="quick-input-shell" onSubmit={handleSubmit}>
        <input
          className="quick-input"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a task and press Enter"
          aria-label="Quick add task"
        />
        <div className="weight-toggle" role="tablist" aria-label="Task weight">
          {WEIGHT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`weight-chip${weight === option.value ? ' active' : ''}`}
              onClick={() => setWeight(option.value)}
            >
              <span>{option.label}</span>
              <span className="mono">{option.value}pts</span>
            </button>
          ))}
        </div>
      </form>

      <div className="dashboard-grid">
        <div className="task-panel">
          <div className="section-head">
            <span>Due Now</span>
            <span className="mono">{dueTasks.length} items</span>
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
                    type="checkbox"
                    checked={Boolean(task.completed)}
                    onChange={() => toggleTask(task)}
                  />
                  <div className="task-copy">
                    <span>{task.text}</span>
                    <span className="task-date mono">
                      {task.targetDate}
                      {task.completed && task.completedDay === today && formatTimestamp(task.createdAt)
                        ? ` · created ${formatTimestamp(task.createdAt)}`
                        : ''}
                    </span>
                  </div>
                  <span className="task-points mono">{task.weight}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <aside className="metrics-panel">
          <div className="section-head">
            <span>Today&apos;s Goal</span>
            <span className="mono">100 pts</span>
          </div>

          <div className="goal-card">
            <div className="goal-value mono">{todaysPoints}/100</div>
            <div className="goal-bar">
              <div className="goal-marker mono">50</div>
              <div className="goal-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="goal-scale mono">
              <span>0</span>
              <span>100</span>
            </div>
          </div>

          <div className="metric-stack">
            <div className="metric-box">
              <span className="metric-label">Completed Today</span>
              <strong className="mono">
                {tasks.filter((task) => task.completed && task.completedDay === today).length}
              </strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">Open Due Tasks</span>
              <strong className="mono">
                {dueTasks.filter((task) => !task.completed).length}
              </strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Dashboard;
