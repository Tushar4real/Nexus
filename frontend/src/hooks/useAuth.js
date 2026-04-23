import { useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured, missingSupabaseKeys } from '@config/supabase';

const profileCache = new Map();

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

const buildUser = (authUser, profile = {}) => ({
  ...authUser,
  ...profile,
  uid: authUser.id,
  name: profile.name || authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'User',
  email: profile.email || authUser.email || '',
  avatar: profile.avatar || buildAvatar(
    profile.name || authUser.user_metadata?.name || authUser.user_metadata?.full_name,
    profile.email || authUser.email || ''
  )
});

const normalizeAuthError = (error, fallbackMessage) => {
  const message = error?.message || fallbackMessage;
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('email rate limit exceeded')) {
    return 'Too many auth emails were requested. Wait a few minutes and try again, or disable email confirmation while testing locally.';
  }

  return message;
};

const fetchProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
};

const upsertProfile = async (authUser, nameOverride) => {
  const name = nameOverride || authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'User';
  const email = authUser.email || '';
  const avatar = buildAvatar(name, email);

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: authUser.id,
      name,
      email,
      avatar
    }, { onConflict: 'id' });

  if (error) {
    throw error;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [configError, setConfigError] = useState(null);
  const latestHydrationId = useRef(0);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setConfigError(`Supabase is not configured. Missing: ${missingSupabaseKeys.join(', ')}`);
      setLoading(false);
      return;
    }

    let active = true;

    const hydrateUser = async (authUser) => {
      const hydrationId = ++latestHydrationId.current;

      if (!authUser) {
        if (active) {
          setUser(null);
          setError(null);
          setConfigError(null);
          setLoading(false);
        }
        return;
      }

      if (active) {
        setUser((currentUser) => currentUser?.uid === authUser.id
          ? currentUser
          : buildUser(authUser, profileCache.get(authUser.id) || {}));
        setLoading(false);
      }

      try {
        let profile = profileCache.get(authUser.id) || await fetchProfile(authUser.id);

        if (!profile) {
          await upsertProfile(authUser);
          profile = await fetchProfile(authUser.id);
        }

        if (active && latestHydrationId.current === hydrationId) {
          if (profile) {
            profileCache.set(authUser.id, profile);
          }
          setUser(buildUser(authUser, profile || {}));
          setError(null);
          setConfigError(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth error:', err);
        if (active && latestHydrationId.current === hydrationId) {
          setUser(buildUser(authUser));
          setError(normalizeAuthError(err, 'Unable to load profile details.'));
          setConfigError(null);
          setLoading(false);
        }
      }
    };

    supabase.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) {
          throw sessionError;
        }

        return hydrateUser(data.session?.user ?? null);
      })
      .catch((err) => {
        console.error('Session bootstrap error:', err);
        if (active) {
          setError(normalizeAuthError(err, 'Unable to initialize authentication.'));
          setLoading(false);
        }
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void hydrateUser(session?.user ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signup = async (email, password, name) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured');
    }

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (signupError) {
      throw new Error(normalizeAuthError(signupError, 'Authentication failed'));
    }

    if (data.user && data.session) {
      await upsertProfile(data.user, name);
      const profile = {
        id: data.user.id,
        name,
        email: data.user.email || '',
        avatar: buildAvatar(name, data.user.email || '')
      };
      profileCache.set(data.user.id, profile);
      setUser(buildUser(data.user, profile));
      setError(null);
      setConfigError(null);
      setLoading(false);
    }

    return data.user;
  };

  const login = async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured');
    }

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) {
      throw new Error(normalizeAuthError(loginError, 'Authentication failed'));
    }

    if (data.user) {
      setUser((currentUser) => currentUser?.uid === data.user.id
        ? currentUser
        : buildUser(data.user, profileCache.get(data.user.id) || {}));
      setError(null);
      setConfigError(null);
      setLoading(false);
    }

    return data;
  };

  const logout = async () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured');
    }

    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      throw logoutError;
    }

    if (user?.uid) {
      profileCache.delete(user.uid);
    }

    setUser(null);
    setError(null);
    setConfigError(null);
    setLoading(false);
  };

  return { user, loading, signup, login, logout, error, configError };
};
