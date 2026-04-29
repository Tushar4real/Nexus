/* SQL note: -- public.profiles requires these columns if they do not exist yet: display_name text, bio text, avatar_color text default '#4F46E5', school text, target_date date, theme text, accent_color text, default_page text */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@config/supabase';
import { useTheme } from '@context/ThemeContext';
import { localDateKey } from '@utils/helpers';

const DEFAULT_AVATAR_COLOR = '#4F46E5';
const AVATAR_SWATCHES = ['#4F46E5', '#6366F1', '#C3C0FF', '#FFB695', '#918FA1', '#2A2933'];
const ACCENT_OPTIONS = [
  { label: 'Indigo', value: '#4F46E5' },
  { label: 'Violet', value: '#6366F1' },
  { label: 'Periwinkle', value: '#7C7BFF' },
  { label: 'Mist', value: '#C3C0FF' },
  { label: 'Scholar', value: '#B7C8E1' },
  { label: 'Ember', value: '#FFB695' },
  { label: 'Slate', value: '#918FA1' },
  { label: 'Ink', value: '#2A2933' }
];
const THEME_OPTIONS = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' }
];
const DEFAULT_PAGE_OPTIONS = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Tasks', value: 'tasks' },
  { label: 'Subjects', value: 'subjects' },
  { label: 'Analytics', value: 'analytics' }
];
const PROFILE_SELECT_FULL = 'id,name,email,avatar,display_name,bio,avatar_color,school,target_date,theme,accent_color,default_page';
const PROFILE_SELECT_SAFE = 'id,name,email,avatar';
const EMPTY_PROFILE = {
  display_name: '',
  bio: '',
  avatar_color: DEFAULT_AVATAR_COLOR,
  school: '',
  target_date: '',
  theme: 'system',
  accent_color: '#4F46E5',
  default_page: 'dashboard'
};

const getLocalProfileKey = (userId) => `nexus-profile-overrides:${userId}`;

