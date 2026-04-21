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
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import { Demand, DemandStatus, Sprint, User } from '@/types';

const toDate = (val: unknown): Date =>
  val && typeof (val as { toDate?: () => Date }).toDate === 'function'
    ? (val as { toDate: () => Date }).toDate()
    : new Date();

const toDateOrNull = (val: unknown): Date | null =>
  val && typeof (val as { toDate?: () => Date }).toDate === 'function'
    ? (val as { toDate: () => Date }).toDate()
    : null;

// DEMANDS

export const getDemands = async (filters?: {
  status?: DemandStatus;
  assigneeId?: string;
  sprintId?: string | null;
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
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    startDate: toDateOrNull(d.data().startDate),
    deadline: toDateOrNull(d.data().deadline),
    createdAt: toDate(d.data().createdAt),
    updatedAt: toDate(d.data().updatedAt),
  })) as Demand[];
};

export const getDemandById = async (id: string): Promise<Demand | null> => {
  const snap = await getDoc(doc(db, 'demands', id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    ...d,
    startDate: toDateOrNull(d.startDate),
    deadline: toDateOrNull(d.deadline),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  } as Demand;
};

export const createDemand = async (
  data: Omit<Demand, 'id' | 'code' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const counterRef = doc(db, 'meta', 'counters');

  const newId = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    const current = counterSnap.exists()
      ? (counterSnap.data().demandCount as number)
      : 0;
    const next = current + 1;
    transaction.set(counterRef, { demandCount: next }, { merge: true });

    const demandRef = doc(collection(db, 'demands'));
    transaction.set(demandRef, {
      ...data,
      code: `EJ-${String(next).padStart(3, '0')}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return demandRef.id;
  });

  return newId;
};

export const updateDemand = async (
  id: string,
  data: Partial<Omit<Demand, 'id' | 'code' | 'createdAt'>>
) => {
  await updateDoc(doc(db, 'demands', id), {
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
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    startDate: toDate(d.data().startDate),
    endDate: toDate(d.data().endDate),
    createdAt: toDate(d.data().createdAt),
    updatedAt: toDate(d.data().updatedAt),
  })) as Sprint[];
};

export const getSprintById = async (id: string): Promise<Sprint | null> => {
  const snap = await getDoc(doc(db, 'sprints', id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    ...d,
    startDate: toDate(d.startDate),
    endDate: toDate(d.endDate),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  } as Sprint;
};

export const createSprint = async (
  data: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  if (data.status === 'active') {
    const existing = await getDocs(
      query(collection(db, 'sprints'), where('status', '==', 'active'))
    );
    if (!existing.empty) {
      throw new Error(
        'Já existe uma sprint ativa. Encerre-a antes de ativar outra.'
      );
    }
  }

  const docRef = await addDoc(collection(db, 'sprints'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateSprint = async (
  id: string,
  data: Partial<Omit<Sprint, 'id' | 'createdAt'>>
) => {
  if (data.status === 'active') {
    const existing = await getDocs(
      query(collection(db, 'sprints'), where('status', '==', 'active'))
    );
    const conflict = existing.docs.find((d) => d.id !== id);
    if (conflict) {
      throw new Error(
        'Já existe uma sprint ativa. Encerre-a antes de ativar outra.'
      );
    }
  }

  await updateDoc(doc(db, 'sprints', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// USERS

export const getUsers = async (onlyActive = true): Promise<User[]> => {
  const q = onlyActive
    ? query(collection(db, 'users'), where('status', '==', 'ativo'))
    : query(collection(db, 'users'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    uid: d.id,
    ...d.data(),
    createdAt: toDate(d.data().createdAt),
    updatedAt: toDate(d.data().updatedAt),
  })) as User[];
};

export const getUserById = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    uid: snap.id,
    ...d,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  } as User;
};

export const updateUser = async (uid: string, data: Partial<User>) => {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};