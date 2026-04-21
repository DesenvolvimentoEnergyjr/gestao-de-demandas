import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Demand, DemandStatus, Sprint, User } from '@/types';

// DEMANDS
export const getDemands = async (filters?: {
  status?: DemandStatus;
  assigneeId?: string;
  sprintId?: string | null
}): Promise<Demand[]> => {
  let q = query(collection(db, 'demands'), orderBy('createdAt', 'desc'));

  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }
  if (filters?.assigneeId) {
    q = query(q, where('assignees', 'array-contains', filters.assigneeId));
  }
  if (filters?.sprintId !== undefined) {
    q = query(q, where('sprintId', '==', filters.sprintId));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    startDate: doc.data().startDate?.toDate() || null,
    deadline: doc.data().deadline?.toDate() || null,
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as Demand[];
};

export const getDemandById = async (id: string): Promise<Demand | null> => {
  const docRef = doc(db, 'demands', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
      startDate: docSnap.data().startDate?.toDate() || null,
      deadline: docSnap.data().deadline?.toDate() || null,
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
    } as Demand;
  }
  return null;
};

export const createDemand = async (data: Partial<Demand>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'demands'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateDemand = async (id: string, data: Partial<Demand>) => {
  const docRef = doc(db, 'demands', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteDemand = async (id: string) => {
  await deleteDoc(doc(db, 'demands', id));
};

// SPRINTS
export const getSprints = async (): Promise<Sprint[]> => {
  const q = query(collection(db, 'sprints'), orderBy('startDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    startDate: doc.data().startDate?.toDate() || new Date(),
    endDate: doc.data().endDate?.toDate() || new Date(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Sprint[];
};

export const getSprintById = async (id: string): Promise<Sprint | null> => {
  const docSnap = await getDoc(doc(db, 'sprints', id));
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
      startDate: docSnap.data().startDate?.toDate() || new Date(),
      endDate: docSnap.data().endDate?.toDate() || new Date(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
    } as Sprint;
  }
  return null;
};

export const createSprint = async (data: Partial<Sprint>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'sprints'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateSprint = async (id: string, data: Partial<Sprint>) => {
  await updateDoc(doc(db, 'sprints', id), data);
};

// USERS
export const getUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(doc => ({
    uid: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as User[];
};

export const getUserById = async (uid: string): Promise<User | null> => {
  const docSnap = await getDoc(doc(db, 'users', uid));
  if (docSnap.exists()) {
    return {
      uid: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
    } as User;
  }
  return null;
};

export const updateUser = async (uid: string, data: Partial<User>) => {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, data);
};

// SEED MOCK DATA - REMOVED FOR PRODUCTION READY STATE
export const seedMockData = async () => {
  console.log("Mock seeding is disabled for production integration.");
};
