export type Role = 'diretor' | 'assessor';
export type UserStatus = 'ativo' | 'desligado' | 'pos_junior';
export type Priority = 'baixa' | 'media' | 'alta' | 'urgente';
export type DemandStatus =
  | 'backlog'
  | 'criando_escopo'
  | 'em_progresso'
  | 'em_revisao'
  | 'concluido';

export type NotificationType = 'assignment' | 'system' | 'mention';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: Date;
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
  history?: string;
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
  projectType: 'Interno' | 'Externo';
  assignees: string[];
  sprintId: string | null;
  tags: string[];
  startDate: Date | null;
  deadline: Date | null;
  estimatedHours: number;
  completedHours: number;
  subtasks: Subtask[];
  comments: Comment[];
  activityLog: ActivityEntry[];
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
  status: 'planned' | 'active' | 'completed';
  demandIds: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}