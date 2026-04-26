import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubjects } from '@context/SubjectContext';
import { useTasks } from '@hooks/useTasks';
import { localDateKey, shiftLocalDateKey } from '@utils/helpers';

const SECTION_DEFS = [
  { key: 'today', title: 'Today', note: 'Urgent or overdue execution items.' },
  { key: 'upcoming', title: 'Upcoming', note: 'Scheduled next.' },
  { key: 'later', title: 'Later', note: 'Backlog with lower urgency.' }
];

const SECTION_TONE = {
  today: 'high',
  upcoming: 'mid',
  later: 'safe'
};

const GROUP_BY_SUBJECT_STORAGE_KEY = 'tasks-group-by-subject';

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

const getUrgencyTone = (sectionKey, task, today) => {
  if (task.completed) {
    return 'safe';
  }

  if (sectionKey === 'today' && task.targetDate < today) {
    return 'critical';
  }

  if (sectionKey === 'today') {
    return 'high';
  }

  if (sectionKey === 'upcoming') {
    return 'mid';
  }

  return 'safe';
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

const getEmptyStateContent = (sectionKey, hasFilter) => {
  if (hasFilter) {
    return {
      message: 'No tasks match this subject filter in this section yet.',
      action: 'Show all subjects'
    };
  }

  if (sectionKey === 'today') {
    return {
      message: 'Nothing urgent is scheduled right now, so today is clear.',
      action: '+ Add a task'
    };
  }

  if (sectionKey === 'upcoming') {
    return {
      message: 'Nothing is scheduled for the next week yet, so this section is empty.',
      action: '+ Add a task'
    };
  }

  return {
    message: 'You do not have any later backlog items right now, so this section is empty.',
    action: '+ Add a task'
  };
};

const Tasks = ({ user }) => {
  const { tasks, loading, error, toggleTask, moveTaskToDate, deleteTask } = useTasks(user?.uid);
  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects();
  const [actionError, setActionError] = useState('');
  const [pendingTaskId, setPendingTaskId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [groupBySubject, setGroupBySubject] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem(GROUP_BY_SUBJECT_STORAGE_KEY) === 'true';
  });
  const today = localDateKey();
  const upcomingCutoff = shiftLocalDateKey(today, 7);
  const subjectMap = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(GROUP_BY_SUBJECT_STORAGE_KEY, String(groupBySubject));
  }, [groupBySubject]);

  const filteredTasks = useMemo(() => (
    selectedSubjectId === 'all'
      ? tasks
      : tasks.filter((task) => task.subjectId === selectedSubjectId)
  ), [selectedSubjectId, tasks]);

  const sections = useMemo(() => {
    const grouped = {
      today: [],
      upcoming: [],
      later: []
    };

    filteredTasks.forEach((task) => {
      const section = getTaskSection(task, today, upcomingCutoff);
      grouped[section].push(task);
    });

    return {
      today: sortTasks(grouped.today),
      upcoming: sortTasks(grouped.upcoming),
      later: sortTasks(grouped.later)
    };
  }, [filteredTasks, today, upcomingCutoff]);

  const groupedSections = useMemo(() => (
    Object.fromEntries(
      SECTION_DEFS.map((section) => {
        const groups = new Map();

        sections[section.key].forEach((task) => {
          const subject = getSubjectMeta(subjectMap, task.subjectId);
          const groupKey = task.subjectId || 'unassigned';

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

        return [section.key, Array.from(groups.values())];
      })
    )
  ), [sections, subjectMap]);

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
    <section className="planning-view page">
      <header className="page-header anim-enter">
        <div>
          <p className="page-kicker">Tasks</p>
          <h1 className="planning-title">Planning backlog</h1>
          <p className="planning-subtitle">
            Sort work by urgency, surface what belongs today, and keep the backlog calm.
          </p>
        </div>
        <div className="planning-meta">
          <span><strong className="mono">{filteredTasks.length}</strong> total</span>
          <span><strong className="mono">{filteredTasks.filter((task) => !task.completed).length}</strong> open</span>
        </div>
      </header>

      <div className="planning-toolbar card anim-enter" style={{ '--delay': '0.04s' }}>
        <div className="planning-filter-group">
          <label className="planning-filter-field">
            <span className="planning-filter-label">Subject</span>
            <select
              className="subject-input planning-filter-select"
              value={selectedSubjectId}
              onChange={(event) => setSelectedSubjectId(event.target.value)}
              disabled={subjectsLoading}
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          className={`planning-group-toggle${groupBySubject ? ' planning-group-toggle-active' : ''}`}
          onClick={() => setGroupBySubject((current) => !current)}
          aria-pressed={groupBySubject}
        >
          Group by Subject: {groupBySubject ? 'On' : 'Off'}
        </button>
      </div>

      {actionError && <p className="section-note section-note-danger">{actionError}</p>}
      {subjectsError && (
        <p className="section-note section-note-danger">
          Something went wrong loading subjects. Please refresh.
        </p>
      )}
      {loading && (
        <div className="planning-sections">
          {[0, 1, 2].map((item) => (
            <section key={item} className="planning-section card-skeleton-shell">
              <div className="skeleton-stack">
                <div className="skeleton-block" style={{ height: '16px', width: '22%' }} />
                <div className="skeleton-block" style={{ height: '24px', width: '34%' }} />
                <div className="skeleton-block" style={{ height: '88px', width: '100%' }} />
              </div>
            </section>
          ))}
        </div>
      )}
      {!loading && error && (
        <p className="section-note section-note-danger">
          Something went wrong loading this section. Please refresh.
        </p>
      )}

      {!loading && !error && (
        <div className="planning-sections">
          {SECTION_DEFS.map((section, index) => (
            <section
              key={section.key}
              className="planning-section anim-enter"
              style={{ '--delay': `${0.06 + index * 0.08}s` }}
            >
              <div className="planning-section-head">
                <div>
                  <p className="section-label">{section.title}</p>
                  <h2 className="planning-section-title">{section.title}</h2>
                  <p className="planning-section-note">{section.note}</p>
                </div>
                <span className={`planning-section-count tone-${SECTION_TONE[section.key]}`}>
                  <strong className="mono">{sections[section.key].length}</strong> tasks
                </span>
              </div>

              {sections[section.key].length === 0 ? (
                <div className="planning-empty empty-state-card">
                  <p className="empty-state-copy">
                    {getEmptyStateContent(section.key, selectedSubjectId !== 'all').message}
                  </p>
                  {selectedSubjectId !== 'all' ? (
                    <button
                      type="button"
                      className="empty-state-action"
                      onClick={() => setSelectedSubjectId('all')}
                    >
                      {getEmptyStateContent(section.key, true).action}
                    </button>
                  ) : (
                    <Link className="empty-state-action" to="/">
                      {getEmptyStateContent(section.key, false).action}
                    </Link>
                  )}
                </div>
              ) : (
                <div className="planning-task-stack">
                  {(groupBySubject ? groupedSections[section.key] : [{ key: `${section.key}-flat`, tasks: sections[section.key] }]).map((group) => (
                    <div key={group.key} className="planning-subject-group">
                      {groupBySubject && (
                        <div className="planning-subject-group-header" style={{ '--planning-subject-color': group.color }}>
                          <span className="planning-subject-group-dot" />
                          <h3 className="planning-subject-group-title">{group.name}</h3>
                        </div>
                      )}

                      <div className="planning-task-stack">
                        {group.tasks.map((task) => {
                          const subject = getSubjectMeta(subjectMap, task.subjectId);
                          const estimatedTime = formatEstimatedTime(task.estimatedMinutes);

                          return (
                            <article
                              key={task.id}
                              className={`planning-task-card${task.completed ? ' planning-task-card-completed' : ''}${task.subjectId ? ' planning-task-card-has-subject' : ''}`}
                              style={task.subjectId ? { '--planning-task-subject-color': subject.color } : undefined}
                            >
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
                                <div className="planning-task-copy">
                                  <div className="planning-task-header">
                                    <div className="planning-task-titleblock">
                                      <h3 className="planning-task-title">{task.text}</h3>
                                      {task.subjectId && (
                                        <p className="planning-task-subject">{subject.name}</p>
                                      )}
                                    </div>
                                    <div className="planning-task-side">
                                      {estimatedTime && (
                                        <span className="planning-task-estimate mono">{estimatedTime}</span>
                                      )}
                                      <span className={`urgency-tag urgency-${getUrgencyTone(section.key, task, today)} mono`}>
                                        {task.completed ? 'Closed' : section.title}
                                      </span>
                                      <p className="planning-task-meta mono">
                                        {task.targetDate || today}
                                      </p>
                                    </div>
                                  </div>
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
                          );
                        })}
                      </div>
                    </div>
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
