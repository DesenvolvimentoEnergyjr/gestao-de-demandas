'use client';

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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

export const KanbanBoard = ({
  users = [],
  activeFilter = 'todas',
  selectedSprintId = 'all',
  highlightedId = null
}: {
  users?: User[];
  activeFilter?: string;
  selectedSprintId?: string;
  highlightedId?: string | null;
}) => {
  const { demands, updateDemand: updateStoreDemand, searchQuery } = useDemandStore();
  const { user: currentUser } = useAuthStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const filteredDemands = useMemo(
    () =>
      demands.filter(
        (d) => {
          const matchesSearch = (d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

          if (!matchesSearch) return false;

          if (!isDemandVisibleToUser(d, currentUser, users)) return false;

          if (activeFilter === 'minhas' && currentUser) {
            if (!d.assignees.includes(currentUser.uid)) return false;
          }

          if (selectedSprintId !== 'all') {
            if (d.sprintId !== selectedSprintId) return false;
          }

          return true;
        }
      ),
    [demands, searchQuery, currentUser, users, activeFilter, selectedSprintId]
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (activeId) return;

    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

    if (target.hasAttribute('data-kanban-card')) {
      const colIndex = parseInt(target.getAttribute('data-col-index') || '0', 10);
      const cardIndex = parseInt(target.getAttribute('data-card-index') || '0', 10);

      let nextCol = colIndex;
      let nextCard = cardIndex;

      if (e.key === 'ArrowRight') {
        nextCol += 1;
        nextCard = 0;
      } else if (e.key === 'ArrowLeft') {
        nextCol -= 1;
        nextCard = 0;
      } else if (e.key === 'ArrowDown') {
        nextCard += 1;
      } else if (e.key === 'ArrowUp') {
        nextCard -= 1;
      } else {
        return;
      }

      e.preventDefault();

      let nextCardElement = document.querySelector(`[data-kanban-card="true"][data-col-index="${nextCol}"][data-card-index="${nextCard}"]`) as HTMLElement;

      if (!nextCardElement && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        let fallbackCol = nextCol;
        while (fallbackCol >= 0 && fallbackCol < COLUMNS.length) {
          const firstCard = document.querySelector(`[data-kanban-card="true"][data-col-index="${fallbackCol}"][data-card-index="0"]`) as HTMLElement;
          if (firstCard) {
            nextCardElement = firstCard;
            break;
          }
          fallbackCol += e.key === 'ArrowRight' ? 1 : -1;
        }
      }

      if (nextCardElement) {
        nextCardElement.focus();
        nextCardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  return (
    <div
      className="flex h-full w-full gap-3 md:gap-4 overflow-x-auto pb-6 bg-bg-section/40 rounded-xl md:rounded-[40px] px-2 md:px-4 pt-2 md:pt-4 border border-white/5 snap-x snap-mandatory"
      onKeyDown={handleKeyDown}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {COLUMNS.map((column, index) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            demands={filteredDemands.filter((d) => d.status === column.id)}
            users={users}
            highlightedId={highlightedId}
            columnIndex={index}
          />
        ))}

        <DragOverlay>
          {activeDemand ? <KanbanCard demand={activeDemand} users={users} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};