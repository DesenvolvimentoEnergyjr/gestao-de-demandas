'use client';

import React, { useMemo, useState } from 'react';
import { Sprint } from '@/types';
import { Card } from '@/components/ui/Card';
import { Calendar, Target, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate, cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { useUIStore } from '@/store/useUIStore';
import { useSprintStore } from '@/store/useSprintStore';
import { useDemandStore } from '@/store/useDemandStore';
import { getUsers } from '@/lib/firestore';
import { User } from '@/types';
import { isDemandVisibleToUser } from '@/lib/utils';

const FILTERS = [
  { id: 'todas', label: 'Todas' },
  { id: 'andamento', label: 'Em andamento' },
  { id: 'concluidas', label: 'Concluídas' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'minhas', label: 'Minhas Sprints' },
];

const getSprintStyles = (sprint: Sprint) => {
  if (sprint.status === 'planned')
    return { border: '#52525b', text: 'text-zinc-400', label: 'BACKLOG', bg: 'bg-zinc-800' };

  const isExterno = sprint.tags.some((t) =>
    ['externo', 'solar', 'vendas', 'projeto'].includes(t.toLowerCase())
  );

  if (sprint.status === 'active') {
    return isExterno
      ? { border: '#0baf4d', text: 'text-[#0baf4d]', label: 'EM ANDAMENTO', bg: 'bg-[#0baf4d]/10' }
      : { border: '#ffc20e', text: 'text-[#ffc20e]', label: 'EM ANDAMENTO', bg: 'bg-[#ffc20e]/10' };
  }

  if (sprint.status === 'completed') {
    return isExterno
      ? { border: '#166534', text: 'text-[#166534]', label: 'CONCLUÍDA', bg: 'bg-[#166534]/10' }
      : { border: '#92400e', text: 'text-[#92400e]', label: 'CONCLUÍDA', bg: 'bg-[#92400e]/10' };
  }

  return { border: '#71717a', text: 'text-zinc-500', label: 'DESCONHECIDO', bg: 'bg-zinc-800' };
};

export default function SprintsPage() {
  const { user } = useAuthStore();
  const { openNovaSprint, openSprintDetalhes } = useUIStore();
  const { sprints, loading } = useSprintStore();
  const { demands } = useDemandStore();
  const [activeFilter, setActiveFilter] = useState('todas');
  const [users, setUsers] = useState<User[]>([]);

  React.useEffect(() => {
    getUsers().then(setUsers).catch(console.error);
  }, []);

  const filteredSprints = useMemo(() => {
    const visibleDemandsIds = new Set(
      demands.filter(d => isDemandVisibleToUser(d, user, users)).map(d => d.id)
    );

    return sprints.filter((s) => {
      if (user?.role === 'assessor' && s.demandIds && s.demandIds.length > 0) {
        const hasVisibleDemand = s.demandIds.some(id => visibleDemandsIds.has(id));
        if (!hasVisibleDemand) return false;
      }

      if (activeFilter === 'concluidas') return s.status === 'completed';
      if (activeFilter === 'andamento') return s.status === 'active';
      if (activeFilter === 'backlog') return s.status === 'planned';
      if (activeFilter === 'minhas' && user) {
        return demands
          .filter((d) => d.sprintId === s.id)
          .some((d) => d.assignees.includes(user.uid));
      }
      return true;
    });
  }, [sprints, demands, activeFilter, user, users]);

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
    const styles = getSprintStyles(sprint);
    const progressPct = sprint.storyPoints.total > 0
      ? (sprint.storyPoints.completed / sprint.storyPoints.total) * 100
      : 0;

    return (
      <Card
        key={sprint.id}
        variant="gradient"
        className="p-6 md:p-7 flex flex-col gap-5 border-l-[6px] transition-all"
        style={{ borderLeftColor: styles.border }}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white">Sprint #{sprint.number}</h3>
            <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{sprint.title}</p>
          </div>
          <div className={cn('px-2.5 py-1 rounded-md text-[10px] font-black tracking-tighter', styles.bg, styles.text)}>
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
            <span>Progresso de Pontos</span>
            <span className="text-zinc-300 font-black">
              {sprint.storyPoints?.completed || 0} / {sprint.storyPoints?.total || 0} PTS
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
      <PageHeader
        title="Ciclos de Sprints"
        description="Planeje e acompanhe os ciclos de entrega da equipe com foco em metas e resultados."
      >
        {user?.role === 'diretor' && (
          <Button onClick={openNovaSprint} className="gap-2 shadow-lg shadow-secondary/10 px-6 h-11">
            <Plus className="w-4 h-4" />
            Nova Sprint
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2 md:gap-3 pb-2">
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