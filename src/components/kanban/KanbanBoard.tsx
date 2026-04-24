'use client';

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DemandStatus, User } from '@/types';
import { isDemandVisibleToUser } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { updateDemand } from '@/lib/firestore';
import { useDemandStore } from '@/store/useDemandStore';
import { toast } from '@/store/useToastStore';

const COLUMNS: { id: DemandStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: '#71717a' },
  { id: 'criando_escopo', title: 'Criando Escopo', color: '#3b82f6' },
  { id: 'em_progresso', title: 'Em Progresso', color: '#ffc20e' },
  { id: 'em_revisao', title: 'Em Revisão', color: '#f97316' },
  { id: 'concluido', title: 'Concluído', color: '#0baf4d' },
];

export const KanbanBoard = ({ users = [] }: { users?: User[] }) => {
  const { demands, updateDemand: updateStoreDemand, searchQuery } = useDemandStore();
  const { user: currentUser } = useAuthStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const filteredDemands = useMemo(
    () =>
      demands.filter(
        (d) =>
          (d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))) &&
          isDemandVisibleToUser(d, currentUser, users)
      ),
    [demands, searchQuery, currentUser, users]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeDemandId = active.id as string;
    const overId = over.id as string;

    const newStatus: DemandStatus | undefined =
      COLUMNS.find((c) => c.id === overId)?.id ??
      demands.find((d) => d.id === overId)?.status;

    if (!newStatus) return;

    const activeDemand = demands.find((d) => d.id === activeDemandId);
    if (activeDemand && activeDemand.status !== newStatus) {
      updateStoreDemand(activeDemandId, { status: newStatus });
      try {
        await updateDemand(activeDemandId, { status: newStatus });
        toast.success(`Demanda movida para ${COLUMNS.find(c => c.id === newStatus)?.title}`);
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
        toast.error('Erro ao atualizar status da demanda.');
      }
    }
  };

  const activeDemand = activeId ? demands.find((d) => d.id === activeId) : null;

  return (
    <div className="flex h-full w-full gap-3 md:gap-4 overflow-x-auto pb-6 bg-bg-section/40 rounded-xl md:rounded-[40px] px-2 md:px-4 pt-2 md:pt-4 border border-white/5 snap-x snap-mandatory no-scrollbar">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            demands={filteredDemands.filter((d) => d.status === column.id)}
            users={users}
          />
        ))}

        <DragOverlay>
          {activeDemand ? <KanbanCard demand={activeDemand} users={users} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};