import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@config/supabase';
import { localDateKey } from '@utils/helpers';

const mapTask = (task) => ({
  id: task.id,
  text: task.text,
  weight: task.weight,
  completed: task.completed,
  createdAt: task.created_at,
  targetDate: task.target_date,
  completedDay: task.completed_day
});

export const useTasks = (userId) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase || !userId) {
      setTasks([]);
      setError(null);
      setLoading(false);
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

      setTasks((data || []).map(mapTask));
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
    async addTask(text, weight) {
      if (!supabase || !userId) {
        return;
      }

      const { error: insertError } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          text: text.trim(),
          weight,
          completed: false,
          target_date: localDateKey(),
          completed_day: null
        });

      if (insertError) {
        throw insertError;
      }
    },

    async toggleTask(task) {
      if (!supabase || !task?.id) {
        return;
      }

      const nextCompleted = !task.completed;

      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          completed: nextCompleted,
          completed_day: nextCompleted ? localDateKey() : null
        })
        .eq('id', task.id);

      if (updateError) {
        throw updateError;
      }
    },

    async moveTaskToDate(taskId, targetDate) {
      if (!supabase || !taskId || !targetDate) {
        return;
      }

      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          target_date: targetDate
        })
        .eq('id', taskId);

      if (updateError) {
        throw updateError;
      }
    },

    async deleteTask(taskId) {
      if (!supabase || !taskId) {
        return;
      }

      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) {
        throw deleteError;
      }
    }
  }), [userId]);

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
