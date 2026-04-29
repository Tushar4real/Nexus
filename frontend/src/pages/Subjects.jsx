import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubjects } from '@context/SubjectContext';
import { useTasks } from '@hooks/useTasks';
import SubjectColorPicker from '@components/SubjectColorPicker';
import { createSubject, deleteSubject, updateSubject } from '../lib/subjects';
import { localDateKey } from '@utils/helpers';

const EMPTY_FORM = {
  name: '',
  color: '#bef264',
  examDate: '',
  description: ''
};

const getExamDateValue = (examDate) => examDate?.slice(0, 10) || '';

const getDaysUntil = (examDate) => {
  if (!examDate) {
    return null;
  }

  const today = new Date(`${localDateKey()}T00:00:00`);
  const exam = new Date(`${getExamDateValue(examDate)}T00:00:00`);
  return Math.round((exam.getTime() - today.getTime()) / 86400000);
};

const getUrgencyTone = (daysUntil) => {
  if (daysUntil === null) {
    return 'safe';
  }

  if (daysUntil <= 3) {
    return 'critical';
  }

  if (daysUntil <= 7) {
    return 'high';
  }

  if (daysUntil <= 21) {
    return 'mid';
  }

  return 'safe';
};

const getExamCopy = (daysUntil) => {
  if (daysUntil === null) {
    return 'No exam date set';
  }

  if (daysUntil < 0) {
    return `Exam was ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} ago`;
  }

  if (daysUntil === 0) {
    return 'Exam is today';
  }

  return `Exam in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
};

const formatEstimatedTime = (minutes) => {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return '';
  }

  return `~${minutes} min`;
};

const sortSubjectTasks = (tasks) => [...tasks].sort((a, b) => {
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

const SubjectForm = ({ initialValues, saving, onCancel, onSave }) => {
  const [form, setForm] = useState(initialValues);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSave(form);
  };

  return (
    <form className="subject-form card anim-enter" onSubmit={handleSubmit}>
      <div className="subject-form-grid">
        <label className="subject-field">
          <span className="auth-label">Name</span>
          <input
            className="subject-input"
            type="text"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Physics"
            required
          />
        </label>

        <label className="subject-field">
          <span className="auth-label">Exam Date</span>
          <input
            className="subject-input"
            type="date"
            value={form.examDate}
            onChange={(event) => setForm((current) => ({ ...current, examDate: event.target.value }))}
          />
        </label>
      </div>

      <div className="subject-field">
        <span className="auth-label">Color</span>
        <SubjectColorPicker
          value={form.color}
          onChange={(color) => setForm((current) => ({ ...current, color }))}
        />
      </div>

      <label className="subject-field">
        <span className="auth-label">Description</span>
        <textarea
          className="subject-input subject-textarea"
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="Optional context for this subject"
          rows={4}
        />
      </label>

      <div className="subject-form-actions">
        <button type="submit" className="planning-action planning-action-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Subject'}
        </button>
        <button type="button" className="planning-action planning-action-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
};

const Subjects = ({ user }) => {
  const { subjects, loading, error, refetchSubjects } = useSubjects();
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks(user?.uid);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState('');
  const [openMenuSubjectId, setOpenMenuSubjectId] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const tasksBySubject = useMemo(() => {
    const grouped = new Map();

    subjects.forEach((subject) => {
      grouped.set(subject.id, []);
    });

    tasks.forEach((task) => {
      if (!task.subjectId || !grouped.has(task.subjectId)) {
        return;
      }

      grouped.get(task.subjectId).push(task);
    });

    grouped.forEach((subjectTasks, subjectId) => {
      grouped.set(subjectId, sortSubjectTasks(subjectTasks));
    });

    return grouped;
  }, [subjects, tasks]);

  const handleCreate = async (form) => {
    setSaving(true);
    setActionError('');

    try {
      await createSubject({
        userId: user?.uid,
        name: form.name,
        color: form.color,
        examDate: form.examDate,
        description: form.description
      });
      await refetchSubjects();
      setShowCreateForm(false);
    } catch (err) {
      setActionError(err.message || 'Unable to create subject right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (subjectId, form) => {
    setSaving(true);
    setActionError('');

    try {
      await updateSubject(subjectId, {
        name: form.name,
        color: form.color,
        examDate: form.examDate,
        description: form.description
      });
      await refetchSubjects();
      setEditingSubjectId('');
    } catch (err) {
      setActionError(err.message || 'Unable to update subject right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (subjectId) => {
    const confirmed = window.confirm('Delete this subject? Tasks linked to it will keep existing, but their subject will be cleared.');

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setActionError('');

    try {
      await deleteSubject(subjectId);
      await refetchSubjects();
      setOpenMenuSubjectId('');
      if (editingSubjectId === subjectId) {
        setEditingSubjectId('');
      }
    } catch (err) {
      setActionError(err.message || 'Unable to delete subject right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="subjects-view page">
      <header className="page-header anim-enter">
        <div>
          <p className="page-kicker">Subjects</p>
          <h1 className="page-title">My Subjects</h1>
          <p className="page-subtitle">
            Keep every course visible with color, timing, and enough context to plan accurately.
          </p>
        </div>
        <button
          type="button"
          className="planning-action planning-action-primary subject-create-button"
          onClick={() => {
            setEditingSubjectId('');
            setShowCreateForm((current) => !current);
          }}
        >
          + New Subject
        </button>
      </header>

      {showCreateForm && (
        <SubjectForm
          initialValues={EMPTY_FORM}
          saving={saving}
          onCancel={() => setShowCreateForm(false)}
          onSave={handleCreate}
        />
      )}

      {actionError && <p className="section-note section-note-danger">{actionError}</p>}
      {error && (
        <p className="section-note section-note-danger">
          Something went wrong loading subjects. Please refresh.
        </p>
      )}
      {tasksError && (
        <p className="section-note section-note-danger">
          Something went wrong loading assigned tasks. Please refresh.
        </p>
      )}
      {loading && (
        <div className="subject-grid">
          {[0, 1].map((item) => (
            <article key={item} className="subject-card card-skeleton-shell">
              <div className="subject-card-strip skeleton-block" />
              <div className="subject-card-body skeleton-stack">
                <div className="skeleton-block" style={{ height: '22px', width: '42%' }} />
                <div className="skeleton-block" style={{ height: '16px', width: '56%' }} />
                <div className="skeleton-block" style={{ height: '96px', width: '100%' }} />
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="subject-grid">
          {subjects.length === 0 ? (
            <div className="planning-empty empty-state-card">
              <p className="empty-state-copy">
                You haven&apos;t added any subjects yet, so nothing can be organized here.
              </p>
              <button
                type="button"
                className="empty-state-action"
                onClick={() => setShowCreateForm(true)}
              >
                + Add your first subject
              </button>
            </div>
          ) : (
            subjects.map((subject, index) => {
              const isEditing = editingSubjectId === subject.id;
              const isMenuOpen = openMenuSubjectId === subject.id;
              const daysUntil = getDaysUntil(subject.examDate);
              const urgencyTone = getUrgencyTone(daysUntil);

              return (
                <article
                  key={subject.id}
                  className="subject-card anim-enter"
                  style={{ '--delay': `${0.06 + index * 0.05}s`, '--subject-color': subject.color }}
                >
                  <div className="subject-card-strip" />
                  <div className="subject-card-body">
                    <div className="subject-card-header">
                      <div>
                        <h2 className="subject-card-title">{subject.name}</h2>
                        <p className={`subject-card-date${daysUntil === null ? ' muted' : ` tone-${urgencyTone}`}`}>
                          {getExamCopy(daysUntil)}
                        </p>
                      </div>
                      <div className="subject-card-menu mobile-only">
                        <button
                          type="button"
                          className="subject-card-menu-trigger"
                          aria-label={`More actions for ${subject.name}`}
                          aria-expanded={isMenuOpen}
                          onClick={() => {
                            setOpenMenuSubjectId((current) => (current === subject.id ? '' : subject.id));
                          }}
                        >
                          <span aria-hidden="true">⋮</span>
                        </button>
                        {isMenuOpen && (
                          <div className="subject-card-menu-dropdown card-raised">
                            <button
                              type="button"
                              className="subject-card-menu-action"
                              onClick={() => {
                                setShowCreateForm(false);
                                setEditingSubjectId(isEditing ? '' : subject.id);
                                setOpenMenuSubjectId('');
                              }}
                              disabled={saving}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="subject-card-menu-action subject-card-menu-action-danger"
                              onClick={() => {
                                void handleDelete(subject.id);
                              }}
                              disabled={saving}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="subject-card-actions">
                        <button
                          type="button"
                          className="planning-action planning-action-primary"
                          onClick={() => {
                            setShowCreateForm(false);
                            setEditingSubjectId(isEditing ? '' : subject.id);
                          }}
                          disabled={saving}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="planning-action planning-action-secondary"
                          onClick={() => {
                            void handleDelete(subject.id);
                          }}
                          disabled={saving}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {subject.description && <p className="subject-card-description">{subject.description}</p>}

                    <section className="subject-task-panel">
                      <div className="subject-task-panel-head">
                        <h3 className="subject-task-panel-title">Assigned tasks</h3>
                        <span className="subject-task-panel-count mono">
                          {(tasksBySubject.get(subject.id) || []).length}
                        </span>
                      </div>

                      {tasksLoading ? (
                        <div className="skeleton-stack subject-task-skeleton">
                          <div className="skeleton-block" style={{ height: '16px', width: '48%' }} />
                          <div className="skeleton-block" style={{ height: '42px', width: '100%' }} />
                          <div className="skeleton-block" style={{ height: '42px', width: '100%' }} />
                        </div>
                      ) : (tasksBySubject.get(subject.id) || []).length === 0 ? (
                        <div className="subject-task-empty empty-state-card empty-state-inline">
                          <p className="empty-state-copy">
                            No tasks are assigned to this subject yet, so there&apos;s nothing to review here.
                          </p>
                          <Link className="empty-state-action" to="/">
                            + Add a task
                          </Link>
                        </div>
                      ) : (
                        <div className="subject-task-list">
                          {(tasksBySubject.get(subject.id) || []).map((task) => (
                            <div key={task.id} className={`subject-task-row${task.completed ? ' completed' : ''}`}>
                              <div className="subject-task-copy">
                                <p className="subject-task-title">{task.text}</p>
                                <div className="subject-task-meta">
                                  {task.targetDate && (
                                    <span className="subject-task-date mono">{task.targetDate}</span>
                                  )}
                                  {formatEstimatedTime(task.estimatedMinutes) && (
                                    <span className="subject-task-time">{formatEstimatedTime(task.estimatedMinutes)}</span>
                                  )}
                                </div>
                              </div>
                              <span className={`subject-task-status${task.completed ? ' completed' : ''}`}>
                                {task.completed ? 'Closed' : 'Open'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {isEditing && (
                        <SubjectForm
                          initialValues={{
                            name: subject.name,
                            color: subject.color,
                            examDate: getExamDateValue(subject.examDate),
                            description: subject.description || ''
                          }}
                          saving={saving}
                          onCancel={() => setEditingSubjectId('')}
                          onSave={(form) => handleUpdate(subject.id, form)}
                        />
                      )}
                    </section>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}
    </section>
  );
};

export default Subjects;
