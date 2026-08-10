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
  onSnapshot,
  arrayUnion,
  writeBatch,
} from "firebase/firestore";

import { tenantConfig } from "@/config/tenant";
import { db } from "./firebase";
import {
  Demand,
  DemandStatus,
  Sprint,
  User,
  AppNotification,
  MemberTimelineEvent,
  InstitutionalAccount,
} from "@/types";

const toDate = (val: unknown): Date =>
  val && typeof (val as { toDate?: () => Date }).toDate === "function"
    ? (val as { toDate: () => Date }).toDate()
    : new Date();

const toDateOrNull = (val: unknown): Date | null =>
  val && typeof (val as { toDate?: () => Date }).toDate === "function"
    ? (val as { toDate: () => Date }).toDate()
    : null;

// Real-time listeners
export const subscribeToDemands = (
  callback: (demands: Demand[]) => void,
  filters?: {
    status?: DemandStatus;
    assigneeId?: string;
    sprintId?: string | null;
  },
) => {
  let q = query(collection(db, "demands"), orderBy("createdAt", "desc"));

  if (filters?.status) {
    q = query(q, where("status", "==", filters.status));
  }
  if (filters?.assigneeId) {
    q = query(q, where("assignees", "array-contains", filters.assigneeId));
  }
  if (filters?.sprintId !== undefined) {
    q = query(q, where("sprintId", "==", filters.sprintId));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const demands = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        startDate: toDateOrNull(d.data().startDate),
        deadline: toDateOrNull(d.data().deadline),
        createdAt: toDate(d.data().createdAt),
        updatedAt: toDate(d.data().updatedAt),
        completedAt: toDateOrNull(d.data().completedAt),
        attachments:
          d.data().attachments?.map((a: { addedAt: unknown }) => ({
            ...a,
            addedAt: toDate(a.addedAt),
          })) || [],
      })) as Demand[];
      callback(demands);
    },
    (error) => {
      console.error("Error subscribing to demands:", error);
    },
  );
};

export const subscribeToSprints = (callback: (sprints: Sprint[]) => void) => {
  const q = query(collection(db, "sprints"), orderBy("startDate", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const sprints = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        startDate: toDate(d.data().startDate),
        endDate: toDate(d.data().endDate),
        createdAt: toDate(d.data().createdAt),
        updatedAt: toDate(d.data().updatedAt),
      })) as Sprint[];
      callback(sprints);
    },
    (error) => {
      console.error("Error subscribing to sprints:", error);
    },
  );
};

// Notifications
export const createNotification = async (
  data: Omit<AppNotification, "id" | "createdAt" | "read">,
) => {
  await addDoc(collection(db, "notifications"), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
};

export const markNotificationAsRead = async (id: string) => {
  await updateDoc(doc(db, "notifications", id), {
    read: true,
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("read", "==", false),
  );
  const snapshot = await getDocs(q);
  const batch = snapshot.docs.map((d) =>
    updateDoc(doc(db, "notifications", d.id), { read: true }),
  );
  await Promise.all(batch);
};

// Demands
export const getDemands = async (filters?: {
  status?: DemandStatus;
  assigneeId?: string;
  sprintId?: string | null;
}): Promise<Demand[]> => {
  let q = query(collection(db, "demands"), orderBy("createdAt", "desc"));

  if (filters?.status) {
    q = query(q, where("status", "==", filters.status));
  }
  if (filters?.assigneeId) {
    q = query(q, where("assignees", "array-contains", filters.assigneeId));
  }
  if (filters?.sprintId !== undefined) {
    q = query(q, where("sprintId", "==", filters.sprintId));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    startDate: toDateOrNull(d.data().startDate),
    deadline: toDateOrNull(d.data().deadline),
    createdAt: toDate(d.data().createdAt),
    updatedAt: toDate(d.data().updatedAt),
    completedAt: toDateOrNull(d.data().completedAt),
    attachments:
      d.data().attachments?.map((a: { addedAt: unknown }) => ({
        ...a,
        addedAt: toDate(a.addedAt),
      })) || [],
  })) as Demand[];
};

