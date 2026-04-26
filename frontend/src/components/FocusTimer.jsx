import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@config/supabase';
import { useSubjects } from '@context/SubjectContext';
import { localDateKey } from '@utils/helpers';

const POMODORO_WORK_SECONDS = 25 * 60;
const POMODORO_BREAK_SECONDS = 5 * 60;
const DEFAULT_FLOW_MINUTES = 45;
const MIN_FLOW_MINUTES = 1;
const MAX_FLOW_MINUTES = 300;
const RING_RADIUS = 132;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const clampFlowMinutes = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_FLOW_MINUTES;
  }

  return Math.min(MAX_FLOW_MINUTES, Math.max(MIN_FLOW_MINUTES, Math.round(numericValue)));
};

const formatCountdown = (seconds) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

const getSummaryMinutes = (studySeconds) => (
  studySeconds > 0 ? Math.ceil(studySeconds / 60) : 0
);

const isTaskScheduledForToday = (task, todayKey) => (
  task.targetDate === todayKey
  || (!task.targetDate && task.createdAt && localDateKey(new Date(task.createdAt)) === todayKey)
);

export default function FocusTimer({ userId, tasks, onClose }) {
  const { subjects } = useSubjects();
  const [view, setView] = useState('setup');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [mode, setMode] = useState('pomodoro');
  const [flowMinutes, setFlowMinutes] = useState(DEFAULT_FLOW_MINUTES);
  const [phase, setPhase] = useState('work');
  const [phaseDuration, setPhaseDuration] = useState(POMODORO_WORK_SECONDS);
  const [remainingSeconds, setRemainingSeconds] = useState(POMODORO_WORK_SECONDS);
  const [studySeconds, setStudySeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [summaryMinutes, setSummaryMinutes] = useState(0);
  const [didCompleteTask, setDidCompleteTask] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef(null);
  const sessionSavedRef = useRef(false);
  const phaseRef = useRef(phase);
  const remainingRef = useRef(remainingSeconds);
  const studySecondsRef = useRef(studySeconds);
  const modeRef = useRef(mode);

  const todayKey = localDateKey();

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId) || null,
    [selectedSubjectId, subjects]
  );

  const availableTasks = useMemo(() => (
    tasks.filter((task) => (
      !task.completed
      && task.subjectId === selectedSubjectId
      && isTaskScheduledForToday(task, todayKey)
    ))
  ), [selectedSubjectId, tasks, todayKey]);

  const selectedTask = useMemo(
    () => availableTasks.find((task) => task.id === selectedTaskId) || null,
    [availableTasks, selectedTaskId]
  );

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    remainingRef.current = remainingSeconds;
  }, [remainingSeconds]);

  useEffect(() => {
    studySecondsRef.current = studySeconds;
  }, [studySeconds]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (selectedTaskId && !availableTasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId('');
    }
  }, [availableTasks, selectedTaskId]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finishSession = useCallback((finalStudySeconds) => {
    clearTimer();
    setIsRunning(false);
    setSummaryMinutes(getSummaryMinutes(finalStudySeconds));
    setView('summary');
  }, [clearTimer]);

  const runTick = useCallback(() => {
    const currentPhase = phaseRef.current;
    const shouldCountStudy = currentPhase === 'work' || currentPhase === 'flow';
    const nextStudySeconds = studySecondsRef.current + (shouldCountStudy ? 1 : 0);
    const nextRemainingSeconds = Math.max(remainingRef.current - 1, 0);

    setStudySeconds(nextStudySeconds);
    setRemainingSeconds(nextRemainingSeconds);

    if (nextRemainingSeconds > 0) {
      return;
    }

    if (modeRef.current === 'pomodoro' && currentPhase === 'work') {
      setPhase('break');
      setPhaseDuration(POMODORO_BREAK_SECONDS);
      setRemainingSeconds(POMODORO_BREAK_SECONDS);
      return;
    }

    finishSession(nextStudySeconds);
  }, [finishSession]);

  useEffect(() => {
    if (!isRunning || view !== 'running') {
      clearTimer();
      return undefined;
    }

    intervalRef.current = window.setInterval(runTick, 1000);

    return () => {
      clearTimer();
    };
  }, [isRunning, runTick, view, clearTimer]);

  useEffect(() => () => {
    clearTimer();
  }, [clearTimer]);

  const handleStart = () => {
    if (!selectedSubjectId) {
      return;
    }

    const nextFlowMinutes = clampFlowMinutes(flowMinutes);
    const nextMode = mode === 'flow' ? 'flow' : 'pomodoro';
    const nextPhase = nextMode === 'pomodoro' ? 'work' : 'flow';
    const nextDuration = nextMode === 'pomodoro'
      ? POMODORO_WORK_SECONDS
      : nextFlowMinutes * 60;

    setMode(nextMode);
    setFlowMinutes(nextFlowMinutes);
    setPhase(nextPhase);
    setPhaseDuration(nextDuration);
    setRemainingSeconds(nextDuration);
    setStudySeconds(0);
    setSummaryMinutes(0);
    setDidCompleteTask(false);
    setSaveError('');
    sessionSavedRef.current = false;
    setView('running');
    setIsRunning(true);
  };

  const handlePauseToggle = () => {
    setIsRunning((currentValue) => !currentValue);
  };

  const handleEndSession = () => {
    finishSession(studySecondsRef.current);
  };

  const handleDone = async () => {
    if (!supabase || !userId || !selectedSubjectId || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError('');

    const durationMinutes = getSummaryMinutes(studySecondsRef.current);

    if (!sessionSavedRef.current) {
      const { error: insertError } = await supabase
        .from('study_sessions')
        .insert({
          user_id: userId,
          subject_id: selectedSubjectId,
          task_id: selectedTaskId || null,
          duration_minutes: durationMinutes,
          session_date: todayKey
        });

      if (insertError) {
        setSaveError(insertError.message || 'Unable to save this session right now.');
        setIsSaving(false);
        return;
      }

      sessionSavedRef.current = true;
    }

    if (selectedTaskId && didCompleteTask) {
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          completed: true,
          completed_day: todayKey
        })
        .eq('id', selectedTaskId);

      if (taskError) {
        setSaveError(taskError.message || 'Session was saved, but the task could not be updated.');
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    onClose();
  };

  const progress = phaseDuration > 0 ? remainingSeconds / phaseDuration : 0;
  const ringOffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <div className="focus-timer-overlay" role="dialog" aria-modal="true" aria-label="Focus timer">
      <div className="focus-timer-shell">
        {view === 'setup' && (
          <div className="focus-timer-panel">
            <div className="focus-timer-head">
              <div>
                <p className="section-label">Focus Session</p>
                <h2 className="section-title">Set up your study block</h2>
              </div>
              <button type="button" className="focus-timer-close" onClick={onClose}>
                Close
              </button>
            </div>

            <div className="focus-timer-form">
              <label className="focus-timer-field">
                <span className="focus-timer-label">What are you studying?</span>
                <select
                  className="subject-input"
                  value={selectedSubjectId}
                  onChange={(event) => setSelectedSubjectId(event.target.value)}
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="focus-timer-field">
                <span className="focus-timer-label">Which task?</span>
                <select
                  className="subject-input"
                  value={selectedTaskId}
                  onChange={(event) => setSelectedTaskId(event.target.value)}
                  disabled={!selectedSubjectId}
                >
                  <option value="">General study</option>
                  {availableTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.text}
                    </option>
                  ))}
                </select>
              </label>

              <div className="focus-timer-field">
                <span className="focus-timer-label">Mode</span>
                <div className="focus-timer-toggle">
                  <button
                    type="button"
                    className={`focus-timer-toggle-option${mode === 'pomodoro' ? ' active' : ''}`}
                    onClick={() => setMode('pomodoro')}
                  >
                    Pomodoro
                  </button>
                  <button
                    type="button"
                    className={`focus-timer-toggle-option${mode === 'flow' ? ' active' : ''}`}
                    onClick={() => setMode('flow')}
                  >
                    Flow
                  </button>
                </div>
              </div>

              {mode === 'flow' && (
                <label className="focus-timer-field">
                  <span className="focus-timer-label">Duration (minutes)</span>
                  <input
                    className="subject-input"
                    type="number"
                    min={MIN_FLOW_MINUTES}
                    max={MAX_FLOW_MINUTES}
                    value={flowMinutes}
                    onChange={(event) => setFlowMinutes(event.target.value)}
                  />
                </label>
              )}
            </div>

            <div className="focus-timer-actions">
              <button
                type="button"
                className="dashboard-focus-button"
                onClick={handleStart}
                disabled={!selectedSubjectId}
              >
                Start Session
              </button>
            </div>
          </div>
        )}

        {view === 'running' && (
          <div className="focus-timer-panel focus-timer-panel-running">
            <div className="focus-timer-running-copy">
              <p className="focus-timer-meta">{selectedSubject?.name || 'No subject'}</p>
              <p className="focus-timer-meta">{selectedTask?.text || 'General study'}</p>
              {mode === 'pomodoro' && (
                <p className="focus-timer-phase">{phase === 'break' ? 'Break' : 'Work'}</p>
              )}
            </div>

            <div className="focus-timer-ring-shell">
              <svg className="focus-timer-ring" viewBox="0 0 320 320" aria-hidden="true">
                <circle
                  className="focus-timer-ring-track"
                  cx="160"
                  cy="160"
                  r={RING_RADIUS}
                />
                <circle
                  className="focus-timer-ring-progress"
                  cx="160"
                  cy="160"
                  r={RING_RADIUS}
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <div className="focus-timer-countdown mono">{formatCountdown(remainingSeconds)}</div>
            </div>

            <div className="focus-timer-actions focus-timer-actions-inline">
              <button type="button" className="focus-timer-secondary" onClick={handlePauseToggle}>
                {isRunning ? 'Pause' : 'Resume'}
              </button>
              <button type="button" className="focus-timer-secondary" onClick={handleEndSession}>
                End Session
              </button>
            </div>
          </div>
        )}

        {view === 'summary' && (
          <div className="focus-timer-panel">
            <div className="focus-timer-head">
              <div>
                <p className="section-label">Session Complete</p>
                <h2 className="section-title">Session complete.</h2>
              </div>
            </div>

            <p className="focus-timer-summary-copy">
              You studied {selectedSubject?.name || 'your subject'} for {summaryMinutes} minute{summaryMinutes === 1 ? '' : 's'}.
            </p>

            {selectedTask && (
              <div className="focus-timer-summary-question">
                <p className="focus-timer-label">Did you complete this task?</p>
                <div className="focus-timer-toggle">
                  <button
                    type="button"
                    className={`focus-timer-toggle-option${didCompleteTask ? ' active' : ''}`}
                    onClick={() => setDidCompleteTask(true)}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={`focus-timer-toggle-option${!didCompleteTask ? ' active' : ''}`}
                    onClick={() => setDidCompleteTask(false)}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {saveError && <p className="section-note section-note-danger">{saveError}</p>}

            <div className="focus-timer-actions">
              <button
                type="button"
                className="dashboard-focus-button"
                onClick={handleDone}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Done'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
