import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createMemberTimelineEvent } from './firestore';
import { auth, db } from './firebase';
import { User } from '@/types';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const email = result.user.email || '';

  // Restricted domains check
  const allowedDomain = process.env.NEXT_PUBLIC_COMPANY_DOMAIN;
  const isAllowedDomain = allowedDomain ? email.endsWith(allowedDomain) : false;

  if (!isAllowedDomain) {
    await firebaseSignOut(auth);
    throw new Error('access-denied');
  }

  return result.user;
};

/**
 * Sets the session cookie via the API route.
 * Should be called after successful Firebase authentication.
 */
export const setSessionCookie = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const idToken = await currentUser.getIdToken();
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
};

/**
 * Clears the session cookie via the API route.
 */
export const clearSessionCookie = async () => {
  await fetch('/api/auth/session', { method: 'DELETE' });
};

export const signOut = async () => {
  await clearSessionCookie();
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

  // Create user timeline event on user creation
  try {
    await createMemberTimelineEvent({
      userId: firebaseUser.uid,
      date: new Date(),
      type: 'ingresso',
      title: `Ingresso na ${process.env.NEXT_PUBLIC_COMPANY_NAME}`,
      description: `Início da jornada na diretoria de ${newUser.area}.`,
    });
  } catch (e) {
    console.error('Erro ao criar evento de ingresso na timeline:', e);
  }

  return {
    ...newUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;
};