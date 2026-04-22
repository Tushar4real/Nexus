import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@config/firebase';

export const useFirestore = (collectionName, userId, queryConstraints = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !db) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, collectionName),
      where('userId', '==', userId),
      ...queryConstraints
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setData(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(`Error loading ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionName, userId, queryConstraints]);

  const add = async (item) => {
    return await addDoc(collection(db, collectionName), {
      ...item,
      userId,
      createdAt: serverTimestamp()
    });
  };

  const update = async (id, updates) => {
    return await updateDoc(doc(db, collectionName, id), updates);
  };

  const remove = async (id) => {
    return await deleteDoc(doc(db, collectionName, id));
  };

  return { data, loading, error, add, update, remove };
};
