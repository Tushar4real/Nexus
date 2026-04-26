import { supabase } from '@config/supabase';
import { localDateKey, shiftLocalDateKey } from '@utils/helpers';

const mapSubject = (subject) => ({
  id: subject.id,
  userId: subject.user_id,
  name: subject.name,
  color: subject.color,
  examDate: subject.exam_date,
  description: subject.description || '',
  createdAt: subject.created_at
});

const normalizeExamDate = (examDate) => (
  examDate ? new Date(`${examDate}T12:00:00Z`).toISOString() : null
);

export const getSubjects = async (userId) => {
  if (!supabase || !userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', userId)
    .order('exam_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map(mapSubject);
};

export const createSubject = async ({ userId, name, color, examDate, description }) => {
  const { data, error } = await supabase
    .from('subjects')
    .insert({
      user_id: userId,
      name: name.trim(),
      color,
      exam_date: normalizeExamDate(examDate),
      description: description?.trim() || null
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapSubject(data);
};

export const updateSubject = async (id, updates) => {
  const nextUpdates = { ...updates };

  if ('name' in nextUpdates && typeof nextUpdates.name === 'string') {
    nextUpdates.name = nextUpdates.name.trim();
  }

  if ('description' in nextUpdates) {
    nextUpdates.description = nextUpdates.description?.trim() || null;
  }

  if ('examDate' in nextUpdates) {
    nextUpdates.exam_date = normalizeExamDate(nextUpdates.examDate);
    delete nextUpdates.examDate;
  }

  if ('userId' in nextUpdates) {
    nextUpdates.user_id = nextUpdates.userId;
    delete nextUpdates.userId;
  }

  const { data, error } = await supabase
    .from('subjects')
    .update(nextUpdates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapSubject(data);
};

export const deleteSubject = async (id) => {
  const { error: taskUpdateError } = await supabase
    .from('tasks')
    .update({ subject_id: null })
    .eq('subject_id', id);

  if (taskUpdateError) {
    throw taskUpdateError;
  }

  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};

export const getWeeklyStudyMinutes = async (userId) => {
  if (!supabase || !userId) {
    return [];
  }

  const fromDate = shiftLocalDateKey(localDateKey(), -7);

  const { data, error } = await supabase
    .from('study_sessions')
    .select('subject_id, duration_minutes')
    .eq('user_id', userId)
    .gte('session_date', fromDate)
    .order('session_date', { ascending: false });

  if (error) {
    throw error;
  }

  const groupedMinutes = new Map();

  (data || []).forEach((session) => {
    const key = session.subject_id || 'unassigned';
    const nextMinutes = (groupedMinutes.get(key) || 0) + (Number(session.duration_minutes) || 0);
    groupedMinutes.set(key, nextMinutes);
  });

  return Array.from(groupedMinutes.entries()).map(([subjectId, durationMinutes]) => ({
    subjectId: subjectId === 'unassigned' ? null : subjectId,
    durationMinutes
  }));
};
