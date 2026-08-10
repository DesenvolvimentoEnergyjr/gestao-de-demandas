import { tenantConfig } from "@/config/tenant";

export type Role = (typeof tenantConfig.roles)[number]["id"];
export type UserStatus = (typeof tenantConfig.userStatuses)[number]["id"];
export type Priority = (typeof tenantConfig.priorities)[number]["id"];
export type DemandStatus = (typeof tenantConfig.demandStatuses)[number]["id"];

export type NotificationType = "assignment" | "system" | "mention";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  actorName?: string;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  addedBy: string;
  addedAt: Date;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  role: Role;
  status: UserStatus;
  area: string;
  title: string;
  history?: { role: string; date: string }[] | string;
  joinDate?: Date;
  workloadLimit?: number;
  createdAt: Date;
  updatedAt: Date;
  deactivatedAt?: Date;
}

export interface Demand {
  id: string;
  code: string;
  title: string;
  description: string;
  status: DemandStatus;
  priority: Priority;
  projectType: "Interno" | "Externo";
  assignees: string[];
  sprintId: string | null;
  visibleToAssessors?: boolean;
  tags: string[];
  startDate: Date | null;
  deadline: Date | null;
  estimatedHours: number;
  completedHours: number;
  completedAt?: Date | null;
  subtasks: Subtask[];
  comments: Comment[];
  activityLog: ActivityEntry[];
  attachments?: Attachment[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: Date;
}

export interface ActivityEntry {
  id: string;
  authorId: string;
  action: string;
  createdAt: Date;
}

export interface Sprint {
  id: string;
  number: number;
  title: string;
  description: string;
  objective: string;
  startDate: Date;
  endDate: Date;
  tags: string[];
  storyPoints: { total: number; completed: number };
  status: "planned" | "active" | "paused" | "completed";
  demandIds: string[];
  attachments?: Attachment[];
  notifiedUsers?: string[];
  pausedAt?: Date | null;
  totalPausedDays?: number;
  pauseHistory?: {
    pausedAt: Date;
    resumedAt?: Date;
  }[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MemberTimelineEventType =
  | "ingresso"
  | "egresso"
  | "cargo"
  | "projeto"
  | "demanda"
  | "outro";

export interface MemberTimelineEvent {
  id: string;
  userId: string;
  date: Date;
  type: MemberTimelineEventType;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstitutionalAccount {
  id: string;
  email: string;
  label: string;
  assignedUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
