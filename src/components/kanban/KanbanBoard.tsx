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
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { DemandStatus } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { updateDemand } from '@/lib/firestore';
import { useDemandStore } from '@/store/useDemandStore';

const COLUMNS: { id: DemandStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: '#71717a' }, // gray
  { id: 'criando_escopo', title: 'Criando Escopo', color: '#3b82f6' }, // blue
  { id: 'em_progresso', title: 'Em Progresso', color: '#ffc20e' }, // yellow
  { id: 'em_revisao', title: 'Em Revisão', color: '#f97316' }, // orange
  { id: 'concluido', title: 'Concluído', color: '#0baf4d' }, // secondary
];

export const KanbanBoard = () => {
  const { demands, updateDemand: updateStoreDemand, searchQuery } = useDemandStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const filteredDemands = useMemo(() => {
    return demands.filter(d =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [demands, searchQuery]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeDemandId = active.id as string;
    const overId = over.id as string;

    // Determine targeted status
    let newStatus: DemandStatus | null = null;

    // Check if dropped over a column
    if (COLUMNS.find(c => c.id === overId)) {
      newStatus = overId as DemandStatus;
    } else {
      // Dropped over another card
      const overDemand = demands.find(d => d.id === overId);
      if (overDemand) {
        newStatus = overDemand.status;
      }
    }

    if (newStatus) {
      const activeDemand = demands.find(d => d.id === activeDemandId);
      if (activeDemand && activeDemand.status !== newStatus) {
        // Update Firestore
        await updateDemand(activeDemandId, { status: newStatus });
        // Update Global Store
        updateStoreDemand(activeDemandId, { status: newStatus });
      }
    }

    setActiveId(null);
  };

  const activeDemand = activeId ? demands.find(d => d.id === activeId) : null;

  return (
    <div className="flex h-full w-full gap-4 overflow-x-auto pb-4">
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
            demands={filteredDemands.filter(d => d.status === column.id)}
          />
        ))}

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeDemand ? (
            <div className="rotate-3 scale-105 transition-transform">
              <KanbanCard demand={activeDemand} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
