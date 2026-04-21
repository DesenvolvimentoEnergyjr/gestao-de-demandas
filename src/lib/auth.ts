import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '@/types';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const signOut = async () => {
  await firebaseSignOut(auth);
};

export const onAuthChange = (
  callback: (user: FirebaseUser | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};

export const getUserDoc = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...data,
    uid: snap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  } as User;
};

export const createUserDoc = async (
  firebaseUser: FirebaseUser
): Promise<User> => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const now = serverTimestamp();

  const newUser = {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName ?? 'Usuário',
    email: firebaseUser.email ?? '',
    photoURL: firebaseUser.photoURL ?? '',
    role: 'assessor' as const,
    status: 'ativo' as const,
    area: 'Geral',
    title: 'Assessor',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(userRef, newUser);

  return {
    ...newUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;
};