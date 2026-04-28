'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Demand, User } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Calendar, Clock, MessageSquare, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import { differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';

interface KanbanCardProps {
  demand: Demand;
  users?: User[];
  isOverlay?: boolean;
}

const tagColorMap: Record<string, string> = {
  eficiencia: 'text-blue-400 bg-blue-400/10',
  solar: 'text-yellow-400 bg-yellow-400/10',
  normas: 'text-purple-400 bg-purple-400/10',
  revisao: 'text-orange-400 bg-orange-400/10',
  ambiental: 'text-emerald-400 bg-emerald-400/10',
  urgente: 'text-red-400 bg-red-400/10',
  alta: 'text-orange-400 bg-orange-400/10',
  media: 'text-yellow-400 bg-yellow-400/10',
  baixa: 'text-zinc-400 bg-zinc-400/10',
};

const priorityColorMap: Record<string, string> = {
  urgente: 'bg-red-500',
  alta: 'bg-orange-500',
  media: 'bg-yellow-500',
  baixa: 'bg-zinc-500',
};

const priorityLabelMap: Record<string, string> = {
  urgente: 'URGENTE',
  alta: 'ALTA PRIORIDADE',
  media: 'MÉDIA',
  baixa: 'BAIXA',
};

function getTagColor(tag: string): string {
  return tagColorMap[tag.toLowerCase()] ?? 'text-zinc-400 bg-zinc-400/10';
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ demand, users = [], isOverlay }) => {
  const { openDemanda } = useUIStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: demand.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const handleCardClick = () => {
    // Evitar abrir se estiver arrastando
    if (isDragging) return;
    openDemanda(demand.id, 'view');
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


  const isOverdue = demand.deadline && new Date(demand.deadline) < new Date();
  
  const daysSinceUpdate = differenceInDays(new Date(), new Date(demand.updatedAt));
  const isStagnant = (demand.status === 'em_progresso' || demand.status === 'em_revisao') && daysSinceUpdate >= 5;

  // Color bar logic
  const priorityColor = priorityColorMap[demand.priority.toLowerCase()] ?? 'bg-zinc-700';

  const tagLabel = demand.tags[0]
    ? demand.tags[0].toUpperCase()
    : (priorityLabelMap[demand.priority] ?? demand.priority.toUpperCase());

  const tagColor = demand.tags[0]
    ? getTagColor(demand.tags[0])
    : (tagColorMap[demand.priority] ?? 'text-zinc-400 bg-zinc-400/10');

  return (
    <motion.div
      initial={false}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={cn(
        'group cursor-grab active:cursor-grabbing relative touch-none',
        isStagnant ? 'border border-red-500/30 shadow-[0_0_15px_-5px_rgba(239,68,68,0.2)]' : 'border-gradient border-gradient-hover',
        'rounded-[24px] md:rounded-3xl p-4 md:p-5 flex flex-col gap-3 md:gap-4',
        'bg-gradient-to-br from-bg-surface to-bg-surface group-hover:from-bg-surface group-hover:to-secondary/5',
        isOverlay && 'shadow-2xl scale-[1.02] z-50'
      )}
    >
      {/* Clipping container for the priority bar to follow rounded corners */}
      <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
        <div className={cn("absolute left-0 top-0 bottom-0 w-1", priorityColor)} />
      </div>

      <div className="flex items-center justify-between pl-1">
        <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded', tagColor)}>
          {tagLabel}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 pl-1">
        <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-secondary transition-colors">
          {demand.title}
        </h4>
        
        {isStagnant && (
          <div className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded w-fit">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest">
              Estagnada há {daysSinceUpdate} dias
            </span>
          </div>
        )}
      </div>


      <div className="flex items-center justify-between mt-auto pt-0.5 pl-1">
        <div className="flex -space-x-1.5 focus-within:z-10">
          {demand.assignees.length > 0 ? (
            demand.assignees.slice(0, 3).map((assigneeId) => {
              const user = users.find((u) => u.uid === assigneeId);
              return (
                <div key={assigneeId} className="relative group/member shrink-0">
                  <Avatar
                    src={user?.photoURL}
                    size="xs"
                    className="border border-[#1a1a1a] w-6 h-6 hover:translate-y-[-2px] hover:z-20 transition-transform"
                    fallback={user?.name?.substring(0, 1).toUpperCase() || '?'}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-0 mb-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl opacity-0 group-hover/member:opacity-100 transition-all pointer-events-none z-50 shadow-2xl min-w-[100px] max-w-[200px]">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest text-center leading-tight break-words">{user?.name}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="w-6 h-6 rounded-full border border-dashed border-zinc-600 flex items-center justify-center">
              <span className="text-[8px] text-zinc-600">?</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {demand.comments.length > 0 && (
            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {demand.comments.length}
            </span>
          )}
          {demand.deadline && (
            <span className={cn(
              'text-[10px] flex items-center gap-1 font-medium',
              isOverdue ? 'text-red-400' : 'text-zinc-500'
            )}>
              {isOverdue ? (
                <><Clock className="w-3 h-3" />Atrasado</>
              ) : (
                <>
                  <Calendar className="w-3 h-3" />
                  {new Date(demand.deadline).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </>
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};