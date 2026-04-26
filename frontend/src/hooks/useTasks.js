import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@config/supabase';
import { localDateKey } from '@utils/helpers';

const TASK_TEXT_COLUMNS = ['text', 'title', 'name', 'description'];

const resolveTaskText = (task) => (
  TASK_TEXT_COLUMNS
    .map((column) => task?.[column])
    .find((value) => typeof value === 'string' && value.trim())
    ?.trim() || ''
);

const detectTaskTextColumn = (task) => (
  TASK_TEXT_COLUMNS.find((column) => typeof task?.[column] === 'string') || 'text'
);

const isMissingColumnError = (error, column) => {
  const message = error?.message?.toLowerCase() || '';
  return message.includes(`could not find the '${column.toLowerCase()}' column`);
};

const mapTask = (task) => ({
  id: task.id,
  text: resolveTaskText(task),
  weight: task.weight,
  completed: task.completed,
  createdAt: task.created_at,
  targetDate: task.target_date,
  completedDay: task.completed_day,
  subjectId: task.subject_id || '',
  estimatedMinutes: typeof task.estimated_minutes === 'number' ? task.estimated_minutes : 30
});

const sortTasks = (tasks) => [...tasks].sort((a, b) => {
  const targetCompare = (a.targetDate || '').localeCompare(b.targetDate || '');
  if (targetCompare !== 0) {
    return targetCompare;
  }

  const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return aCreated - bCreated;
});

const upsertTaskInList = (tasks, nextTask) => {
  const existingIndex = tasks.findIndex((task) => task.id === nextTask.id);

  if (existingIndex === -1) {
    return sortTasks([...tasks, nextTask]);
  }

  const nextTasks = [...tasks];
  nextTasks[existingIndex] = {
    ...nextTasks[existingIndex],
    ...nextTask
  };

  return sortTasks(nextTasks);
};

export const useTasks = (userId) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskTextColumn, setTaskTextColumn] = useState('text');

  useEffect(() => {
    if (!supabase || !userId) {
      setTasks([]);
      setError(null);
      setLoading(false);
      setTaskTextColumn('text');
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    const loadTasks = async () => {
      const { data, error: loadError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('target_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (!active) {
        return;
      }

      if (loadError) {
        console.error('Error loading tasks:', loadError);
        setError(loadError);
        setLoading(false);
        return;
      }

      const nextTasks = (data || []).map(mapTask);
      const firstTaskWithText = (data || []).find((task) => resolveTaskText(task));

      if (firstTaskWithText) {
        setTaskTextColumn(detectTaskTextColumn(firstTaskWithText));
      }

      setTasks(sortTasks(nextTasks));
      setError(null);
      setLoading(false);
    };

    void loadTasks();

    const channel = supabase
      .channel(`tasks:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        },
        () => {
          void loadTasks();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const api = useMemo(() => ({
    async addTask(text, weight, options = {}) {
      if (!supabase || !userId) {
        return;
      }

      const trimmedText = text.trim();
      const basePayload = {
        user_id: userId,
        weight,
        completed: false,
        target_date: localDateKey(),
        completed_day: null,
        subject_id: options.subjectId || null,
        estimated_minutes: Number.isFinite(Number(options.estimatedMinutes))
          ? Number(options.estimatedMinutes)
          : 30
      };

      const candidateColumns = [
        taskTextColumn,
        ...TASK_TEXT_COLUMNS.filter((column) => column !== taskTextColumn)
      ];

      let lastError = null;

      for (const column of candidateColumns) {
        const { data, error: insertError } = await supabase
          .from('tasks')
          .insert({
            ...basePayload,
            [column]: trimmedText
          })
          .select('*')
          .single();

        if (!insertError) {
          setTaskTextColumn(column);
          if (data) {
            setTasks((currentTasks) => upsertTaskInList(currentTasks, mapTask(data)));
          }
          setError(null);
          return;
        }

        lastError = insertError;

        if (!isMissingColumnError(insertError, column)) {
          throw insertError;
        }
      }

      throw lastError || new Error('Unable to add task right now.');
    },

    async toggleTask(task) {
      if (!supabase || !task?.id) {
        return;
      }

      const nextCompleted = !task.completed;
      const optimisticTask = {
        ...task,
        completed: nextCompleted,
        completedDay: nextCompleted ? localDateKey() : null
      };

      setTasks((currentTasks) => upsertTaskInList(currentTasks, optimisticTask));

      const { data, error: updateError } = await supabase
        .from('tasks')
        .update({
          completed: nextCompleted,
          completed_day: nextCompleted ? localDateKey() : null
        })
        .eq('id', task.id)
        .select('*')
        .single();

      if (updateError) {
        setTasks((currentTasks) => upsertTaskInList(currentTasks, task));
        throw updateError;
      }

      if (data) {
        setTasks((currentTasks) => upsertTaskInList(currentTasks, mapTask(data)));
      }
    },

    async moveTaskToDate(taskId, targetDate) {
      if (!supabase || !taskId || !targetDate) {
        return;
      }

      const currentTask = tasks.find((task) => task.id === taskId);

      if (currentTask) {
        setTasks((currentTasks) => upsertTaskInList(currentTasks, {
          ...currentTask,
          targetDate
        }));
      }

      const { data, error: updateError } = await supabase
        .from('tasks')
        .update({
          target_date: targetDate
        })
        .eq('id', taskId)
        .select('*')
        .single();

      if (updateError) {
        if (currentTask) {
          setTasks((currentTasks) => upsertTaskInList(currentTasks, currentTask));
        }
        throw updateError;
      }

      if (data) {
        setTasks((currentTasks) => upsertTaskInList(currentTasks, mapTask(data)));
      }
    },

    async deleteTask(taskId) {
      if (!supabase || !taskId) {
        return;
      }

      const currentTask = tasks.find((task) => task.id === taskId);
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));

      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) {
        if (currentTask) {
          setTasks((currentTasks) => upsertTaskInList(currentTasks, currentTask));
        }
        throw deleteError;
      }
    }
  }), [taskTextColumn, tasks, userId]);

  return {
    tasks,
    loading,
    error,
    addTask: api.addTask,
    toggleTask: api.toggleTask,
    moveTaskToDate: api.moveTaskToDate,
    deleteTask: api.deleteTask
  };
};
