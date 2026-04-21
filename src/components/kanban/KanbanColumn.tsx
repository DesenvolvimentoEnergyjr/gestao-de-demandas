'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Demand, DemandStatus } from '@/types';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  demands: Demand[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, color, demands }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const { openNovaDemanda } = useUIStore();

  return (
    <div className={cn(
      'flex flex-col w-[280px] min-w-[280px] rounded-2xl transition-all duration-200 h-full',
      'bg-[#141414] border border-white/[0.06]',
      isOver && 'border-secondary/30 bg-[#161f16]'
    )}>
      {/* Column Header */}
      <div className="px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
          <span className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-full',
            'bg-white/8 text-zinc-400'
          )}>
            {demands.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => openNovaDemanda(id as DemandStatus)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/5 transition-all active:scale-90"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top accent line */}
      <div
        className="h-0.5 mx-4 rounded-full opacity-60"
        style={{ backgroundColor: color }}
      />

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className="flex-1 p-3 space-y-2.5 min-h-[80px] overflow-y-auto"
      >
        <SortableContext
          id={id}
          items={demands.map(d => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {demands.map((demand) => (
            <KanbanCard key={demand.id} demand={demand} />
          ))}
        </SortableContext>

        {demands.length === 0 && (
          <div className="h-20 flex items-center justify-center">
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest font-medium">Vazio</p>
          </div>
        )}
      </div>
    </div>
  );
};
