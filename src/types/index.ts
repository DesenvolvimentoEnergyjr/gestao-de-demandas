export type Role = 'diretor' | 'assessor';
export type Priority = 'baixa' | 'media' | 'alta' | 'urgente';
export type DemandStatus = 
  | 'backlog' 
  | 'criando_escopo' 
  | 'em_progresso' 
  | 'em_revisao' 
  | 'concluido';

export interface User {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  role: Role;
  area: string;
  title: string;
  workloadLimit?: number;
  createdAt: Date;
}

export interface Demand {
  id: string;
  title: string;
  description: string;
  status: DemandStatus;
  priority: Priority;
  assignees: string[];        // User UIDs
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
  createdAt: Date;
}
