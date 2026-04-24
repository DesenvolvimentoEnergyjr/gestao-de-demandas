import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Demand, User } from '@/types';

export function isDemandVisibleToUser(demand: Demand, currentUser: User | null, allUsers: User[]): boolean {
  if (!currentUser) return false;
  if (currentUser.role === 'diretor') return true;

  if (demand.assignees.length === 0) return true;

  const hasAssessor = demand.assignees.some(uid => {
    const u = allUsers.find(user => user.uid === uid);
    return u && u.role === 'assessor';
  });

  return hasAssessor;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return 'Sem prazo';
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
}

export function formatDateRange(start: Date, end: Date): string {
  return `${format(start, 'dd MMM', { locale: ptBR })} – ${format(end, 'dd MMM, yyyy', { locale: ptBR })}`;
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}