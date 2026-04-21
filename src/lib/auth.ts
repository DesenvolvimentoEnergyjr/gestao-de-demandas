import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, Role } from '@/types';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getUserDoc = async (uid: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    return {
      ...data,
      uid: userDoc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as User;
  }
  return null;
};

export const createUserDoc = async (firebaseUser: FirebaseUser): Promise<User> => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const newUser: Partial<User> = {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || 'Usuário',
    email: firebaseUser.email || '',
    photoURL: firebaseUser.photoURL || '',
    role: 'assessor' as Role, // Default role
    area: 'Geral',
    title: 'Assessor',
    createdAt: new Date(),
  };

  await setDoc(userRef, {
    ...newUser,
    createdAt: serverTimestamp(),
  });

  return newUser as User;
};
