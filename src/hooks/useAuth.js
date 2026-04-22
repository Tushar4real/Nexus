import { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, isConfigured, missingConfigKeys, firebaseInitError } from '@config/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isConfigured) {
      setError(`Firebase is not configured. Missing: ${missingConfigKeys.join(', ')}`);
      setLoading(false);
      return;
    }

    if (firebaseInitError || !auth || !db) {
      setError(firebaseInitError?.message || 'Firebase failed to initialize.');
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            const profileData = userDoc.exists() ? userDoc.data() : {};
            setUser({
              ...firebaseUser,
              ...profileData,
              name: profileData.name || firebaseUser.displayName || 'User',
              email: profileData.email || firebaseUser.email || '',
              avatar: profileData.avatar || (firebaseUser.displayName || 'User')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
            });
            setError(null);
          } else {
            setUser(null);
            setError(null);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setUser({
            ...firebaseUser,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            avatar: (firebaseUser.displayName || 'User')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
          });
        }
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const signup = async (email, password, name) => {
    if (!isConfigured || !auth || !db) {
      throw new Error('Firebase is not configured');
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    await setDoc(doc(db, 'users', result.user.uid), {
      name,
      email,
      avatar: initials,
      score: 0,
      streak: 0,
      completed: 0,
      hardTasks: 0,
      posts: 0,
      createdAt: new Date().toISOString()
    });
    
    return result.user;
  };

  const login = async (email, password) => {
    if (!isConfigured || !auth) {
      throw new Error('Firebase is not configured');
    }
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (!isConfigured || !auth) {
      throw new Error('Firebase is not configured');
    }
    return await signOut(auth);
  };

  return { user, loading, signup, login, logout, error };
};
