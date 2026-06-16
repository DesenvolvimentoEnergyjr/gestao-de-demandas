'use client';

import React, { useMemo, useState } from 'react';
import { Sprint } from '@/types';
import { Card } from '@/components/ui/Card';
import { Calendar, Target, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate, cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { useSprintStore } from '@/store/useSprintStore';
import { useDemandStore } from '@/store/useDemandStore';
import { getUsers } from '@/lib/firestore';
import { User } from '@/types';
import { isDemandVisibleToUser } from '@/lib/utils';
import { motion } from 'framer-motion';

const FILTERS = [
  { id: 'todas', label: 'Todas' },
  { id: 'andamento', label: 'Em andamento' },
  { id: 'concluidas', label: 'Concluídas' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'minhas', label: 'Minhas Sprints' },
];

import { tenantConfig } from '@/config/tenant';

const getDynamicSprintStatus = (sprint: Sprint, sprintDemands: any[]) => {
  if (sprint.status === 'completed') return 'completed';
  if (sprintDemands.length > 0 && sprintDemands.every(d => d.status === 'concluido')) return 'completed';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = (sprint.startDate as any)?.toDate ? (sprint.startDate as any).toDate() : new Date(sprint.startDate);
  startDate.setHours(0, 0, 0, 0);
  
  if (startDate <= today) return 'active';
  return 'planned';
};

export default function SprintsPage() {
  const { user } = useAuthStore();
  const { openNovaSprint, openSprintDetalhes } = useUIStore();
  const { sprints, loading } = useSprintStore();
  const { demands } = useDemandStore();
  const [activeFilter, setActiveFilter] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  React.useEffect(() => {
    getUsers().then(setUsers).catch(console.error);
  }, []);

  const filteredSprints = useMemo(() => {
    const visibleDemandsIds = new Set(
      demands.filter(d => isDemandVisibleToUser(d, user, users)).map(d => d.id)
    );

    return sprints.filter((s) => {
      // Search filter by text
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase();
        const matchesSearch =
          (s.title || '').toLowerCase().includes(term) ||
          (s.objective || '').toLowerCase().includes(term) ||
          `sprint ${s.number}`.includes(term) ||
          `#${s.number}`.includes(term);

        if (!matchesSearch) return false;
      }

      if (user?.role === 'assessor' && s.demandIds && s.demandIds.length > 0) {
        const hasVisibleDemand = s.demandIds.some(id => visibleDemandsIds.has(id));
        if (!hasVisibleDemand) return false;
      }

      const sprintDemands = demands.filter(d => d.sprintId === s.id);
      const dynamicStatus = getDynamicSprintStatus(s, sprintDemands);

      if (activeFilter === 'concluidas') return dynamicStatus === 'completed';
      if (activeFilter === 'andamento') return dynamicStatus === 'active';
      if (activeFilter === 'backlog') return dynamicStatus === 'planned';
      if (activeFilter === 'minhas' && user) {
        return sprintDemands.some((d) => d.assignees.includes(user.uid));
      }
      return true;
    });
  }, [sprints, demands, activeFilter, user, users, searchQuery]);

  const groupedSprints = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const groups: Record<string, Sprint[]> = {};

    filteredSprints.forEach(s => {
      const dateStr = s.createdAt || s.startDate;
      const year = new Date(dateStr).getFullYear();
      const label = year === currentYear ? 'Gestão Atual' : `Sprints ${year}`;

      if (!groups[label]) groups[label] = [];
      groups[label].push(s);
    });

    Object.values(groups).forEach(group => {
      group.sort((a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime());
    });

    const gestaoAtual = groups['Gestão Atual'] || [];
    delete groups['Gestão Atual'];

    const pastGroups = Object.entries(groups)
      .map(([label, groupSprints]) => ({
        label,
        year: parseInt(label.replace('Sprints ', '')),
        sprints: groupSprints
      }))
      .sort((a, b) => b.year - a.year);

    return { gestaoAtual, pastGroups };
  }, [filteredSprints]);

  const renderSprintCard = (sprint: Sprint) => {
    const sprintDemands = demands.filter((d) => d.sprintId === sprint.id);
    const projectTypeId = sprint.tags?.find(t => t === 'Interno' || t === 'Externo') || tenantConfig.projectTypes[0].id;
    const projectConfig = tenantConfig.projectTypes.find(p => p.id === projectTypeId) || tenantConfig.projectTypes[0];
    const theme = projectConfig.theme;

    const totalHours = sprintDemands.reduce((acc, d) => acc + (d.estimatedHours || 0), 0);
    const completedHours = sprintDemands
      .filter((d) => d.status === 'concluido')
      .reduce((acc, d) => acc + (d.estimatedHours || 0), 0);
    const progressPct = totalHours > 0
      ? (completedHours / totalHours) * 100
      : 0;

    let styles = {
      borderClass: 'border-zinc-500',
      textClass: 'text-zinc-400',
      bgClass: 'bg-zinc-800',
      label: 'BACKLOG',
    };

    const dynamicStatus = getDynamicSprintStatus(sprint, sprintDemands);

    if (dynamicStatus === 'active') {
      styles = {
        borderClass: theme === 'secondary' ? 'border-secondary' : 'border-primary',
        textClass: theme === 'secondary' ? 'text-secondary' : 'text-primary',
        bgClass: theme === 'secondary' ? 'bg-secondary/10' : 'bg-primary/10',
        label: 'EM ANDAMENTO'
      };
    } else if (dynamicStatus === 'completed') {
      styles = {
        borderClass: theme === 'secondary' ? 'border-secondary-dark' : 'border-primary-dark',
        textClass: theme === 'secondary' ? 'text-secondary-dark' : 'text-primary-dark',
        bgClass: theme === 'secondary' ? 'bg-secondary-dark/10' : 'bg-primary-dark/10',
        label: 'CONCLUÍDA'
      };
    }

    return (
      <Card
        key={sprint.id}
        className={cn("p-6 md:p-7 flex flex-col gap-5 border border-l-[6px] transition-all bg-[#111111]", styles.borderClass)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white">Sprint #{sprint.number}</h3>
            <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{sprint.title}</p>
          </div>
          <div className={cn('px-2.5 py-1 rounded-md text-[10px] font-black tracking-tighter', styles.bgClass, styles.textClass)}>
            {styles.label}
          </div>
        </div>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 text-xs">
            <Target className="w-4 h-4 text-secondary/70 shrink-0" />
            <span className="font-medium text-zinc-300 line-clamp-2 leading-relaxed">{sprint.objective}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="font-medium tracking-tight">
              {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
            </span>
          </div>
        </div>

        <div className="space-y-3 mt-auto pt-6 border-t border-white/5">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            <span>Progresso de Horas</span>
            <span className="text-zinc-300 font-black">
              {completedHours}h / {totalHours}h
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary shadow-[0_0_12px_rgba(11,175,77,0.4)] transition-all duration-1000 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => openSprintDetalhes(sprint.id)}
          className="mt-2 w-full text-[10px] font-bold uppercase tracking-widest py-3 hover:bg-white/5 active:scale-95 transition-all"
        >
          Ver Planejamento
        </Button>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col gap-6 md:gap-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 mt-4 md:mt-0">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  'relative px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors duration-300 border flex items-center gap-2',
                  isActive
                    ? 'text-black border-transparent z-10'
                    : 'bg-[#111111] text-zinc-500 border-white/5 hover:border-white/10 hover:text-zinc-300 z-0'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSprintFilter"
                    className="absolute inset-0 bg-white rounded-full shadow-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{filter.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {user?.role === 'diretor' && (
            <Button
              onClick={openNovaSprint}
              className="gap-2 shadow-lg shadow-secondary/20 px-4 md:px-5 h-9 md:h-10 text-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nova Sprint
            </Button>
          )}

          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              placeholder="Pesquisar sprints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111111] border border-white/5 rounded-full py-2.5 pl-11 pr-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-secondary/50 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-0 md:pr-6 no-scrollbar">
        {loading ? (
          <div className="border border-white/5 bg-white/[0.01] rounded-2xl md:rounded-[40px] p-4 md:p-8 mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-white/[0.02] rounded-3xl animate-pulse border border-white/5" />
              ))}
            </div>
          </div>
        ) : filteredSprints.length > 0 ? (
          <div className="space-y-12 pb-10">
            {groupedSprints.gestaoAtual.length > 0 && (
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-6">Gestão Atual</h2>
                <div className="border border-white/5 bg-white/[0.01] rounded-2xl md:rounded-[40px] p-4 md:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {groupedSprints.gestaoAtual.map(renderSprintCard)}
                  </div>
                </div>
              </div>
            )}

            {groupedSprints.pastGroups.length > 0 && (
              <div className="space-y-8">
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-4">Anteriores</h2>
                {groupedSprints.pastGroups.map(group => (
                  <div key={group.label} className="border border-white/5 bg-white/[0.01] rounded-2xl md:rounded-[40px] p-4 md:p-8">
                    <h3 className="text-lg font-black text-secondary uppercase tracking-[0.2em] mb-6">{group.label}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {group.sprints.map(renderSprintCard)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="border border-white/5 bg-white/[0.01] rounded-2xl md:rounded-[40px] p-4 md:p-8 mb-10 flex flex-col items-center justify-center border-dashed py-20 text-center">
            <Search className="w-10 h-10 md:w-12 md:h-12 text-zinc-800 mb-4" />
            <p className="text-zinc-600 font-medium text-sm">Nenhuma sprint encontrada para este filtro.</p>
          </div>
        )}
      </div>
    </div>
  );
}