import { useState } from 'react';
import { supabase } from '@config/supabase';
import { useTheme } from '@context/ThemeContext';

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

const Profile = ({ user, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  if (!user) {
    return (
      <section className="profile-view profile-view-empty">
        <div className="profile-panel anim-enter">
          <p className="page-kicker">Profile</p>
          <h1 className="profile-title">Sign in required</h1>
          <p className="profile-copy">You need an active session to access this page.</p>
        </div>
      </section>
    );
  }

  const handleDeleteAccount = async () => {
    setError('');
    setDeleting(true);

    try {
      const confirmed = window.confirm(
        'Delete your account data and sign out? In this browser-only setup, your auth user still remains in Supabase Auth until a server-side delete is added.'
      );

      if (!confirmed) {
        setDeleting(false);
        return;
      }

      const { error: tasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', user.uid);

      if (tasksError) {
        throw tasksError;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.uid);

      if (profileError) {
        throw profileError;
      }

      await onLogout();
    } catch (err) {
      setError(err.message || 'Unable to delete account data right now.');
      setDeleting(false);
    }
  };

  return (
    <section className="profile-view page">
      <div className="profile-panel anim-enter">
        <p className="page-kicker">Profile</p>
        <h1 className="profile-title">Account</h1>
        <p className="profile-copy">
          Keep identity, appearance, and session controls in one clear system panel.
        </p>

        <div className="profile-identity">
          <div className="profile-identity-avatar">{buildInitials(user.name, user.email)}</div>
          <div className="profile-identity-copy">
            <div className="profile-identity-name">{user.name || 'User'}</div>
            <div className="profile-identity-email">{user.email || 'Signed in'}</div>
          </div>
        </div>

        <div className="profile-actions">
          <button type="button" className="profile-theme-button" onClick={toggleTheme}>
            Theme: {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
          <button type="button" className="profile-logout-button" onClick={onLogout}>
            Logout
          </button>
          <button
            type="button"
            className="profile-delete-button"
            onClick={() => {
              void handleDeleteAccount();
            }}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>

        <p className="profile-copy">
          Delete account removes your profile and tasks, then signs you out.
        </p>
        <p className="profile-footnote">
          Full Supabase Auth user deletion still requires a server-side action.
        </p>

        {error && <p className="section-note section-note-danger">{error}</p>}
      </div>
    </section>
  );
};

export default Profile;