export const getDemandById = async (id: string): Promise<Demand | null> => {
  const snap = await getDoc(doc(db, "demands", id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    ...d,
    startDate: toDateOrNull(d.startDate),
    deadline: toDateOrNull(d.deadline),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
    completedAt: toDateOrNull(d.completedAt),
    attachments:
      d.attachments?.map((a: { addedAt: unknown }) => ({
        ...a,
        addedAt: toDate(a.addedAt),
      })) || [],
  } as Demand;
};

export const createDemand = async (
  data: Omit<Demand, "id" | "code" | "createdAt" | "updatedAt"> & {
    createdAt?: Date;
  },
  actorName?: string,
): Promise<string> => {
  const counterRef = doc(db, "meta", "counters");

  const newId = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    const current = counterSnap.exists()
      ? (counterSnap.data().demandCount as number)
      : 0;
    const next = current + 1;
    const prefix = process.env.NEXT_PUBLIC_DEMAND_PREFIX;
    const code = `${prefix}${String(next).padStart(3, "0")}`;

    transaction.set(counterRef, { demandCount: next }, { merge: true });

    const demandRef = doc(collection(db, "demands"));
    transaction.set(demandRef, {
      ...data,
      code,
      createdAt: data.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: demandRef.id, code };
  });

  // Notify assignees
  if (data.assignees && data.assignees.length > 0) {
    await Promise.all(
      data.assignees.map((userId) =>
        createNotification({
          userId,
          title: "Nova demanda designada",
          message: `Você foi designado para a demanda "${data.title}"`,
          type: "assignment",
          link: `/kanban?demandId=${newId.id}`,
          ...(actorName && { actorName }),
        }),
      ),
    );
  }

  return newId.id;
};

export const updateDemand = async (
  id: string,
  data: Partial<Omit<Demand, "id" | "code" | "updatedAt">>,
  actorName?: string,
) => {
  const demandDoc = doc(db, "demands", id);
  const oldSnap = await getDoc(demandDoc);
  let completedAtUpdate: Record<string, unknown> = {};

  if (oldSnap.exists()) {
    const oldData = oldSnap.data() as Demand;

    if (data.status === "concluido" && oldData.status !== "concluido") {
      completedAtUpdate = { completedAt: serverTimestamp() };
    } else if (
      data.status &&
      data.status !== "concluido" &&
      oldData.status === "concluido"
    ) {
      completedAtUpdate = { completedAt: null };
    }

    // If updating assignees, notify only the new ones
    if (data.assignees) {
      const newAssignees = data.assignees.filter(
        (uid) => !oldData.assignees?.includes(uid),
      );

      if (newAssignees.length > 0) {
        await Promise.all(
          newAssignees.map((userId) =>
            createNotification({
              userId,
              title: "Nova designação",
              message: `Você foi designado para a demanda "${data.title || oldData.title}"`,
              type: "assignment",
              link: `/kanban?demandId=${id}`,
              ...(actorName && { actorName }),
            }),
          ),
        );
      }
    }

    // If demand is completed, notify the creator and register it in the assignee's timeline
    if (data.status === "concluido" && oldData.status !== "concluido") {
      if (oldData.createdBy) {
        await createNotification({
          userId: oldData.createdBy,
          title: "Demanda Concluída",
          message: `Excelente! A demanda "${oldData.title}" que você criou foi concluída!`,
          type: "system",
          link: `/kanban?demandId=${id}`,
          ...(actorName && { actorName }),
        });
      }

      // Register automatic event in each assignee's timeline
      const assignees = data.assignees || oldData.assignees || [];
      await Promise.all(
        assignees.map((userId: string) =>
          createMemberTimelineEvent({
            userId,
            date: new Date(),
            type: "demanda",
            title: "Demanda Concluída",
            description: oldData.title || data.title || "",
          }).catch((e: unknown) =>
            console.error("Erro ao criar evento de demanda na timeline:", e),
          ),
        ),
      );
    }
    // Notify change of status
    else if (data.status && data.status !== oldData.status) {
      if (oldData.createdBy) {
        const configStatus = tenantConfig.demandStatuses.find(
          (s) => s.id === data.status,
        );
        const newStatusStr = configStatus?.label || data.status;

        await createNotification({
          userId: oldData.createdBy,
          title: "Atualização de Status",
          message: `A demanda "${oldData.title}" foi movida para ${newStatusStr}.`,
          type: "system",
          link: `/kanban?demandId=${id}`,
          ...(actorName && { actorName }),
        });
      }
    }
  }

  await updateDoc(demandDoc, {
    ...data,
    ...completedAtUpdate,
    updatedAt: serverTimestamp(),
  });
};

export const deleteDemand = async (id: string) => {
  await deleteDoc(doc(db, "demands", id));
};

export const addCommentToDemand = async (
  demandId: string,
  text: string,
  authorId: string,
  mentionedUsers: string[],
  demandTitle: string,
  authorName?: string,
) => {
  const commentId = doc(collection(db, "demands")).id; // Generate random ID

  await updateDoc(doc(db, "demands", demandId), {
    comments: arrayUnion({
      id: commentId,
      authorId,
      text,
      createdAt: new Date(), // using local date instead of serverTimestamp to avoid complex client-side typings, firestore will convert it.
    }),
    updatedAt: serverTimestamp(),
  });

  // Notify mentioned users
  if (mentionedUsers.length > 0) {
    await Promise.all(
      mentionedUsers.map((userId) =>
        createNotification({
          userId,
          title: "Você foi mencionado",
          message: `Você foi mencionado em um comentário na demanda "${demandTitle}"`,
          type: "mention",
          link: `/kanban?demandId=${demandId}`,
          ...(authorName && { actorName: authorName }),
        }),
      ),
    );
  }
};

