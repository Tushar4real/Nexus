import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@config/supabase';
import { createSubject } from '../lib/subjects';
import { localDateKey } from '@utils/helpers';

const SUBJECT_COLORS = [
  '#6366f1',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6'
];

const CALIBRATION_MESSAGES = [
  'Establishing identity context...',
  'Allocating database schemas...',
  'Injecting subject vectors...',
  'Structuring execution queue...',
  'System initialized.'
];

const TASK_TEXT_COLUMNS = ['text', 'title', 'name', 'description'];

const buildAvatar = (name, email = '') => {
  const source = (name || email || 'User').trim();

  return source
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const isMissingColumnError = (error, column) => {
  const message = error?.message?.toLowerCase() || '';
  return message.includes(`could not find the '${column.toLowerCase()}' column`);
};

const normalizeSubjects = (subjects) => {
  const seen = new Set();

  return subjects.filter((subject) => {
    const normalized = subject.trim();
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const getOnboardingIndicator = (step) => `PHASE 0${step} / 03`;

const createInitialState = (user) => ({
  name: user?.name?.trim() || '',
  major: '',
  subjects: [],
  firstTask: ''
});

async function persistProfile(user, wizard) {
  const payload = {
    id: user.uid,
    name: wizard.name.trim(),
    email: user.email || '',
    avatar: buildAvatar(wizard.name, user.email || ''),
    major: wizard.major.trim() || null
  };

  const { error: insertWithMajorError } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' });

  if (!insertWithMajorError) {
    return;
  }

  if (!isMissingColumnError(insertWithMajorError, 'major')) {
    throw insertWithMajorError;
  }

  const fallbackPayload = { ...payload };
  delete fallbackPayload.major;

  const { error: fallbackError } = await supabase
    .from('profiles')
    .upsert(fallbackPayload, { onConflict: 'id' });

  if (fallbackError) {
    throw fallbackError;
  }
}

async function persistTask(userId, text, subjectId) {
  const trimmedText = text.trim();
  const basePayload = {
    user_id: userId,
    weight: 40,
    completed: false,
    target_date: localDateKey(),
    completed_day: null,
    subject_id: subjectId || null,
    estimated_minutes: 30
  };

  let lastError = null;

  for (const column of TASK_TEXT_COLUMNS) {
    const { error } = await supabase
      .from('tasks')
      .insert({
        ...basePayload,
        [column]: trimmedText
      });

    if (!error) {
      return;
    }

    lastError = error;

    if (!isMissingColumnError(error, column)) {
      throw error;
    }
  }

  throw lastError || new Error('Unable to create the first task right now.');
}

export function OnboardingFlow({ user, onComplete, onRefreshProfile, onRefreshSubjects }) {
  const [step, setStep] = useState(1);
  const [wizard, setWizard] = useState(() => createInitialState(user));
  const [subjectDraft, setSubjectDraft] = useState('');
  const [calibrationIndex, setCalibrationIndex] = useState(0);
  const [error, setError] = useState('');
  const [retryNonce, setRetryNonce] = useState(0);
  const nameInputRef = useRef(null);
  const subjectInputRef = useRef(null);
  const taskInputRef = useRef(null);
  const completionTimeoutRef = useRef(null);

  const firstSubjectLabel = useMemo(
    () => wizard.subjects[0] || 'your first subject vector',
    [wizard.subjects]
  );

  useEffect(() => {
    if (step === 1) {
      nameInputRef.current?.focus();
    }

    if (step === 2) {
      subjectInputRef.current?.focus();
    }

    if (step === 3) {
      taskInputRef.current?.focus();
    }
  }, [step]);

  useEffect(() => () => {
    if (completionTimeoutRef.current) {
      window.clearTimeout(completionTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (step !== 4 || !supabase || !user?.uid) {
      return undefined;
    }

    let active = true;
    let messageCursor = 0;
    setError('');
    setCalibrationIndex(0);

    const intervalId = window.setInterval(() => {
      messageCursor = (messageCursor + 1) % CALIBRATION_MESSAGES.length;
      if (active) {
        setCalibrationIndex(messageCursor);
      }
    }, 600);

    const runCalibration = async () => {
      try {
        await persistProfile(user, wizard);

        const createdSubjects = [];

        for (const [index, subjectName] of wizard.subjects.entries()) {
          const createdSubject = await createSubject({
            userId: user.uid,
            name: subjectName,
            color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
            examDate: '',
            description: ''
          });

          createdSubjects.push(createdSubject);
        }

        await persistTask(user.uid, wizard.firstTask, createdSubjects[0]?.id || null);
        await Promise.all([
          onRefreshProfile?.(),
          onRefreshSubjects?.()
        ]);

        if (!active) {
          return;
        }

        setCalibrationIndex(CALIBRATION_MESSAGES.length - 1);
        window.clearInterval(intervalId);
        setStep(5);
      } catch (persistError) {
        if (!active) {
          return;
        }

        window.clearInterval(intervalId);
        setError(persistError.message || 'Unable to initialize your workspace right now.');
      }
    };

    void runCalibration();

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [onRefreshProfile, onRefreshSubjects, retryNonce, step, user, wizard]);

  useEffect(() => {
    if (step !== 5) {
      return undefined;
    }

    completionTimeoutRef.current = window.setTimeout(() => {
      window.localStorage.setItem('clarity_onboarded', 'true');
      onComplete?.();
    }, 1500);

    return () => {
      if (completionTimeoutRef.current) {
        window.clearTimeout(completionTimeoutRef.current);
      }
    };
  }, [onComplete, step]);

  const updateWizardField = (field, value) => {
    setWizard((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleProfileSubmit = () => {
    const trimmedName = wizard.name.trim();

    if (!trimmedName) {
      setError('Name is required to initialize your profile.');
      return;
    }

    setError('');
    setWizard((current) => ({
      ...current,
      name: trimmedName,
      major: current.major.trim()
    }));
    setStep(2);
  };

  const addSubject = () => {
    const normalized = subjectDraft.trim();

    if (!normalized) {
      return false;
    }

    setWizard((current) => ({
      ...current,
      subjects: normalizeSubjects([...current.subjects, normalized])
    }));
    setSubjectDraft('');
    setError('');
    return true;
  };

  const handleSubjectsAdvance = () => {
    if (!wizard.subjects.length) {
      setError('Add at least one subject vector to continue.');
      return;
    }

    setError('');
    setStep(3);
  };

  const handleTaskSubmit = () => {
    const trimmedTask = wizard.firstTask.trim();

    if (!trimmedTask) {
      setError('Set one critical task before calibration begins.');
      return;
    }

    setError('');
    setWizard((current) => ({
      ...current,
      firstTask: trimmedTask
    }));
    setStep(4);
  };

  const removeSubject = (subjectToRemove) => {
    setWizard((current) => ({
      ...current,
      subjects: current.subjects.filter((subject) => subject !== subjectToRemove)
    }));
  };

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-shell">
        {(step >= 1 && step <= 3) && (
          <div className="onboarding-phase mono anim-enter">{getOnboardingIndicator(step)}</div>
        )}

        {step === 1 && (
          <section className="onboarding-panel anim-enter">
            <div className="onboarding-copy">
              <h1 id="onboarding-title" className="onboarding-title">Establish your profile</h1>
              <p className="onboarding-subtitle">
                How would you like the system to address you, and what is your primary academic focus?
              </p>
            </div>

            <div className="onboarding-fieldset">
              <label className="onboarding-field">
                <span className="onboarding-label mono">Identity</span>
                <input
                  ref={nameInputRef}
                  className="onboarding-input"
                  type="text"
                  value={wizard.name}
                  onChange={(event) => updateWizardField('name', event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleProfileSubmit();
                    }
                  }}
                  placeholder="What should we call you"
                  autoComplete="name"
                />
              </label>

              <label className="onboarding-field">
                <span className="onboarding-label mono">Academic Focus</span>
                <input
                  className="onboarding-input"
                  type="text"
                  value={wizard.major}
                  onChange={(event) => updateWizardField('major', event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleProfileSubmit();
                    }
                  }}
                  placeholder="Major or Degree (Optional)"
                  autoComplete="organization-title"
                />
              </label>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="onboarding-panel anim-enter">
            <div className="onboarding-copy">
              <h1 id="onboarding-title" className="onboarding-title">Configure your vectors.</h1>
              <p className="onboarding-subtitle">
                What core subjects, courses, or projects will you be tracking this term?
              </p>
            </div>

            <div className="onboarding-fieldset">
              <label className="onboarding-field">
                <span className="onboarding-label mono">Subject Input</span>
                <input
                  ref={subjectInputRef}
                  className="onboarding-input"
                  type="text"
                  value={subjectDraft}
                  onChange={(event) => setSubjectDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();

                      if (subjectDraft.trim()) {
                        addSubject();
                        return;
                      }

                      handleSubjectsAdvance();
                    }
                  }}
                  placeholder="e.g. Calculus III, Org Chem..."
                />
              </label>

              <div className="onboarding-tags" aria-live="polite">
                {wizard.subjects.map((subject, index) => (
                  <button
                    key={subject}
                    type="button"
                    className="onboarding-tag"
                    onClick={() => removeSubject(subject)}
                  >
                    <span
                      className="onboarding-tag-dot"
                      style={{ background: SUBJECT_COLORS[index % SUBJECT_COLORS.length] }}
                    />
                    <span>{subject}</span>
                    <span className="onboarding-tag-remove mono">X</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="onboarding-panel anim-enter">
            <div className="onboarding-copy">
              <h1 id="onboarding-title" className="onboarding-title">Initialize execution.</h1>
              <p className="onboarding-subtitle">
                A productivity system thrives on momentum. What is the single most critical task you need to execute in the next 24 hours?
              </p>
            </div>

            <div className="onboarding-fieldset">
              <label className="onboarding-field">
                <span className="onboarding-label mono">Immediate Task</span>
                <div className="onboarding-task-shell">
                  <span className="onboarding-task-marker" aria-hidden="true" />
                  <textarea
                    ref={taskInputRef}
                    className="onboarding-textarea"
                    value={wizard.firstTask}
                    onChange={(event) => updateWizardField('firstTask', event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleTaskSubmit();
                      }
                    }}
                    placeholder="Define the next high-leverage action."
                    rows={3}
                  />
                </div>
              </label>

              <div className="onboarding-assignment mono">
                Task will be assigned to {firstSubjectLabel}.
              </div>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="onboarding-status anim-enter">
            <div className="onboarding-reticle" aria-hidden="true" />
            <div className="onboarding-terminal mono">
              {CALIBRATION_MESSAGES[calibrationIndex]}
            </div>
            {error && (
              <div className="onboarding-error-stack">
                <p className="onboarding-error">{error}</p>
                <button
                  type="button"
                  className="onboarding-retry"
                  onClick={() => {
                    setRetryNonce((current) => current + 1);
                    setError('');
                  }}
                >
                  Retry Calibration
                </button>
              </div>
            )}
          </section>
        )}

        {step === 5 && (
          <section className="onboarding-status anim-enter">
            <div className="onboarding-check" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5 12.5 9.5 17 19 7.5" />
              </svg>
            </div>
            <h1 id="onboarding-title" className="onboarding-title">System Online.</h1>
            <p className="onboarding-subtitle">Entering your dashboard...</p>
          </section>
        )}

        {error && step <= 3 && <p className="onboarding-error anim-enter">{error}</p>}
      </div>
    </div>
  );
}

export default OnboardingFlow;