const readLocalProfile = (userId) => {
  if (!userId || typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(getLocalProfileKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeLocalProfile = (userId, patch) => {
  if (!userId || typeof window === 'undefined') {
    return {};
  }

  const nextValue = { ...readLocalProfile(userId), ...patch };
  window.localStorage.setItem(getLocalProfileKey(userId), JSON.stringify(nextValue));
  return nextValue;
};

const clearLocalProfile = (userId) => {
  if (!userId || typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(getLocalProfileKey(userId));
};

const clearLocalProfileFields = (userId, fields) => {
  if (!userId || typeof window === 'undefined') {
    return {};
  }

  const nextValue = { ...readLocalProfile(userId) };
  fields.forEach((field) => {
    delete nextValue[field];
  });

  if (Object.keys(nextValue).length === 0) {
    window.localStorage.removeItem(getLocalProfileKey(userId));
    return {};
  }

  window.localStorage.setItem(getLocalProfileKey(userId), JSON.stringify(nextValue));
  return nextValue;
};

const isMissingColumnError = (error, column) => {
  const message = error?.message?.toLowerCase() || '';
  const normalizedColumn = column.toLowerCase();
  return (
    message.includes(`could not find the '${normalizedColumn}' column`)
    || message.includes(`column profiles.${normalizedColumn} does not exist`)
    || message.includes(`column "profiles"."${normalizedColumn}" does not exist`)
    || message.includes(`column "${normalizedColumn}" does not exist`)
  );
};

const isMissingProfileColumnError = (error) => (
  ['display_name', 'bio', 'avatar_color', 'school', 'target_date', 'theme', 'accent_color', 'default_page']
    .some((column) => isMissingColumnError(error, column))
);

const hasProfileColumn = (profileRow, column) => Boolean(profileRow) && Object.prototype.hasOwnProperty.call(profileRow, column);

const resolveStoredValue = ({ hasColumn, rowValue, localValue, fallbackValue }) => {
  if (hasColumn) {
    return rowValue ?? fallbackValue;
  }

  if (localValue !== undefined) {
    return localValue ?? fallbackValue;
  }

  return fallbackValue;
};

const buildInitials = (name, email = '') => {
  const source = (name || email || 'User').trim();
  return source
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatMemberSince = (value) => {
  if (!value) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(new Date(value));
};

const getCountdownMeta = (targetDate) => {
  if (!targetDate) {
    return null;
  }

  const today = new Date(`${localDateKey()}T00:00:00`);
  const target = new Date(`${targetDate}T00:00:00`);
  const diffDays = Math.ceil((target.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return {
      tone: 'muted',
      text: 'Semester ended - update your target date'
    };
  }

  if (diffDays === 0) {
    return {
      tone: 'danger',
      text: 'Exams start today'
    };
  }

  if (diffDays === 1) {
    return {
      tone: 'danger',
      text: 'Exams start tomorrow'
    };
  }

  return {
    tone: 'amber',
    text: `Finals in ${diffDays} day${diffDays === 1 ? '' : 's'}`
  };
};

const fetchProfileRecord = async (userId) => {
  let response = await supabase
    .from('profiles')
    .select(PROFILE_SELECT_FULL)
    .eq('id', userId)
    .maybeSingle();

  if (response.error && isMissingProfileColumnError(response.error)) {
    response = await supabase
      .from('profiles')
      .select(PROFILE_SELECT_SAFE)
      .eq('id', userId)
      .maybeSingle();
  }

  if (response.error) {
    throw response.error;
  }

  return response.data || null;
};

const buildProfileUpsertPayload = (user, profileRow, patch) => {
  const displayName = patch.display_name ?? profileRow?.display_name ?? profileRow?.name ?? user?.name ?? 'User';
  const email = profileRow?.email ?? user?.email ?? '';
  return {
    id: user.uid,
    name: patch.name ?? profileRow?.name ?? displayName,
    email,
    avatar: profileRow?.avatar ?? buildInitials(displayName, email),
    ...patch
  };
};

const resolveProfileState = (profileRow, authUser, localProfile = {}, themeMode = 'system', accentColor = '#4F46E5') => ({
  display_name: resolveStoredValue({
    hasColumn: hasProfileColumn(profileRow, 'display_name'),
    rowValue: profileRow?.display_name,
    localValue: localProfile.display_name,
    fallbackValue: profileRow?.name || authUser?.name || ''
  }),
  bio: resolveStoredValue({
    hasColumn: hasProfileColumn(profileRow, 'bio'),
    rowValue: profileRow?.bio,
    localValue: localProfile.bio,
    fallbackValue: ''
  }),
  avatar_color: resolveStoredValue({
    hasColumn: hasProfileColumn(profileRow, 'avatar_color'),
    rowValue: profileRow?.avatar_color,
    localValue: localProfile.avatar_color,
    fallbackValue: DEFAULT_AVATAR_COLOR
  }),
  school: resolveStoredValue({
    hasColumn: hasProfileColumn(profileRow, 'school'),
    rowValue: profileRow?.school,
    localValue: localProfile.school,
    fallbackValue: ''
  }),
  target_date: resolveStoredValue({
    hasColumn: hasProfileColumn(profileRow, 'target_date'),
    rowValue: profileRow?.target_date?.slice(0, 10) || '',
    localValue: localProfile.target_date,
    fallbackValue: ''
  }),
  theme: resolveStoredValue({
    hasColumn: hasProfileColumn(profileRow, 'theme'),
    rowValue: profileRow?.theme,
    localValue: localProfile.theme,
    fallbackValue: themeMode || 'system'
  }),
  accent_color: resolveStoredValue({
    hasColumn: hasProfileColumn(profileRow, 'accent_color'),
    rowValue: profileRow?.accent_color,
    localValue: localProfile.accent_color,
    fallbackValue: accentColor || '#4F46E5'
  }),
  default_page: resolveStoredValue({
    hasColumn: hasProfileColumn(profileRow, 'default_page'),
    rowValue: profileRow?.default_page,
    localValue: localProfile.default_page,
    fallbackValue: 'dashboard'
  })
});

const ProfileSkeleton = () => (
  <section className="profile-page">
    <div className="profile-loading-stack">
      <div className="profile-skeleton-card profile-skeleton-identity" />
      <div className="profile-skeleton-card profile-skeleton-academic" />
      <div className="profile-skeleton-card profile-skeleton-preferences" />
      <div className="profile-skeleton-card profile-skeleton-account" />
    </div>
    <style>{profileStyles}</style>
  </section>
);

const Profile = ({ user, onLogout, onRefreshProfile }) => {
  const navigate = useNavigate();
  const { theme, themeMode, accentColor, setThemeMode, setAccentColor } = useTheme();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [profileRow, setProfileRow] = useState(null);
  const [localProfile, setLocalProfile] = useState({});
  const [email, setEmail] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [editingField, setEditingField] = useState('');
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [savingField, setSavingField] = useState('');
  const [inlineSaved, setInlineSaved] = useState({});
  const [toasts, setToasts] = useState([]);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const themeModeRef = useRef(themeMode);
  const accentColorRef = useRef(accentColor);
  const toastTimeoutsRef = useRef(new Map());
  const inlineTimeoutsRef = useRef(new Map());

  const persistedProfile = useMemo(
    () => resolveProfileState(profileRow, user, localProfile, themeMode, accentColor),
    [accentColor, localProfile, profileRow, themeMode, user]
  );
  const countdownMeta = useMemo(() => getCountdownMeta(profile.target_date), [profile.target_date]);
  const initials = useMemo(() => buildInitials(profile.display_name, email), [email, profile.display_name]);

  const pushToast = (message, tone = 'default') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, message, tone }]);
    const timeoutId = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      toastTimeoutsRef.current.delete(id);
    }, 2600);
    toastTimeoutsRef.current.set(id, timeoutId);
  };

  const flashInlineSaved = (field) => {
    setInlineSaved((current) => ({ ...current, [field]: true }));

    if (inlineTimeoutsRef.current.has(field)) {
      window.clearTimeout(inlineTimeoutsRef.current.get(field));
    }

    const timeoutId = window.setTimeout(() => {
      setInlineSaved((current) => ({ ...current, [field]: false }));
      inlineTimeoutsRef.current.delete(field);
    }, 2000);

    inlineTimeoutsRef.current.set(field, timeoutId);
  };

  useEffect(() => () => {
    toastTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    inlineTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
  }, []);

  useEffect(() => {
    themeModeRef.current = themeMode;
    accentColorRef.current = accentColor;
  }, [accentColor, themeMode]);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      setLoading(true);

      try {
        const [profileResponse, authResponse] = await Promise.all([
          fetchProfileRecord(user.uid),
          supabase.auth.getUser()
        ]);

        if (authResponse.error) {
          throw authResponse.error;
        }

        const nextProfileRow = profileResponse || null;
        const nextLocalProfile = readLocalProfile(user.uid);
        const nextThemePreference = hasProfileColumn(nextProfileRow, 'theme')
          ? nextProfileRow?.theme
          : nextLocalProfile.theme;
        const nextAccentPreference = hasProfileColumn(nextProfileRow, 'accent_color')
          ? nextProfileRow?.accent_color
          : nextLocalProfile.accent_color;
        const nextProfile = resolveProfileState(
          nextProfileRow,
          user,
          nextLocalProfile,
          nextThemePreference || 'system',
          nextAccentPreference || '#4F46E5'
        );
        const authUser = authResponse.data?.user || null;

        setProfileRow(nextProfileRow);
        setLocalProfile(nextLocalProfile);
        setProfile(nextProfile);
        setDisplayNameDraft(nextProfile.display_name);
        setBioDraft(nextProfile.bio);
        setEmail(authUser?.email || user.email || '');
        setMemberSince(formatMemberSince(authUser?.created_at || user.created_at));

        if (nextProfile.theme !== themeModeRef.current) {
          setThemeMode(nextProfile.theme);
        }

        if (nextProfile.accent_color !== accentColorRef.current) {
          setAccentColor(nextProfile.accent_color);
        }
      } catch (error) {
        pushToast(error.message || 'Unable to load your profile right now.', 'error');
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [setAccentColor, setThemeMode, user]);

  const persistLocalPatch = (patch) => {
    const nextLocalProfile = writeLocalProfile(user.uid, patch);
    setLocalProfile(nextLocalProfile);
    const nextProfile = resolveProfileState(profileRow, user, nextLocalProfile, themeMode, accentColor);
    setProfile(nextProfile);
    return nextProfile;
  };

  const clearPersistedLocalPatch = (fields) => {
    const nextLocalProfile = clearLocalProfileFields(user.uid, fields);
    setLocalProfile(nextLocalProfile);
    return nextLocalProfile;
  };

  const updateProfileRecord = async (payload, options = {}) => {
    if (!user?.uid) {
      throw new Error('No active user session.');
    }

    const {
      successMessage = '',
      fallbackPayload = null,
      localFallback = null,
      refreshAfterSave = false
    } = options;

    setSavingField(Object.keys(payload)[0] || '');

    const matchesMissingColumn = (error, record) => Object.keys(record || {}).some((key) => isMissingColumnError(error, key));
    const runUpdate = async (record) => supabase
      .from('profiles')
      .update(record)
      .eq('id', user.uid)
      .select('id')
      .maybeSingle();
    const runUpsert = async (record) => supabase
      .from('profiles')
      .upsert(buildProfileUpsertPayload(user, profileRow, record), { onConflict: 'id' })
      .select('id')
      .maybeSingle();

    let activePayload = payload;
    let primaryError = null;

    let primaryResponse = await runUpdate(payload);

    if (!primaryResponse.error && !primaryResponse.data) {
      primaryResponse = await runUpsert(payload);
    }

    if (primaryResponse.error) {
      primaryError = primaryResponse.error;

      if (fallbackPayload && matchesMissingColumn(primaryError, payload)) {
        let fallbackResponse = await runUpdate(fallbackPayload);

        if (!fallbackResponse.error && !fallbackResponse.data) {
          fallbackResponse = await runUpsert(fallbackPayload);
        }

        if (fallbackResponse.error) {
          setSavingField('');

          if (localFallback && matchesMissingColumn(fallbackResponse.error, fallbackPayload)) {
            persistLocalPatch(localFallback);

            if (successMessage) {
              pushToast(successMessage, 'success');
            }

            return { ...profileRow, ...localFallback };
          }

          throw fallbackResponse.error;
        }

        activePayload = fallbackPayload;
      } else {
        setSavingField('');

        if (localFallback && matchesMissingColumn(primaryError, payload)) {
          persistLocalPatch(localFallback);

          if (successMessage) {
            pushToast(successMessage, 'success');
          }

          return { ...profileRow, ...localFallback };
        }

        throw primaryError;
      }
    }

    setSavingField('');

    let nextRow = { ...profileRow, ...activePayload };

    try {
      const fetchedProfile = await fetchProfileRecord(user.uid);
      nextRow = fetchedProfile || nextRow;
    } catch (error) {
      if (!localFallback) {
        throw error;
      }
    }

    const nextLocalProfile = clearPersistedLocalPatch(Object.keys(payload));
    const nextProfile = resolveProfileState(nextRow, user, nextLocalProfile, themeMode, accentColor);
    setProfileRow(nextRow);
    setProfile(nextProfile);

    if (refreshAfterSave && typeof onRefreshProfile === 'function') {
      await onRefreshProfile();
    }

    if (successMessage) {
      pushToast(successMessage, 'success');
    }

    return nextRow;
  };

  const handleDisplayNameSave = async () => {
    const nextValue = displayNameDraft.trim();

    if (!nextValue || nextValue === persistedProfile.display_name) {
      setDisplayNameDraft(persistedProfile.display_name);
      setEditingField('');
      return;
    }

    try {
      await updateProfileRecord(
        { display_name: nextValue, name: nextValue },
        {
          successMessage: 'Display name saved.',
          fallbackPayload: { name: nextValue },
          localFallback: { display_name: nextValue },
          refreshAfterSave: true
        }
      );
      setEditingField('');
    } catch (error) {
      pushToast(error.message || 'Unable to save your display name.', 'error');
    }
  };

  const handleBioSave = async () => {
    const nextValue = bioDraft.trim().slice(0, 80);

    if (nextValue === persistedProfile.bio) {
      setBioDraft(persistedProfile.bio);
      setEditingField('');
      return;
    }

    try {
      await updateProfileRecord(
        { bio: nextValue || null },
        {
          successMessage: 'Bio saved.',
          localFallback: { bio: nextValue }
        }
      );
      setEditingField('');
    } catch (error) {
      pushToast(error.message || 'Unable to save your bio.', 'error');
    }
  };

  const handleAvatarColorChange = async (nextColor) => {
    const previous = profile.avatar_color;
    setProfile((current) => ({ ...current, avatar_color: nextColor }));

    try {
      await updateProfileRecord(
        { avatar_color: nextColor },
        {
          successMessage: 'Avatar color changed.',
          localFallback: { avatar_color: nextColor }
        }
      );
    } catch (error) {
      setProfile((current) => ({ ...current, avatar_color: previous }));
      pushToast(error.message || 'Unable to save your avatar color.', 'error');
    }
  };

  const handleSchoolBlur = async () => {
    const nextValue = profile.school.trim();

    if (nextValue === (persistedProfile.school || '')) {
      return;
    }

    try {
      await updateProfileRecord(
        { school: nextValue || null },
        {
          localFallback: { school: nextValue }
        }
      );
      flashInlineSaved('school');
    } catch (error) {
      pushToast(error.message || 'Unable to save your changes.', 'error');
    }
  };

  const handleTargetDateBlur = async () => {
    const nextValue = profile.target_date || '';

    if (nextValue === (persistedProfile.target_date || '')) {
      return;
    }

    try {
      await updateProfileRecord(
        { target_date: nextValue || null },
        { localFallback: { target_date: nextValue } }
      );
      flashInlineSaved('target_date');
    } catch (error) {
      pushToast(error.message || 'Unable to save your changes.', 'error');
    }
  };

  const handleThemeSelect = async (nextTheme) => {
    const previousTheme = profile.theme;
    setProfile((current) => ({ ...current, theme: nextTheme }));
    setThemeMode(nextTheme);

    try {
      await updateProfileRecord(
        { theme: nextTheme },
        {
          successMessage: 'Theme changed.',
          localFallback: { theme: nextTheme }
        }
      );
    } catch (error) {
      setProfile((current) => ({ ...current, theme: previousTheme }));
      setThemeMode(previousTheme);
      pushToast(error.message || 'Unable to save your theme preference.', 'error');
    }
  };

  const handleAccentSelect = async (nextAccent) => {
    const previousAccent = profile.accent_color;
    setProfile((current) => ({ ...current, accent_color: nextAccent }));
    setAccentColor(nextAccent);

    try {
      await updateProfileRecord(
        { accent_color: nextAccent },
        {
          successMessage: 'Accent color changed.',
          localFallback: { accent_color: nextAccent }
        }
      );
    } catch (error) {
      setProfile((current) => ({ ...current, accent_color: previousAccent }));
      setAccentColor(previousAccent);
      pushToast(error.message || 'Unable to save your accent color.', 'error');
    }
  };

  const handleDefaultPageChange = async (event) => {
    const nextValue = event.target.value;
    const previousValue = profile.default_page;
    setProfile((current) => ({ ...current, default_page: nextValue }));

    try {
      await updateProfileRecord(
        { default_page: nextValue },
        {
          localFallback: { default_page: nextValue },
          refreshAfterSave: true
        }
      );
      flashInlineSaved('default_page');
    } catch (error) {
      setProfile((current) => ({ ...current, default_page: previousValue }));
      pushToast(error.message || 'Unable to save your default page.', 'error');
    }
  };

  const handleExport = async () => {
    try {
      const [tasksResponse, subjectsResponse, sessionsResponse] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.uid).order('created_at', { ascending: true }),
        supabase.from('subjects').select('*').eq('user_id', user.uid).order('created_at', { ascending: true }),
        supabase.from('study_sessions').select('*').eq('user_id', user.uid).order('session_date', { ascending: true })
      ]);

      if (tasksResponse.error) {
        throw tasksResponse.error;
      }

      if (subjectsResponse.error) {
        throw subjectsResponse.error;
      }

      if (sessionsResponse.error) {
        throw sessionsResponse.error;
      }

      const subjects = subjectsResponse.data || [];
      const subjectNameById = new Map(subjects.map((subject) => [subject.id, subject.name]));
      const csvRows = [
        ['dataset', 'title', 'subject', 'completed', 'created_at', 'target_date', 'completed_date', 'color', 'duration_minutes', 'session_date']
      ];

      (tasksResponse.data || []).forEach((task) => {
        csvRows.push([
          'task',
          [task?.title, task?.text, task?.name, task?.description].find((value) => typeof value === 'string' && value.trim())?.trim() || 'Untitled task',
          subjectNameById.get(task.subject_id) || '',
          task.completed ? 'true' : 'false',
          task.created_at || '',
          task.target_date || '',
          task.completed_at || task.completed_day || '',
          '',
          '',
          ''
        ]);
      });

      subjects.forEach((subject) => {
        csvRows.push([
          'subject',
          subject.name || '',
          subject.name || '',
          '',
          subject.created_at || '',
          subject.exam_date || '',
          '',
          subject.color || '',
          '',
          ''
        ]);
      });

      (sessionsResponse.data || []).forEach((session) => {
        csvRows.push([
          'study_session',
          '',
          subjectNameById.get(session.subject_id) || '',
          '',
          session.created_at || '',
          '',
          '',
          '',
          Number.isFinite(Number(session.duration_minutes))
            ? `${session.duration_minutes}`
            : Number.isFinite(Number(session.duration_seconds))
              ? `${Math.round(Number(session.duration_seconds) / 60)}`
              : '',
          session.session_date || ''
        ]);
      });

      const csv = csvRows
        .map((row) => row.map((value) => `"${String(value || '').replaceAll('"', '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nexus-export-${localDateKey()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      pushToast('Export started.', 'success');
    } catch (error) {
      pushToast(error.message || 'Unable to export your data.', 'error');
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await onLogout();
      navigate('/login', { replace: true });
    } catch (error) {
      pushToast(error.message || 'Unable to log out right now.', 'error');
      setLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      return;
    }

    setDeleting(true);

    try {
      const [tasksResult, sessionsResult, subjectsResult] = await Promise.all([
        supabase.from('tasks').delete().eq('user_id', user.uid),
        supabase.from('study_sessions').delete().eq('user_id', user.uid),
        supabase.from('subjects').delete().eq('user_id', user.uid)
      ]);

      if (tasksResult.error) {
        throw tasksResult.error;
      }

      if (sessionsResult.error) {
        throw sessionsResult.error;
      }

      if (subjectsResult.error) {
        throw subjectsResult.error;
      }

      const { error: profileError } = await supabase.from('profiles').delete().eq('id', user.uid);

      if (profileError) {
        throw profileError;
      }

      clearLocalProfile(user.uid);
      await supabase.auth.signOut();
      navigate('/login?deleted=true', { replace: true });
    } catch (error) {
      pushToast(error.message || 'Unable to delete your account data.', 'error');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setDeleteConfirmText('');
    }
  };

  if (!user) {
    return (
      <section className="profile-page">
        <div className="profile-empty">
          <h1 className="profile-page-title">Sign in required</h1>
          <p className="profile-muted-copy">You need an active session to access this page.</p>
        </div>
        <style>{profileStyles}</style>
      </section>
    );
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <section className="profile-page">
      <header className="profile-header">
        <h1 className="profile-page-title">Profile</h1>
      </header>

      <div className="profile-layout">
        <article className="profile-card-surface">
          <div className="profile-identity-grid">
            <div className="profile-avatar-column">
              <div className="profile-avatar-display" style={{ background: profile.avatar_color }}>
                {initials}
              </div>
              <div className="profile-swatch-row" aria-label="Avatar colors">
                {AVATAR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    className={`profile-swatch${profile.avatar_color === swatch ? ' active' : ''}`}
                    style={{ background: swatch }}
                    onClick={() => {
                      void handleAvatarColorChange(swatch);
                    }}
                    aria-label={`Choose avatar color ${swatch}`}
                  />
                ))}
              </div>
            </div>

            <div className="profile-identity-content">
              {editingField === 'display_name' ? (
                <div className="profile-inline-edit">
                  <input
                    className="profile-inline-input profile-display-input"
                    type="text"
                    value={displayNameDraft}
                    onChange={(event) => setDisplayNameDraft(event.target.value)}
                    maxLength={60}
                    autoFocus
                  />
                  <div className="profile-inline-actions">
                    <button type="button" className="profile-primary-button" onClick={() => void handleDisplayNameSave()} disabled={savingField === 'display_name'}>
                      Save
                    </button>
                    <button
                      type="button"
                      className="profile-secondary-button"
                      onClick={() => {
                        setDisplayNameDraft(persistedProfile.display_name);
                        setEditingField('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="profile-title-row">
                  <h2 className="profile-display-name">{profile.display_name || 'User'}</h2>
                  <button
                    type="button"
                    className="profile-icon-button"
                    aria-label="Edit display name"
                    onClick={() => {
                      setDisplayNameDraft(profile.display_name);
                      setEditingField('display_name');
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                </div>
              )}

              <p className="profile-email-text">{email}</p>

              <div className="profile-bio-block">
                <div className="profile-field-label">Bio</div>
                {editingField === 'bio' ? (
                  <div className="profile-inline-edit">
                    <input
                      className="profile-inline-input"
                      type="text"
                      value={bioDraft}
                      onChange={(event) => setBioDraft(event.target.value.slice(0, 80))}
                      maxLength={80}
                      autoFocus
                    />
                    <div className="profile-inline-actions">
                      <button type="button" className="profile-primary-button" onClick={() => void handleBioSave()} disabled={savingField === 'bio'}>
                        Save
                      </button>
                      <button
                        type="button"
                        className="profile-secondary-button"
                        onClick={() => {
                          setBioDraft(persistedProfile.bio);
                          setEditingField('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="profile-bio-row">
                    <p className="profile-bio-text">{profile.bio || 'Add a short academic tagline.'}</p>
                    <button
                      type="button"
                      className="profile-icon-button"
                      aria-label="Edit bio"
                      onClick={() => {
                        setBioDraft(profile.bio);
                        setEditingField('bio');
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                  </div>
                )}
                <div className="profile-char-count">{(editingField === 'bio' ? bioDraft : profile.bio).length}/80</div>
              </div>

              <p className="profile-member-since">Member since {memberSince}</p>
            </div>
          </div>
        </article>

        <article className="profile-card-surface">
          <h2 className="profile-card-title">Academic Info</h2>
          <div className="profile-academic-stack">
            <label className="profile-field">
              <span className="profile-field-label">School / University name</span>
              <input
                className="profile-field-input"
                type="text"
                value={profile.school}
                onChange={(event) => setProfile((current) => ({ ...current, school: event.target.value }))}
                onBlur={() => {
                  void handleSchoolBlur();
                }}
              />
              <span className={`profile-save-state${inlineSaved.school ? ' visible' : ''}`}>Saved ✓</span>
            </label>

            <label className="profile-field">
              <span className="profile-field-label">Exam / Semester End Date</span>
              <input
                className="profile-field-input"
                type="date"
                value={profile.target_date}
                style={{ colorScheme: theme }}
                onChange={(event) => setProfile((current) => ({ ...current, target_date: event.target.value }))}
                onBlur={() => {
                  void handleTargetDateBlur();
                }}
              />
              <span className={`profile-save-state${inlineSaved.target_date ? ' visible' : ''}`}>Saved ✓</span>
              {countdownMeta && (
                <span className={`profile-countdown-badge tone-${countdownMeta.tone}`}>
                  {countdownMeta.text}
                </span>
              )}
            </label>
          </div>
        </article>

        <article className="profile-card-surface">
          <h2 className="profile-card-title">Preferences</h2>

          <div className="profile-preferences-stack">
            <div className="profile-preference-block">
              <div className="profile-field-label">Theme</div>
              <div className="profile-pill-toggle" role="tablist" aria-label="Theme preference">
                {THEME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`profile-pill-option${profile.theme === option.value ? ' active' : ''}`}
                    onClick={() => {
                      void handleThemeSelect(option.value);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="profile-preference-note">Current theme: {theme === 'dark' ? 'Dark' : 'Light'}</div>
            </div>

            <div className="profile-preference-block">
              <div className="profile-field-label">Accent Color</div>
              <div className="profile-accent-grid">
                {ACCENT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`profile-accent-option${profile.accent_color === option.value ? ' active' : ''}`}
                    onClick={() => {
                      void handleAccentSelect(option.value);
                    }}
                  >
                    <span className="profile-accent-chip" style={{ background: option.value }} />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="profile-preference-block">
              <label className="profile-field">
                <span className="profile-field-label">When I log in, take me to...</span>
                <select className="profile-field-input" style={{ colorScheme: theme }} value={profile.default_page} onChange={(event) => void handleDefaultPageChange(event)}>
                  {DEFAULT_PAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className={`profile-save-state${inlineSaved.default_page ? ' visible' : ''}`}>Saved ✓</span>
              </label>
            </div>
          </div>
        </article>

        <article className="profile-card-surface">
          <h2 className="profile-card-title">Account</h2>

          <div className="profile-bottom-stack">
            <section className="profile-export-section">
              <div>
                <div className="profile-field-label">Export Data</div>
                <p className="profile-muted-copy">Download a CSV snapshot of your tasks, subjects, and study sessions.</p>
              </div>
              <button type="button" className="profile-outline-button" onClick={() => void handleExport()}>
                Download My Data (CSV)
              </button>
            </section>

            <section className="profile-account-actions">
              <div>
                <div className="profile-field-label">Account Actions</div>
                <p className="profile-muted-copy">Manage your session or permanently remove your workspace data.</p>
              </div>
              <div className="profile-account-action-row">
                <button type="button" className="profile-outline-button" onClick={() => setLogoutModalOpen(true)}>
                  Logout
                </button>
                <button type="button" className="profile-danger-button" onClick={() => setDeleteModalOpen(true)}>
                  Delete Account
                </button>
              </div>
            </section>
          </div>
        </article>
      </div>

      <div className="profile-toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`profile-toast tone-${toast.tone}`}>
            {toast.message}
          </div>
        ))}
      </div>

      {deleteModalOpen && (
        <div className="profile-modal-backdrop" role="presentation" onClick={() => !deleting && setDeleteModalOpen(false)}>
          <div className="profile-modal-card" role="dialog" aria-modal="true" aria-labelledby="delete-account-title" onClick={(event) => event.stopPropagation()}>
            <div className="profile-modal-eyebrow">Delete Account</div>
            <h3 id="delete-account-title" className="profile-modal-title">Type DELETE to confirm</h3>
            <p className="profile-muted-copy">This removes your tasks, subjects, study sessions, and profile data from this workspace.</p>
            <input
              className="profile-field-input"
              type="text"
              value={deleteConfirmText}
              onChange={(event) => setDeleteConfirmText(event.target.value)}
              autoFocus
            />
            <div className="profile-modal-actions">
              <button type="button" className="profile-secondary-button" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="profile-danger-button" onClick={() => void handleDeleteAccount()} disabled={deleteConfirmText !== 'DELETE' || deleting}>
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {logoutModalOpen && (
        <div className="profile-modal-backdrop" role="presentation" onClick={() => !loggingOut && setLogoutModalOpen(false)}>
          <div className="profile-modal-card" role="dialog" aria-modal="true" aria-labelledby="logout-account-title" onClick={(event) => event.stopPropagation()}>
            <div className="profile-modal-eyebrow profile-modal-eyebrow-neutral">Logout</div>
            <h3 id="logout-account-title" className="profile-modal-title">Log out of your account?</h3>
            <p className="profile-muted-copy">You will be returned to the login screen and will need to sign in again to continue.</p>
            <div className="profile-modal-actions">
              <button type="button" className="profile-secondary-button" onClick={() => setLogoutModalOpen(false)} disabled={loggingOut}>
                Cancel
              </button>
              <button type="button" className="profile-primary-button" onClick={() => void handleLogout()} disabled={loggingOut}>
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{profileStyles}</style>
    </section>
  );
};

const profileStyles = `
  .profile-page {
    min-height: 100%;
    background: var(--bg);
    border-radius: var(--radius-lg);
    padding: 8px 0 28px;
    font-family: var(--font-body);
  }

  .profile-header {
    margin-bottom: 20px;
  }

  .profile-page-title {
    margin: 0;
    font-family: var(--font-heading);
    font-size: 32px;
    line-height: 1.05;
    font-weight: var(--font-weight-bold);
    color: var(--text);
    letter-spacing: -0.03em;
  }

  .profile-layout,
  .profile-loading-stack,
  .profile-academic-stack,
  .profile-preferences-stack,
  .profile-bottom-stack,
  .profile-identity-content,
  .profile-avatar-column,
  .profile-preference-block,
  .profile-bio-block,
  .profile-inline-edit,
  .profile-field {
    display: grid;
    gap: 18px;
  }

  .profile-card-surface,
  .profile-empty,
  .profile-modal-card,
  .profile-skeleton-card {
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
    padding: 24px;
    border: 1px solid var(--color-border);
  }

  .profile-card-title,
  .profile-modal-title {
    margin: 0;
    font-family: var(--font-heading);
    font-size: 20px;
    font-weight: var(--font-weight-bold);
    color: var(--text);
  }

  .profile-modal-eyebrow {
    font-family: var(--font-heading);
    font-size: var(--font-size-label);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--critical);
  }

  .profile-modal-eyebrow-neutral {
    color: var(--color-primary);
  }

  .profile-identity-grid {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }

  .profile-avatar-column {
    justify-items: center;
  }

  .profile-avatar-display {
    width: 116px;
    aspect-ratio: 1;
    border-radius: 999px;
    display: grid;
    place-items: center;
    color: var(--color-on-primary);
    font-size: 34px;
    font-weight: var(--font-weight-bold);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
  }

  .profile-swatch-row {
    display: grid;
    grid-template-columns: repeat(6, 18px);
    gap: 10px;
    justify-content: center;
  }

  .profile-swatch {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    border: 2px solid transparent;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-border) 68%, transparent);
    cursor: pointer;
  }

  .profile-swatch.active {
    transform: scale(1.1);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 32%, transparent);
  }

  .profile-title-row,
  .profile-bio-row,
  .profile-inline-actions,
  .profile-export-section,
  .profile-account-actions,
  .profile-account-action-row,
  .profile-modal-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .profile-display-name {
    margin: 0;
    font-family: var(--font-heading);
    font-size: 28px;
    line-height: 1.1;
    font-weight: var(--font-weight-bold);
    color: var(--text);
  }

  .profile-email-text,
  .profile-member-since,
  .profile-muted-copy,
  .profile-preference-note,
  .profile-bio-text,
  .profile-char-count {
    margin: 0;
    font-size: 14px;
    color: var(--text-muted);
  }

  .profile-field-label {
    display: block;
    font-family: var(--font-label);
    font-size: var(--text-label-caps-size);
    font-weight: var(--text-label-caps-weight);
    letter-spacing: var(--text-label-caps-tracking);
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .profile-icon-button,
  .profile-primary-button,
  .profile-secondary-button,
  .profile-outline-button,
  .profile-danger-button,
  .profile-pill-option,
  .profile-accent-option {
    min-height: 40px;
    border-radius: var(--radius-md);
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
  }

  .profile-icon-button {
    width: 40px;
    min-width: 40px;
    padding: 0;
    display: grid;
    place-items: center;
    border: 1px solid var(--color-border);
    background: var(--color-surface-high);
    color: var(--color-text-muted);
  }

  .profile-icon-button svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
    stroke-width: 1.9;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .profile-primary-button {
    padding: 0 16px;
    border: 1px solid var(--color-primary);
    background: var(--color-primary);
    color: var(--color-on-primary);
  }

  .profile-secondary-button,
  .profile-outline-button {
    padding: 0 16px;
    border: 1px solid var(--color-border);
    background: var(--color-surface-high);
    color: var(--color-text-muted);
  }

  .profile-danger-button {
    padding: 0 16px;
    border: 1px solid color-mix(in srgb, var(--critical) 45%, transparent);
    background: transparent;
    color: var(--critical);
  }

  .profile-account-actions {
    padding: 20px;
    border-radius: var(--radius-lg);
    border: 1px solid color-mix(in srgb, var(--color-error) 18%, transparent);
    background: color-mix(in srgb, var(--color-error) 6%, var(--color-surface));
  }

  .profile-export-section {
    padding: 20px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    background: var(--color-surface-high);
  }

  .profile-field-input,
  .profile-inline-input {
    width: 100%;
    min-height: 44px;
    border-radius: var(--radius-default);
    border: 1px solid var(--color-border);
    background: var(--color-surface-high);
    padding: 0 14px;
    font-size: 14px;
    color: var(--color-text);
    outline: none;
  }

  .profile-field-input::placeholder,
  .profile-inline-input::placeholder {
    color: var(--color-text-muted);
  }

  .profile-field-input::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: none;
  }

  .profile-field-input:focus,
  .profile-inline-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 1px var(--color-primary);
  }

  .profile-display-input {
    min-height: 50px;
    font-size: 24px;
    font-weight: 700;
  }

  .profile-save-state {
    min-height: 18px;
    opacity: 0;
    font-size: 13px;
    color: var(--color-primary-light);
    transition: opacity 180ms ease;
  }

  .profile-save-state.visible {
    opacity: 1;
  }

  .profile-countdown-badge {
    justify-self: start;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
  }

  .profile-countdown-badge.tone-amber {
    color: var(--color-primary-light);
    background: rgba(79, 70, 229, 0.1);
  }

  .profile-countdown-badge.tone-danger {
    color: var(--color-error);
    background: rgba(196, 90, 80, 0.1);
  }

  .profile-countdown-badge.tone-muted {
    color: var(--color-text-muted);
    background: color-mix(in srgb, var(--color-border) 16%, transparent);
  }

  .profile-pill-toggle {
    display: inline-grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    width: min(100%, 360px);
    padding: 6px;
    border-radius: var(--radius-lg);
    background: var(--color-surface-high);
    border: 1px solid var(--color-border);
  }

  .profile-pill-option {
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-muted);
  }

  .profile-pill-option.active {
    background: var(--color-surface-highest);
    border-color: var(--color-primary);
    color: var(--color-text);
    box-shadow: none;
  }

  .profile-accent-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
  }

  .profile-accent-option {
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    background: var(--color-surface-high);
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: flex-start;
  }

  .profile-accent-option.active {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 1px var(--color-primary);
  }

  .profile-accent-chip {
    width: 18px;
    aspect-ratio: 1;
    border-radius: 999px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.3);
    flex: 0 0 auto;
  }

  .profile-toast-stack {
    position: fixed;
    right: 22px;
    bottom: 22px;
    display: grid;
    gap: 10px;
    z-index: 80;
  }

  .profile-toast {
    min-width: 220px;
    max-width: min(360px, calc(100vw - 32px));
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--color-nav);
    color: var(--color-text-inverse);
    font-size: 14px;
    box-shadow: var(--shadow-card-hover);
  }

  .profile-toast.tone-success {
    background: #4d7c0f;
  }

  .profile-toast.tone-error {
    background: #b91c1c;
  }

  .profile-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.48);
    display: grid;
    place-items: center;
    padding: 20px;
    z-index: 90;
  }

  .profile-modal-card {
    width: min(100%, 460px);
    display: grid;
    gap: 16px;
  }

  .profile-skeleton-card {
    position: relative;
    overflow: hidden;
    min-height: 120px;
    border: none;
  }

  .profile-skeleton-card::after {
    content: '';
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent);
    animation: profilePulse 1.3s infinite;
  }

  .dark .profile-skeleton-card::after {
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  }

  .dark .profile-page {
    background: var(--bg);
  }

  .dark .profile-card-surface,
  .dark .profile-empty,
  .dark .profile-modal-card,
  .dark .profile-skeleton-card {
    background: color-mix(in srgb, var(--color-surface) 92%, #000000);
    border-color: color-mix(in srgb, var(--color-border) 88%, #000000);
  }

  .dark .profile-avatar-display {
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 12px 32px rgba(0, 0, 0, 0.25);
  }

  .dark .profile-icon-button,
  .dark .profile-secondary-button,
  .dark .profile-outline-button,
  .dark .profile-field-input,
  .dark .profile-inline-input,
  .dark .profile-pill-toggle,
  .dark .profile-accent-option,
  .dark .profile-export-section {
    background: color-mix(in srgb, var(--color-surface-high) 92%, #000000);
  }

  .dark .profile-pill-option.active {
    background: color-mix(in srgb, var(--color-surface-highest) 82%, #000000);
  }

  .dark .profile-account-actions {
    background: color-mix(in srgb, var(--color-error) 8%, var(--color-surface));
    border-color: color-mix(in srgb, var(--color-error) 28%, var(--color-border));
  }

  .dark .profile-countdown-badge.tone-amber {
    background: color-mix(in srgb, var(--color-primary) 20%, transparent);
    color: color-mix(in srgb, #ffffff 82%, var(--color-primary));
  }

  .dark .profile-countdown-badge.tone-danger {
    background: color-mix(in srgb, var(--color-error) 22%, transparent);
    color: color-mix(in srgb, #ffffff 84%, var(--color-error));
  }

  .dark .profile-countdown-badge.tone-muted {
    background: color-mix(in srgb, var(--color-border) 32%, transparent);
  }

  .dark .profile-accent-chip {
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
  }

  .dark .profile-toast {
    background: color-mix(in srgb, var(--color-nav) 84%, #000000);
  }

  .dark .profile-toast.tone-success {
    background: #3f6212;
  }

  .dark .profile-toast.tone-error {
    background: #991b1b;
  }

  .dark .profile-modal-backdrop {
    background: rgba(2, 6, 23, 0.72);
    backdrop-filter: blur(8px);
  }

  .dark .profile-field-input::-webkit-calendar-picker-indicator {
    filter: invert(1) brightness(0.9);
  }

  .profile-skeleton-identity {
    min-height: 260px;
  }

  .profile-skeleton-academic,
  .profile-skeleton-preferences {
    min-height: 220px;
  }

  .profile-skeleton-account {
    min-height: 210px;
  }

  @keyframes profilePulse {
    100% {
      transform: translateX(100%);
    }
  }

  @media (max-width: 767px) {
    .profile-page {
      padding-bottom: 96px;
    }

    .profile-identity-grid {
      grid-template-columns: 1fr;
    }

    .profile-identity-content,
    .profile-avatar-column {
      text-align: center;
    }

    .profile-title-row,
    .profile-bio-row,
    .profile-export-section,
    .profile-account-actions,
    .profile-account-action-row,
    .profile-modal-actions,
    .profile-inline-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .profile-icon-button {
      align-self: center;
    }

    .profile-toast-stack {
      left: 16px;
      right: 16px;
      bottom: 88px;
    }
  }
`;

export default Profile;
