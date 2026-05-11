'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { getUsers } from '@/lib/firestore';
import { useDemandStore } from '@/store/useDemandStore';
import { useSprintStore } from '@/store/useSprintStore';

import { PageHeader } from '@/components/layout/PageHeader';
import { User } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { KanbanBoardSkeleton } from '@/components/kanban/KanbanBoardSkeleton';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

const FILTERS = [
  { id: 'todas', label: 'Todas' },
  { id: 'minhas', label: 'Minhas Demandas' },
];

export default function KanbanPage() {
  const { loading, demands } = useDemandStore();
  const { sprints } = useSprintStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const demandId = searchParams.get('demandId');

  const [users, setUsers] = React.useState<User[]>([]);
  const [activeFilter, setActiveFilter] = useState('todas');
  const [selectedSprintId, setSelectedSprintId] = useState('all');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    getUsers(true).then(setUsers).catch(console.error);
  }, []);

  useEffect(() => {
    if (demandId && demands.length > 0) {
      setHighlightedId(demandId);
      // Limpar a URL sem perder o estado local
      router.replace('/kanban', { scroll: false });
    }
  }, [demandId, demands, router]);

  // Limpar o destaque ao interagir com a página
  useEffect(() => {
    if (!highlightedId) return;

    const handleInteraction = () => {
      setHighlightedId(null);
    };

    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [highlightedId]);

  return (
    <div className="h-full flex flex-col relative px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Quadro de Demandas"
        description="Gerencie o fluxo de trabalho e acompanhe o status de cada atividade em tempo real."
      />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                'px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border',
                activeFilter === filter.id
                  ? 'bg-white text-black border-white shadow-lg'
                  : 'bg-[#111111] text-zinc-500 border-white/5 hover:border-white/10 hover:text-zinc-300'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="w-full md:w-64">
          <Select
            value={selectedSprintId}
            onChange={(e) => setSelectedSprintId(e.target.value)}
            className="h-10 text-xs"
            placeholder="Filtrar por Sprint"
          >
            <option value="all">Todas as Sprints</option>
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                Sprint #{sprint.number} {sprint.title ? `- ${sprint.title}` : ''}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <KanbanBoardSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <KanbanBoard
                users={users}
                activeFilter={activeFilter}
                selectedSprintId={selectedSprintId}
                highlightedId={highlightedId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}