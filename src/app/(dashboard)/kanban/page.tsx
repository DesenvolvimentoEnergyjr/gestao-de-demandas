'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { getUsers } from '@/lib/firestore';
import { useDemandStore } from '@/store/useDemandStore';
import { useSprintStore } from '@/store/useSprintStore';
import { useAuthStore } from '@/store/useAuthStore';

import { User } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { KanbanBoardSkeleton } from '@/components/kanban/KanbanBoardSkeleton';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { ChevronRight } from 'lucide-react';

const FILTERS = [
  { id: 'todas', label: 'Todas' },
  { id: 'minhas', label: 'Minhas Demandas' },
];

export default function KanbanPage() {
  const { user } = useAuthStore();
  const { loading, demands } = useDemandStore();
  const { sprints } = useSprintStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const demandId = searchParams.get('demandId');

  const [users, setUsers] = React.useState<User[]>([]);
  const [activeFilter, setActiveFilter] = useState('minhas');
  const [selectedSprintId, setSelectedSprintId] = useState('all');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const deferredFilter = React.useDeferredValue(activeFilter);
  const deferredSprintId = React.useDeferredValue(selectedSprintId);
  const [showMembers, setShowMembers] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggleMembers = () => {
    setIsAnimating(true);
    setShowMembers((prev) => !prev);
  };

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  useEffect(() => {
    getUsers(true).then(setUsers).catch(console.error);
  }, []);

  useEffect(() => {
    if (demandId && demands.length > 0 && user) {
      const demand = demands.find(d => d.id === demandId);
      if (demand) {
        if (!demand.assignees.includes(user.uid)) {
          setActiveFilter('todas');
        }
        if (demand.sprintId && selectedSprintId !== 'all' && selectedSprintId !== demand.sprintId) {
          setSelectedSprintId(demand.sprintId);
        }
      }
      setHighlightedId(demandId);
      // Clean URL without losing local state
      router.replace('/kanban', { scroll: false });
    }
  }, [demandId, demands, router, user, selectedSprintId]);

  // Clear highlight when interacting with the page
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
    <div className="flex-1 flex flex-col relative px-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  'relative px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors duration-300 border',
                  isActive
                    ? 'text-black border-transparent z-10'
                    : 'bg-[#111111] text-zinc-500 border-white/5 hover:border-white/10 hover:text-zinc-300 z-0'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeKanbanFilter"
                    className="absolute inset-0 bg-white rounded-full shadow-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{filter.label}</span>
              </button>
            );
          })}

          {/* Members Button */}
          <button
            onClick={handleToggleMembers}
            className={cn(
              'relative px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors duration-300 border flex items-center gap-1.5',
              activeFilter.startsWith('membro_')
                ? 'text-black border-transparent z-10'
                : (showMembers
                  ? 'bg-white/10 text-white border-white/20 z-0'
                  : 'bg-[#111111] text-zinc-500 border-white/5 hover:border-white/10 hover:text-zinc-300 z-0')
            )}
          >
            {activeFilter.startsWith('membro_') && (
              <motion.div
                layoutId="activeKanbanFilter"
                className="absolute inset-0 bg-white rounded-full shadow-lg"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <span>Membros</span>
              <ChevronRight className={cn('w-3.5 h-3.5 transition-transform duration-200', showMembers && 'rotate-90')} />
            </span>
          </button>

          {/* Avatars of the members with smooth transition */}
          <AnimatePresence>
            {showMembers && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                onAnimationStart={() => setIsAnimating(true)}
                onAnimationComplete={() => setIsAnimating(false)}
                className={cn(
                  'flex items-center gap-1.5 pl-1 py-2 -my-2 whitespace-nowrap',
                  isAnimating ? 'overflow-hidden' : 'overflow-visible'
                )}
              >
                {sortedUsers.map((member) => {
                  const isSelected = activeFilter === `membro_${member.uid}`;
                  return (
                    <button
                      key={member.uid}
                      onClick={() => {
                        const filterKey = `membro_${member.uid}`;
                        setActiveFilter((prev) => (prev === filterKey ? 'todas' : filterKey));
                      }}
                      className="relative group/member shrink-0 focus:outline-none"
                    >
                      <Avatar
                        src={member.photoURL}
                        size="xs"
                        className={cn(
                          'w-8 h-8 rounded-full border transition-all duration-200 hover:scale-110 hover:border-white/30',
                          isSelected
                            ? 'border-secondary scale-110 ring-2 ring-secondary/20 shadow-[0_0_10px_rgba(11,175,77,0.4)]'
                            : 'border-white/10'
                        )}
                        fallback={member.name.substring(0, 1).toUpperCase()}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl opacity-0 pointer-events-none group-hover/member:opacity-100 transition-all z-50 shadow-2xl whitespace-nowrap">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                          {member.name}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full md:min-w-[16rem] md:w-auto md:max-w-xs shrink-0">
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
                activeFilter={deferredFilter}
                selectedSprintId={deferredSprintId}
                highlightedId={highlightedId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}