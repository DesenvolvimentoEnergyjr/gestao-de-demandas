'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Demand, User } from '@/types';
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  differenceInDays,
  startOfDay,
  endOfDay,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
  addMonths,
  addWeeks,
  isWithinInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar } from '@/components/ui/Avatar';
import { useDemandStore } from '@/store/useDemandStore';
import { ChevronLeft, ChevronRight, Calendar, LayoutGrid } from 'lucide-react';
import { cn, isDemandVisibleToUser } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';

interface TimelineViewProps {
  demands: Demand[];
  users: User[];
}

type ViewMode = 'dia' | 'semana' | 'ano';

const PROJECT_COLORS = {
  Interno: 'bg-gradient-to-r from-[#ffc20e] to-[#ff8c00] text-black shadow-[0_0_25px_-5px_rgba(255,194,14,0.4)] border-2 border-[#b38600]',
  Externo: 'bg-gradient-to-r from-[#0baf4d] to-[#055a2a] text-white shadow-[0_0_25px_-5px_rgba(11,175,77,0.4)] border-2 border-[#077a35]',
};

export function TimelineView({ demands, users }: TimelineViewProps) {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { openDemanda } = useUIStore();
  const { searchQuery } = useDemandStore();
  const [viewMode, setViewMode] = useState<ViewMode>('semana');
  const [referenceDate, setReferenceDate] = useState(new Date());

  const range = useMemo(() => {
    if (viewMode === 'dia') {
      const start = startOfDay(referenceDate);
      return { start, end: addDays(start, 13), totalDays: 14 };
    }
    if (viewMode === 'semana') {
      const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
      const end = addWeeks(start, 8);
      return { start, end, totalDays: 56 };
    }
    const start = startOfYear(referenceDate);
    const end = endOfYear(referenceDate);
    return { start, end, totalDays: differenceInDays(end, start) + 1 };
  }, [viewMode, referenceDate]);

  const columns = useMemo(() => {
    if (viewMode === 'dia') {
      return Array.from({ length: 14 }, (_, i) => ({
        date: addDays(range.start, i),
        label: format(addDays(range.start, i), 'eee', { locale: ptBR }),
        subLabel: format(addDays(range.start, i), 'dd'),
      }));
    }
    if (viewMode === 'semana') {
      return Array.from({ length: 8 }, (_, i) => {
        const date = addWeeks(range.start, i);
        return {
          date,
          label: format(date, 'MMMM', { locale: ptBR }),
          subLabel: format(date, 'dd/MM'),
        };
      });
    }
    return eachMonthOfInterval({ start: range.start, end: range.end }).map((month) => ({
      date: month,
      label: format(month, 'MMMM', { locale: ptBR }),
      subLabel: format(month, 'yyyy'),
    }));
  }, [viewMode, range]);

  const userRows = useMemo(() => {
    const activeUsers = users.filter(u => u.status !== 'desligado' && u.status !== 'pos_junior');

    const filteredDemands = demands.filter((d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      isDemandVisibleToUser(d, currentUser, users)
    );

    return activeUsers.map((user) => {
      const userDemands = filteredDemands.filter(
        (d) =>
          d.assignees.includes(user.uid) &&
          d.status !== 'concluido' &&
          d.deadline !== null
      );

      const visibleDemands = userDemands.filter((d) => {
        const dStart = d.startDate ?? d.createdAt;
        const dEnd = d.deadline ?? addDays(dStart, 7);
        return dStart <= range.end && dEnd >= range.start;
      });

      // Lógica de cálculo de slots para sobreposição
      const sorted = [...visibleDemands].sort((a, b) => {
        const aStart = a.startDate ?? a.createdAt;
        const bStart = b.startDate ?? b.createdAt;
        return aStart.getTime() - bStart.getTime();
      });

      const slots: Demand[][] = [];
      sorted.forEach(demand => {
        let placed = false;
        const dStart = demand.startDate ?? demand.createdAt;

        for (let i = 0; i < slots.length; i++) {
          const lastInSlot = slots[i][slots[i].length - 1];
          const lastEnd = lastInSlot.deadline ?? addDays(lastInSlot.startDate ?? lastInSlot.createdAt, 7);

          if (dStart > lastEnd) {
            slots[i].push(demand);
            placed = true;
            break;
          }
        }
        if (!placed) {
          slots.push([demand]);
        }
      });

      // Mapear cada demanda para seu slot e o total de slots na linha
      const demandsWithLayout = visibleDemands.map(d => {
        const slotIndex = slots.findIndex(slot => slot.some(sd => sd.id === d.id));
        return {
          ...d,
          slotIndex,
          totalSlots: slots.length
        };
      });

      return { user, demands: demandsWithLayout };
    });
  }, [users, demands, range, searchQuery, currentUser]);

  interface TimelineDemand extends Demand {
    slotIndex: number;
    totalSlots: number;
  }

  const getBarProps = (demand: TimelineDemand) => {
    const dStart = startOfDay(demand.startDate ?? demand.createdAt);
    const dEnd = endOfDay(demand.deadline ?? addDays(dStart, 7));

    const effectiveStart = dStart < range.start ? range.start : dStart;
    const effectiveEnd = dEnd > range.end ? range.end : dEnd;

    const leftPercent =
      (differenceInDays(effectiveStart, range.start) / range.totalDays) * 100;
    const widthPercent =
      ((differenceInDays(effectiveEnd, effectiveStart) + 1) / range.totalDays) * 100;

    // Altura e posicionamento vertical baseado nos slots
    const height = 100 / (demand.totalSlots || 1);
    const top = (demand.slotIndex || 0) * height;

    return {
      style: {
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        top: `${top}%`,
        height: `${height}%`,
        paddingTop: demand.totalSlots > 1 ? '2px' : '0',
        paddingBottom: demand.totalSlots > 1 ? '2px' : '0',
      },
      colorClass: PROJECT_COLORS[demand.projectType as keyof typeof PROJECT_COLORS] || PROJECT_COLORS.Interno,
    };
  };

  const navigateTime = (direction: 'next' | 'prev' | 'today') => {
    if (direction === 'today') {
      setReferenceDate(new Date());
      return;
    }
    const delta = direction === 'next' ? 1 : -1;
    setReferenceDate((prev) => {
      if (viewMode === 'ano') return addMonths(prev, delta * 12);
      if (viewMode === 'semana') return addWeeks(prev, delta * 4);
      return addDays(prev, delta * 7);
    });
  };

  return (
    <div className="flex flex-col h-full text-white font-sans px-4 md:px-8">
      <PageHeader
        title="Linha do Tempo"
        description="Gestão estratégica e acompanhamento temporal de todas as frentes de trabalho em tempo real."
      />

      {/* Control Bar */}
      <div className="py-4 flex flex-col lg:flex-row lg:items-center justify-between bg-zinc-950/40 border border-white/[0.03] rounded-[24px] px-6 mb-6 backdrop-blur-md gap-6 lg:gap-0">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#0baf4d] shadow-[0_0_10px_rgba(11,175,77,0.5)]" />
            <span className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Serviços Empresa</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#ffc20e] shadow-[0_0_10px_rgba(255,194,14,0.5)]" />
            <span className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Projetos Internos</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-1 md:gap-2 p-1.5 bg-zinc-900/80 rounded-2xl border border-white/5 w-full sm:w-auto justify-center">
            {(['dia', 'semana', 'ano'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all',
                  viewMode === mode ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'
                )}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
            <button onClick={() => navigateTime('prev')} className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/20 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => navigateTime('today')} className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/20 text-[10px] font-black uppercase tracking-[0.2em] transition-all">
              Hoje
            </button>
            <button onClick={() => navigateTime('next')} className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/20 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto overflow-y-auto no-scrollbar">
          <div className="min-w-fit w-full flex flex-col">

            {/* Header */}
            <div className="flex sticky top-0 z-40 bg-bg-section">
              <div className="w-[160px] md:w-[320px] min-w-[160px] md:min-w-[320px] px-4 md:px-8 py-6 border-r border-b border-white/[0.03] flex items-end sticky left-0 bg-bg-section z-50">
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.3em] text-zinc-600 truncate">
                  Assessor
                </span>
              </div>
              <div
                className="flex-1 grid border-b border-white/[0.03]"
                style={{
                  gridTemplateColumns: `repeat(${columns.length}, minmax(${viewMode === 'ano' ? '300px' : '120px'}, 1fr))`
                }}
              >
                {columns.map((col, i) => {
                  const isToday = isSameDay(col.date, new Date()) && viewMode === 'dia';
                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex flex-col items-center justify-center py-5 border-r border-white/[0.03] last:border-r-0',
                        isToday ? 'bg-secondary/10' : 'hover:bg-white/[0.01]'
                      )}
                    >
                      <span className={cn(
                        'text-[10px] font-black uppercase tracking-[0.2em] mb-1',
                        isToday ? 'text-secondary' : 'text-zinc-600'
                      )}>
                        {col.label}
                      </span>
                      <span className={cn(
                        'text-lg font-black tracking-tighter',
                        isToday ? 'text-white' : 'text-zinc-400'
                      )}>
                        {col.subLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rows */}
            <div className="flex-1 relative">
              {userRows.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-700">
                  <Calendar className="w-8 h-8 mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest">
                    Nenhuma demanda ativa com prazo definido
                  </p>
                </div>
              ) : (
                userRows.map((row) => (
                  <div
                    key={row.user.uid}
                    className="flex min-h-[110px] border-b border-white/[0.03] group hover:bg-white/[0.01] transition-all"
                  >
                    <div className="w-[160px] md:w-[320px] min-w-[160px] md:min-w-[320px] px-4 md:px-8 py-4 flex items-center gap-3 md:gap-5 border-r border-white/[0.03] sticky left-0 bg-bg-section z-30">
                      <Avatar src={row.user.photoURL} alt={row.user.name} size="sm" className="ring-2 ring-zinc-800 shadow-xl" />
                      <div className="min-w-0">
                        <h3 className="text-xs md:text-sm font-black text-white truncate tracking-tight">{row.user.name}</h3>
                        <p className="text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1 truncate">
                          {row.user.area || 'Técnico'}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 relative py-6">
                      <div className="absolute inset-0 flex">
                        {columns.map((_, i) => (
                          <div key={i} className="flex-1 border-r border-white/[0.02] last:border-r-0" />
                        ))}
                      </div>

                      <div className="relative h-full flex flex-col justify-center gap-3">
                        {row.demands.map((demand) => {
                          const { style, colorClass } = getBarProps(demand);
                          const startDate = demand.startDate ?? demand.createdAt;
                          const endDate = demand.deadline ?? addDays(startDate, 7);

                          return (
                            <div
                              key={demand.id}
                              style={style}
                              className={cn(
                                'absolute h-9 rounded-xl flex items-center px-4 font-black text-[10px] uppercase tracking-wider',
                                'transition-all hover:scale-[1.02] active:scale-95 cursor-pointer z-10',
                                'truncate group/bar',
                                colorClass
                              )}
                              onClick={() => {
                                if (demand.sprintId) {
                                  useUIStore.getState().openSprintDetalhes(demand.sprintId);
                                } else {
                                  openDemanda(demand.id, 'view');
                                }
                              }}
                            >
                              <span className="truncate w-full">{demand.title}</span>

                              <div className="absolute top-[120%] left-0 opacity-0 group-hover/bar:opacity-100 transition-all z-50 bg-zinc-900 border border-white/10 p-3 rounded-2xl shadow-2xl pointer-events-none scale-90 group-hover/bar:scale-100 min-w-[200px]">
                                <p className="text-xs font-black text-white mb-1">{demand.title}</p>
                                <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                                  <Calendar className="w-3 h-3" />
                                  {format(startDate, 'dd MMM', { locale: ptBR })} —{' '}
                                  {format(endDate, 'dd MMM', { locale: ptBR })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {(viewMode === 'dia' || viewMode === 'semana') &&
                isWithinInterval(new Date(), { start: range.start, end: range.end }) && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-secondary shadow-[0_0_15px_rgba(11,175,77,0.5)] z-35 pointer-events-none"
                    style={{
                      left: `calc(${typeof window !== 'undefined' && window.innerWidth < 768 ? '160px' : '320px'} + ${((differenceInDays(new Date(), range.start) + 0.5) / range.totalDays) * 100}%)`,
                    }}
                  >
                    <div className="absolute top-0 -translate-x-1/2 bg-secondary text-black text-[8px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      HOJE
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      <button
        className="fixed bottom-10 right-10 w-14 h-14 bg-secondary text-white rounded-2xl hidden md:flex items-center justify-center shadow-[0_20px_40px_rgba(11,175,77,0.3)] hover:scale-110 active:scale-95 transition-all z-[100]"
        onClick={() => router.push('/kanban')}
      >
        <LayoutGrid className="w-6 h-6" />
      </button>
    </div>
  );
}