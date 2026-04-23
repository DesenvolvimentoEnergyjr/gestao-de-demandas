import { create } from 'zustand';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppNotification } from '@/types';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  subscribe: (userId: string) => () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: true,

  subscribe: (userId: string) => {
    // Set a 28-day limit for initial search
    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('createdAt', '>=', Timestamp.fromDate(twentyEightDaysAgo)),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
      })) as AppNotification[];

      const unreadCount = notifications.filter((n) => !n.read).length;

      set({ notifications, unreadCount, loading: false });
    });

    return unsubscribe;
  },
}));