export const deleteCommentFromDemand = async (
  demandId: string,
  commentId: string,
) => {
  const demandRef = doc(db, "demands", demandId);
  const snap = await getDoc(demandRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const comments = data.comments || [];
  const newComments = comments.filter(
    (c: { id: string }) => c.id !== commentId,
  );
  await updateDoc(demandRef, { comments: newComments });
};

// Sprints
export const getSprints = async (): Promise<Sprint[]> => {
  const q = query(collection(db, "sprints"), orderBy("startDate", "desc"));
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
  const snap = await getDoc(doc(db, "sprints", id));
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
  data: Omit<Sprint, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  if (data.status === "active") {
    const existing = await getDocs(
      query(collection(db, "sprints"), where("status", "==", "active")),
    );
    if (!existing.empty) {
      throw new Error(
        "Já existe uma sprint ativa. Encerre-a antes de ativar outra.",
      );
    }
  }

  const docRef = await addDoc(collection(db, "sprints"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateSprint = async (
  id: string,
  data: Partial<Omit<Sprint, "id" | "createdAt">>,
) => {
  if (data.status === "active") {
    const existing = await getDocs(
      query(collection(db, "sprints"), where("status", "==", "active")),
    );
    const conflict = existing.docs.find((d) => d.id !== id);
    if (conflict) {
      throw new Error(
        "Já existe uma sprint ativa. Encerre-a antes de ativar outra.",
      );
    }
  }

  await updateDoc(doc(db, "sprints", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const pauseSprint = async (sprintId: string) => {
  const sprintRef = doc(db, "sprints", sprintId);
  const sprintSnap = await getDoc(sprintRef);

  if (!sprintSnap.exists()) return;

  const now = new Date();

  await updateDoc(sprintRef, {
    status: "paused",
    pausedAt: now,
    pauseHistory: arrayUnion({ pausedAt: now }),
    updatedAt: serverTimestamp(),
  });
};

export const resumeSprint = async (sprintId: string) => {
  const sprintRef = doc(db, "sprints", sprintId);
  const sprintSnap = await getDoc(sprintRef);

  if (!sprintSnap.exists()) return;
  const sprintData = sprintSnap.data() as Sprint;

  if (!sprintData.pausedAt) return;

  const pausedAtDate =
    sprintData.pausedAt instanceof Date
      ? sprintData.pausedAt
      : (sprintData.pausedAt as unknown as { toDate: () => Date }).toDate();

  const now = new Date();

  // Calculate difference in milliseconds, then convert to whole days
  const msDiff = now.getTime() - pausedAtDate.getTime();
  const daysDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

  const currentTotalPausedDays = sprintData.totalPausedDays || 0;

  // Update sprint document
  const sprintUpdates: Record<string, unknown> = {
    status: "active",
    pausedAt: null,
    totalPausedDays: currentTotalPausedDays + daysDiff,
    updatedAt: serverTimestamp(),
  };

  // Extend endDate
  if (sprintData.endDate) {
    const endDate =
      sprintData.endDate instanceof Date
        ? sprintData.endDate
        : (sprintData.endDate as unknown as { toDate: () => Date }).toDate();

    const newEndDate = new Date(endDate);
    newEndDate.setDate(newEndDate.getDate() + daysDiff);
    sprintUpdates.endDate = newEndDate;
  }

  // Close pauseHistory array
  if (sprintData.pauseHistory && sprintData.pauseHistory.length > 0) {
    const history = [...sprintData.pauseHistory];
    history[history.length - 1].resumedAt = now;
    sprintUpdates.pauseHistory = history;
  }

  // Batch update demands
  const batch = writeBatch(db);
  batch.update(sprintRef, sprintUpdates);

  const demandsQuery = query(
    collection(db, "demands"),
    where("sprintId", "==", sprintId),
  );
  const demandsSnap = await getDocs(demandsQuery);

  demandsSnap.docs.forEach((demandDoc) => {
    const demand = demandDoc.data() as Demand;
    // Only update non-completed demands
    if (demand.status !== "concluido") {
      const updates: Record<string, unknown> = {};

      if (demand.deadline) {
        const dDate =
          demand.deadline instanceof Date
            ? demand.deadline
            : (demand.deadline as unknown as { toDate: () => Date }).toDate();
        const newDeadline = new Date(dDate);
        newDeadline.setDate(newDeadline.getDate() + daysDiff);
        updates.deadline = newDeadline;
      }

      if (demand.startDate) {
        const sDate =
          demand.startDate instanceof Date
            ? demand.startDate
            : (demand.startDate as unknown as { toDate: () => Date }).toDate();

        // Only extend start date if it was after the pause started
        if (sDate > pausedAtDate) {
          const newStart = new Date(sDate);
          newStart.setDate(newStart.getDate() + daysDiff);
          updates.startDate = newStart;
        }
      }

      if (Object.keys(updates).length > 0) {
        batch.update(demandDoc.ref, updates);
      }
    }
  });

  await batch.commit();
};

export const deleteSprint = async (id: string) => {
  await deleteDoc(doc(db, "sprints", id));
};

// Users
export const subscribeToUsers = (
  callback: (users: User[]) => void,
  onlyActive = true,
) => {
  const q = onlyActive
    ? query(collection(db, "users"), where("status", "==", "ativo"))
    : query(collection(db, "users"));

  return onSnapshot(
    q,
    (snapshot) => {
      const users = snapshot.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
        createdAt: toDate(d.data().createdAt),
        updatedAt: toDate(d.data().updatedAt),
        deactivatedAt: toDateOrNull(d.data().deactivatedAt),
        joinDate: toDateOrNull(d.data().joinDate),
      })) as User[];
      callback(users);
    },
    (error) => {
      console.error("Error subscribing to users:", error);
    },
  );
};

export const getUsers = async (onlyActive = true): Promise<User[]> => {
  const q = onlyActive
    ? query(collection(db, "users"), where("status", "==", "ativo"))
    : query(collection(db, "users"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    uid: d.id,
    ...d.data(),
    createdAt: toDate(d.data().createdAt),
    updatedAt: toDate(d.data().updatedAt),
    deactivatedAt: toDateOrNull(d.data().deactivatedAt),
    joinDate: toDateOrNull(d.data().joinDate),
  })) as User[];
};

export const getUserById = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    uid: snap.id,
    ...d,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
    deactivatedAt: toDateOrNull(d.deactivatedAt),
    joinDate: toDateOrNull(d.joinDate),
  } as User;
};

export const updateUser = async (uid: string, data: Partial<User>) => {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

const institutionalAccountFromDoc = (
  id: string,
  d: Record<string, unknown>,
): InstitutionalAccount => ({
  id,
  email: d.email as string,
  label: d.label as string,
  assignedUserId: (d.assignedUserId as string) ?? null,
  createdAt: toDate(d.createdAt),
  updatedAt: toDate(d.updatedAt),
});

export const getInstitutionalAccounts = async (): Promise<
  InstitutionalAccount[]
> => {
  const snapshot = await getDocs(collection(db, "institutionalAccounts"));
  return snapshot.docs.map((d) => institutionalAccountFromDoc(d.id, d.data()));
};

export const getInstitutionalAccountByEmail = async (
  email: string,
): Promise<InstitutionalAccount | null> => {
  const q = query(
    collection(db, "institutionalAccounts"),
    where("email", "==", email.toLowerCase()),
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return institutionalAccountFromDoc(docSnap.id, docSnap.data());
};

export const createInstitutionalAccount = async (data: {
  email: string;
  label: string;
  assignedUserId: string | null;
}): Promise<string> => {
  const docRef = await addDoc(collection(db, "institutionalAccounts"), {
    ...data,
    email: data.email.toLowerCase(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateInstitutionalAccount = async (
  id: string,
  data: Partial<Omit<InstitutionalAccount, "id" | "createdAt" | "updatedAt">>,
) => {
  await updateDoc(doc(db, "institutionalAccounts", id), {
    ...data,
    ...(data.email && { email: data.email.toLowerCase() }),
    updatedAt: serverTimestamp(),
  });
};

export const deleteInstitutionalAccount = async (id: string) => {
  await deleteDoc(doc(db, "institutionalAccounts", id));
};

// Member Timeline
export const subscribeToMemberTimeline = (
  userId: string,
  callback: (events: MemberTimelineEvent[]) => void,
) => {
  const q = query(
    collection(db, "member_timeline"),
    where("userId", "==", userId),
    orderBy("date", "desc"),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const events = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        date: toDate(d.data().date),
        createdAt: toDate(d.data().createdAt),
        updatedAt: toDate(d.data().updatedAt),
      })) as MemberTimelineEvent[];
      callback(events);
    },
    (error) => {
      console.error("Error subscribing to member timeline:", error);
    },
  );
};

export const createMemberTimelineEvent = async (
  data: Omit<MemberTimelineEvent, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const docRef = await addDoc(collection(db, "member_timeline"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateMemberTimelineEvent = async (
  id: string,
  data: Partial<Omit<MemberTimelineEvent, "id" | "createdAt">>,
) => {
  await updateDoc(doc(db, "member_timeline", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteMemberTimelineEvent = async (id: string) => {
  await deleteDoc(doc(db, "member_timeline", id));
};
