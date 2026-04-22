import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '@config/firebase';
import { localDateKey } from '@utils/helpers';

export const useTasks = (userId) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db || !userId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const nextTasks = snapshot.docs
          .map((taskDoc) => {
            const data = taskDoc.data();

            return {
              id: data.id || taskDoc.id,
              ...data
            };
          })
          .sort((a, b) => {
            const targetCompare = (a.targetDate || '').localeCompare(b.targetDate || '');
            if (targetCompare !== 0) {
              return targetCompare;
            }

            const aCreated = a.createdAt?.seconds || 0;
            const bCreated = b.createdAt?.seconds || 0;
            return aCreated - bCreated;
          });

        setTasks(nextTasks);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        console.error('Error loading tasks:', snapshotError);
        setError(snapshotError);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const api = useMemo(() => ({
    async addTask(text, weight) {
      if (!db || !userId) {
        return;
      }

      const taskRef = doc(collection(db, 'tasks'));

      await setDoc(taskRef, {
        id: taskRef.id,
        userId,
        text: text.trim(),
        weight,
        completed: false,
        createdAt: serverTimestamp(),
        targetDate: localDateKey(),
        completedDay: null
      });
    },

    async toggleTask(task) {
      if (!db || !task?.id) {
        return;
      }

      const nextCompleted = !task.completed;

      await updateDoc(doc(db, 'tasks', task.id), {
        completed: nextCompleted,
        completedDay: nextCompleted ? localDateKey() : null
      });
    }
  }), [userId]);

  return {
    tasks,
    loading,
    error,
    addTask: api.addTask,
    toggleTask: api.toggleTask
  };
};
