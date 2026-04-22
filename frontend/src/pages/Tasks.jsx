import { useMemo, useState } from 'react';
import { useTasks } from '@hooks/useTasks';
import { localDateKey, shiftLocalDateKey } from '@utils/helpers';

const SECTION_DEFS = [
  { key: 'today', title: 'Today', note: 'Urgent or overdue execution items.' },
  { key: 'upcoming', title: 'Upcoming', note: 'Scheduled next.' },
  { key: 'later', title: 'Later', note: 'Backlog with lower urgency.' }
];

const getTaskSection = (task, today, upcomingCutoff) => {
  if (!task.targetDate || task.targetDate <= today) {
    return 'today';
  }

  if (task.targetDate <= upcomingCutoff) {
    return 'upcoming';
  }

  return 'later';
};

const sortTasks = (tasks) => [...tasks].sort((a, b) => {
  if (a.completed !== b.completed) {
    return Number(a.completed) - Number(b.completed);
  }

  const dateCompare = (a.targetDate || '').localeCompare(b.targetDate || '');
  if (dateCompare !== 0) {
    return dateCompare;
  }

  const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return aCreated - bCreated;
});

const buildTaskCardClass = (task) => {
  const classes = ['planning-task-card'];

  if (task.weight === 100) {
    classes.push('planning-task-card-hard');
  } else if (task.weight === 40) {
    classes.push('planning-task-card-medium');
  }

  if (task.completed) {
    classes.push('planning-task-card-completed');
  }

  return classes.join(' ');
};

const Tasks = ({ user }) => {
  const { tasks, loading, error, toggleTask, moveTaskToDate, deleteTask } = useTasks(user?.uid);
  const [actionError, setActionError] = useState('');
  const [pendingTaskId, setPendingTaskId] = useState('');
  const today = localDateKey();
  const upcomingCutoff = shiftLocalDateKey(today, 7);

  const sections = useMemo(() => {
    const grouped = {
      today: [],
      upcoming: [],
      later: []
    };

    tasks.forEach((task) => {
      const section = getTaskSection(task, today, upcomingCutoff);
      grouped[section].push(task);
    });

    return {
      today: sortTasks(grouped.today),
      upcoming: sortTasks(grouped.upcoming),
      later: sortTasks(grouped.later)
    };
  }, [tasks, today, upcomingCutoff]);

  const runTaskAction = async (taskId, action) => {
    setActionError('');
    setPendingTaskId(taskId);

    try {
      await action();
    } catch (err) {
      setActionError(err.message || 'Unable to update backlog right now.');
    } finally {
      setPendingTaskId('');
    }
  };

  return (
    <section className="planning-view">
      <header className="planning-header">
        <div>
          <p className="page-kicker">Tasks</p>
          <h1 className="planning-title">Planning backlog</h1>
          <p className="planning-subtitle">
            Group work by urgency and push the next item into today.
          </p>
        </div>
        <div className="planning-meta">
          <span><strong className="mono">{tasks.length}</strong> total</span>
          <span><strong className="mono">{tasks.filter((task) => !task.completed).length}</strong> open</span>
        </div>
      </header>

      {actionError && <p className="section-note section-note-danger">{actionError}</p>}
      {loading && <p className="section-note">Loading backlog...</p>}
      {!loading && error && <p className="section-note">Unable to load backlog.</p>}

      {!loading && !error && (
        <div className="planning-sections">
          {SECTION_DEFS.map((section) => (
            <section key={section.key} className="planning-section">
              <div className="planning-section-head">
                <div>
                  <h2 className="planning-section-title">{section.title}</h2>
                  <p className="planning-section-note">{section.note}</p>
                </div>
                <span className="planning-section-count">
                  <strong className="mono">{sections[section.key].length}</strong> tasks
                </span>
              </div>

              {sections[section.key].length === 0 ? (
                <div className="planning-empty">No tasks here.</div>
              ) : (
                <div className="planning-task-stack">
                  {sections[section.key].map((task) => (
                    <article key={task.id} className={buildTaskCardClass(task)}>
                      <label className="planning-task-checkline">
                        <input
                          className="task-check"
                          type="checkbox"
                          checked={Boolean(task.completed)}
                          onChange={() => {
                            void runTaskAction(task.id, () => toggleTask(task));
                          }}
                        />
                        <span className="planning-task-checkcopy">
                          {task.completed ? 'Closed' : 'Open'}
                        </span>
                      </label>

                      <div className="planning-task-main">
                        <div className="planning-task-points mono">{task.weight}</div>
                        <div className="planning-task-copy">
                          <h3 className="planning-task-title">{task.text}</h3>
                          <p className="planning-task-meta">
                            Due {task.targetDate || today}
                          </p>
                        </div>
                      </div>

                      <div className="planning-task-actions">
                        {task.targetDate !== today && (
                          <button
                            type="button"
                            className="planning-action planning-action-primary"
                            disabled={pendingTaskId === task.id}
                            onClick={() => {
                              void runTaskAction(task.id, () => moveTaskToDate(task.id, today));
                            }}
                          >
                            Push to Today
                          </button>
                        )}
                        <button
                          type="button"
                          className="planning-action planning-action-secondary"
                          disabled={pendingTaskId === task.id}
                          onClick={() => {
                            void runTaskAction(task.id, () => deleteTask(task.id));
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  );
};

export default Tasks;
