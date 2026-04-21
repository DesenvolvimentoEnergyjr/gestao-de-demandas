import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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