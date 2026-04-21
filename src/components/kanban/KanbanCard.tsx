'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Demand } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Calendar, Clock, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
  demand: Demand;
  isOverlay?: boolean;
}

// Map tags/priority to display labels and colors
const tagColorMap: Record<string, string> = {
  eficiencia: 'text-blue-400 bg-blue-400/10',
  solar: 'text-yellow-400 bg-yellow-400/10',
  normas: 'text-purple-400 bg-purple-400/10',
  revisao: 'text-orange-400 bg-orange-400/10',
  ambiental: 'text-emerald-400 bg-emerald-400/10',
  alta: 'text-orange-400 bg-orange-400/10',
  'alta prioridade': 'text-orange-400 bg-orange-400/10',
  urgente: 'text-red-400 bg-red-400/10',
  media: 'text-yellow-400 bg-yellow-400/10',
  baixa: 'text-zinc-400 bg-zinc-400/10',
};

function getTagColor(tag: string): string {
  const key = tag.toLowerCase();
  return tagColorMap[key] || 'text-zinc-400 bg-zinc-400/10';
}

function getPriorityLabel(priority: string): string {
  const map: Record<string, string> = {
    urgente: 'URGENTE',
    alta: 'ALTA PRIORIDADE',
    media: 'MÉDIA',
    baixa: 'BAIXA',
  };
  return map[priority] || priority.toUpperCase();
}

function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    urgente: 'text-red-400 bg-red-400/10',
    alta: 'text-orange-400 bg-orange-400/10',
    media: 'text-yellow-400 bg-yellow-400/10',
    baixa: 'text-zinc-400 bg-zinc-400/10',
  };
  return map[priority] || 'text-zinc-400 bg-zinc-400/10';
}

function formatDemandId(id: string): string {
  if (id.startsWith('EJ-')) return id;
  const num = parseInt(id.replace(/\D/g, '').slice(-3)) || Math.floor(Math.random() * 900 + 100);
  return `EJ-${num}`;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ demand, isOverlay }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: demand.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[120px] rounded-xl bg-bg-surface border border-dashed border-secondary/30 opacity-40"
      />
    );
  }

  // Progress percentage
  const progress = demand.estimatedHours > 0
    ? Math.min(100, Math.round((demand.completedHours / demand.estimatedHours) * 100))
    : 0;

  const isInProgress = demand.status === 'em_progresso';
  const isOverdue = demand.deadline && new Date(demand.deadline) < new Date();

  // Primary tag info extraction
  const tagLabel = demand.tags[0]
    ? demand.tags[0].toUpperCase()
    : getPriorityLabel(demand.priority);
  const tagColor = demand.tags[0]
    ? getTagColor(demand.tags[0])
    : getPriorityColor(demand.priority);

  const cardId = formatDemandId(demand.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group cursor-grab active:cursor-grabbing',
        'bg-[#1a1a1a] hover:bg-[#1e1e1e] border border-white/[0.06] hover:border-white/[0.12]',
        'rounded-xl p-4 flex flex-col gap-3',
        'transition-all duration-150',
        isOverlay && 'shadow-2xl border-secondary/40 rotate-1 scale-[1.02]'
      )}
    >
      {/* Top row: tag + ID */}
      <div className="flex items-center justify-between">
        <span className={cn(
          'text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded',
          tagColor
        )}>
          {tagLabel}
        </span>
        <span className="text-[10px] font-mono text-zinc-500">{cardId}</span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-secondary transition-colors">
        {demand.title}
      </h4>

      {/* Progress bar (only for em_progresso) */}
      {isInProgress && (
        <div className="space-y-1.5">
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-secondary to-secondary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-0.5">
        {/* Assignee avatars */}
        <div className="flex -space-x-1.5">
          {demand.assignees.length > 0 ? (
            demand.assignees.slice(0, 3).map((assigneeId) => (
              <Avatar
                key={assigneeId}
                size="xs"
                className="border border-[#1a1a1a] w-6 h-6"
                fallback={assigneeId.substring(0, 1).toUpperCase()}
              />
            ))
          ) : (
            <div className="w-6 h-6 rounded-full border border-dashed border-zinc-600 flex items-center justify-center">
              <span className="text-[8px] text-zinc-600">?</span>
            </div>
          )}
        </div>

        {/* Right: date or status */}
        <div className="flex items-center gap-2">
          {isInProgress && (
            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {progress}%
            </span>
          )}
          {demand.comments && demand.comments.length > 0 && (
            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {demand.comments.length}
            </span>
          )}
          {demand.deadline ? (
            <span className={cn(
              'text-[10px] flex items-center gap-1 font-medium',
              isOverdue ? 'text-red-400' : 'text-zinc-500'
            )}>
              {isOverdue ? (
                <>
                  <Clock className="w-3 h-3" />
                  Atrasado
                </>
              ) : (
                <>
                  <Calendar className="w-3 h-3" />
                  {new Date(demand.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </>
              )}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
