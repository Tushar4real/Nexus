import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@config/supabase';
import { getSubjects } from '../lib/subjects';

const SubjectContext = createContext({
  subjects: [],
  loading: false,
  error: null,
  refetchSubjects: async () => []
});

export const SubjectProvider = ({ children }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    if (!supabase) {
      setSubjects([]);
      setUserId('');
      setLoading(false);
      setError(null);
      return undefined;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      setUserId(data.session?.user?.id || '');
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      setUserId(session?.user?.id || '');
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const refetchSubjects = useCallback(async (nextUserId = userId) => {
    if (!nextUserId) {
      setSubjects([]);
      setLoading(false);
      setError(null);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const nextSubjects = await getSubjects(nextUserId);
      setSubjects(nextSubjects);
      return nextSubjects;
    } catch (loadError) {
      setError(loadError);
      throw loadError;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setSubjects([]);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;

    const loadSubjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const nextSubjects = await getSubjects(userId);
        if (active) {
          setSubjects(nextSubjects);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSubjects();

    return () => {
      active = false;
    };
  }, [userId]);

  const value = useMemo(() => ({
    subjects,
    loading,
    error,
    refetchSubjects
  }), [subjects, loading, error, refetchSubjects]);

  return (
    <SubjectContext.Provider value={value}>
      {children}
    </SubjectContext.Provider>
  );
};

export const useSubjects = () => useContext(SubjectContext);
