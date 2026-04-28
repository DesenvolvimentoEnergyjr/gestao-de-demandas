'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';

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
  const { user: currentUser } = useAuthStore();
  const { openDemanda } = useUIStore();
  const { searchQuery } = useDemandStore();
  const [viewMode, setViewMode] = useState<ViewMode>('semana');
  const [density, setDensity] = useState<'standard' | 'compact'>('standard');
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [memberFilter, setMemberFilter] = useState<'todos' | 'diretoria' | 'assessores' | 'comercial' | 'prodev' | 'rh'>('todos');
  const [isFirstMount, setIsFirstMount] = useState(true);

  useEffect(() => {
    setIsFirstMount(false);
  }, []);

  const navigateTime = useCallback((direction: 'next' | 'prev' | 'today') => {
    if (direction === 'today') {
      setReferenceDate(new Date());
      return;
    }
    const delta = direction === 'next' ? 1 : -1;
    setReferenceDate((prev) => {
      let nextDate: Date;
      if (viewMode === 'ano') nextDate = addMonths(prev, delta * 12);
      else if (viewMode === 'semana') nextDate = addWeeks(prev, delta * 4);
      else nextDate = addDays(prev, delta * 7);

      // Impedir ultrapassar o ano atual
      const currentYear = new Date().getFullYear();
      if (nextDate.getFullYear() > currentYear) {
        return new Date(currentYear, 11, 31); // Último dia do ano
      }
      if (nextDate.getFullYear() < currentYear) {
        return new Date(currentYear, 0, 1); // Primeiro dia do ano
      }
      return nextDate;
    });
  }, [viewMode]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evitar atalhos se o usuário estiver digitando em um input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'c':
          setDensity(prev => prev === 'standard' ? 'compact' : 'standard');
          break;
        case '+':
        case '=':
          setZoomLevel(prev => Math.min(prev + 0.2, 3));
          break;
        case '-':
        case '_':
          setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
          break;
        case '0':
          setZoomLevel(1);
          break;
        case 'arrowleft':
          navigateTime('prev');
          break;
        case 'arrowright':
          navigateTime('next');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, navigateTime]);

  const range = useMemo(() => {
    if (viewMode === 'dia') {
      const start = startOfDay(referenceDate);
      return { start, end: addDays(start, 13), totalDays: 14 };
    }
    if (viewMode === 'semana') {
      const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
      const end = addWeeks(start, 7);
      return { start, end, totalDays: 56 };
    }
    const start = startOfYear(referenceDate);
    const end = endOfYear(referenceDate);
    return { start, end, totalDays: differenceInDays(end, start) + 1 };
  }, [viewMode, referenceDate]);

  const columns = useMemo(() => {
    const yearEnd = endOfYear(referenceDate);

    if (viewMode === 'dia') {
      return Array.from({ length: 14 }, (_, i) => {
        const date = addDays(range.start, i);
        if (date > yearEnd) return null;
        return {
          date,
          label: format(date, 'eee', { locale: ptBR }),
          subLabel: format(date, 'dd'),
        };
      });
    }
    if (viewMode === 'semana') {
      return Array.from({ length: 8 }, (_, i) => {
        const date = addWeeks(range.start, i);
        if (date > yearEnd) return null;
        return {
          date,
          label: format(date, 'MMMM', { locale: ptBR }),
          subLabel: format(date, 'dd/MM'),
        };
      });
    }
    return eachMonthOfInterval({ start: range.start, end: range.end }).map((month) => {
      if (month > yearEnd) return null;
      return {
        date: month,
        label: format(month, 'MMMM', { locale: ptBR }),
        subLabel: format(month, 'yyyy'),
      };
    });
  }, [viewMode, range, referenceDate]);

  const userRows = useMemo(() => {
    let filteredUsers = users.filter(u => u.status !== 'desligado' && u.status !== 'pos_junior');

    // Aplicação do Filtro de Membros com Palavras-Chave
    if (memberFilter === 'diretoria') {
      filteredUsers = filteredUsers.filter(u => u.role === 'diretor');
    } else if (memberFilter === 'assessores') {
      filteredUsers = filteredUsers.filter(u => u.role === 'assessor');
    } else if (memberFilter === 'comercial') {
      const keywords = ['COMERCIAL', 'VENDAS', 'MARKETING'];
      filteredUsers = filteredUsers.filter(u =>
        keywords.some(k => u.area?.toUpperCase().includes(k))
      );
    } else if (memberFilter === 'prodev') {
      const keywords = ['DESENVOLVIMENTO', 'PROJETOS', 'DEV', 'PRODEV'];
      filteredUsers = filteredUsers.filter(u =>
        keywords.some(k => u.area?.toUpperCase().includes(k))
      );
    } else if (memberFilter === 'rh') {
      filteredUsers = filteredUsers.filter(u => u.area?.toUpperCase().includes('RECURSOS HUMANOS'));
    }

    // Ordenação Alfabética
    filteredUsers.sort((a, b) => a.name.localeCompare(b.name));

    const filteredDemands = demands.filter((d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      isDemandVisibleToUser(d, currentUser, users)
    );

    return filteredUsers.map((user) => {
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
  }, [users, demands, range, searchQuery, currentUser, memberFilter]);

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

  return (
    <div className="flex flex-col min-h-full text-white font-sans px-4 md:px-8">
      <PageHeader
        title="Linha do Tempo"
        description="Gestão estratégica e acompanhamento temporal de todas as frentes de trabalho em tempo real."
      />

      {/* Control Bar */}
      <motion.div
        // initial={{ opacity: 0, y: 20 }}
        // animate={{ opacity: 1, y: 0 }}
        // transition={{ duration: 0.5, ease: 'easeOut' }}
        className="py-4 flex flex-col lg:flex-row lg:items-center justify-between bg-zinc-950/40 border border-white/[0.03] rounded-[24px] px-6 mb-4 backdrop-blur-md gap-6 lg:gap-0"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2.5">
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#0baf4d] shadow-[0_0_10px_rgba(11,175,77,0.5)]"
            />
            <span className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Serviços Empresa</span>
          </div>
          <div className="flex items-center gap-2.5">
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#ffc20e] shadow-[0_0_10px_rgba(255,194,14,0.5)]"
            />
            <span className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Projetos Internos</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-1 md:gap-2 p-1.5 bg-zinc-900/80 rounded-2xl border border-white/5 w-full sm:w-auto justify-center relative">
            {(['dia', 'semana', 'ano'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'relative flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors z-10',
                  viewMode === mode ? 'text-black' : 'text-zinc-500 hover:text-white'
                )}
              >
                {viewMode === mode && (
                  <motion.div
                    layoutId="viewModeIndicator"
                    className="absolute inset-0 bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.15)] -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                {mode === 'ano' ? 'Mês' : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
            {/* Density Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDensity(prev => prev === 'standard' ? 'compact' : 'standard')}
              className={cn(
                "p-2.5 rounded-xl border transition-all flex items-center gap-2",
                density === 'compact' ? "bg-white text-black border-white" : "bg-zinc-900 border-white/5 text-zinc-500 hover:text-white"
              )}
              title="Alternar Densidade (Atalho: C)"
            >
              <motion.div animate={{ rotate: density === 'compact' ? 45 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <LayoutGrid className="w-4 h-4" />
              </motion.div>
              <span className="text-[10px] font-black uppercase hidden sm:inline">
                {density === 'compact' ? 'Compacto' : 'Padrão'}
              </span>
            </motion.button>

            <div className="h-8 w-px bg-white/5 mx-1 hidden sm:block" />

            {/* Navigation < Hoje > */}
            <motion.button
              whileHover={{ scale: 1.12, x: -2 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => navigateTime('prev')}
              className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/20 hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(11,175,77,0.2)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateTime('today')}
              className="relative flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-zinc-900 border border-white/5 hover:border-secondary/30 text-[10px] font-black uppercase tracking-[0.2em] transition-colors overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-secondary"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                Hoje
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-secondary/5 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.12, x: 2 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => navigateTime('next')}
              className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/20 hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Member Filters */}
      <div className="flex flex-col gap-3 mb-6 px-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] ml-1">Filtros de Membros</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={userRows.length}
              initial={isFirstMount ? false : { opacity: 0, y: 10, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -10, rotateX: 90 }}
              transition={{ duration: 0.3 }}
              className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest bg-zinc-900/50 px-2.5 py-1 rounded-full border border-white/5"
            >
              {userRows.length} Membros Visíveis
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 -mx-2 px-2">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'diretoria', label: 'Diretoria' },
            { id: 'assessores', label: 'Assessores' },
            { id: 'comercial', label: 'Comercial' },
            { id: 'prodev', label: 'PRODEV' },
            { id: 'rh', label: 'Recursos Humanos' },
          ].map((filter) => (
            <motion.button
              key={filter.id}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMemberFilter(filter.id as typeof memberFilter)}
              className={cn(
                "relative flex-none px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300",
                memberFilter === filter.id
                  ? "border-secondary bg-secondary/10 text-secondary shadow-[0_0_15px_rgba(11,175,77,0.15)]"
                  : "bg-zinc-950/40 border-white/[0.03] text-zinc-500 hover:text-white hover:border-white/10"
              )}
            >
              {filter.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="flex-1 flex flex-col">
        <div className="overflow-x-auto no-scrollbar">
          <div className="min-w-fit w-full flex flex-col">

            {/* Header */}
            <div className="flex sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md">
              <div
                className={cn(
                  "px-4 md:px-8 border-r border-b border-white/10 flex items-center justify-center sticky left-0 bg-bg-section z-50 transition-all",
                  density === 'compact' ? "w-[120px] md:w-[240px] min-w-[120px] md:min-w-[240px] py-3" : "w-[160px] md:w-[320px] min-w-[160px] md:min-w-[320px] py-6"
                )}
              >
                <div className="flex flex-col items-center">
                  <span className="text-xs md:text-base font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-white">
                    Membros
                  </span>
                </div>
              </div>
              <div
                key={`grid-${viewMode}-${referenceDate.toISOString()}`}
                className="flex-1 grid border-b border-white/10 animate-in fade-in duration-300"
                style={{
                  gridTemplateColumns: `repeat(${columns.length}, minmax(${viewMode === 'ano' ? (300 * zoomLevel) : (120 * zoomLevel)
                    }px, 1fr))`
                }}
              >
                {columns.map((col, i) => {
                  if (!col) {
                    return (
                      <div key={i} className="flex flex-col items-center justify-center py-5 border-r border-white/5 last:border-r-0 bg-white/[0.01]">
                        <span className="text-[10px] font-black uppercase text-zinc-800 tracking-[0.2em] mb-1">
                          Ano Que Vem
                        </span>
                      </div>
                    );
                  }

                  const isToday = isSameDay(col.date, new Date()) && viewMode === 'dia';
                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex flex-col items-center justify-center py-5 border-r border-white/5 last:border-r-0 transition-colors',
                        isToday ? 'bg-secondary/10' : 'hover:bg-white/[0.02]'
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
                <div key={`rows-${memberFilter}`} className="animate-in fade-in duration-300">
                  {userRows.map((row) => (
                    <div
                      key={row.user.uid}
                      className={cn(
                        "flex border-b border-white/10 group hover:bg-white/[0.02] transition-colors",
                        density === 'compact' ? "min-h-[60px]" : "min-h-[110px]"
                      )}
                    >
                      <div
                        className={cn(
                          "px-4 md:px-8 flex items-center gap-3 md:gap-5 border-r border-white/10 sticky left-0 bg-bg-section z-30 transition-all",
                          density === 'compact' ? "w-[120px] md:w-[240px] min-w-[120px] md:min-w-[240px] py-2" : "w-[160px] md:w-[320px] min-w-[160px] md:min-w-[320px] py-4"
                        )}
                      >
                        <Avatar
                          src={row.user.photoURL}
                          alt={row.user.name}
                          size={density === 'compact' ? "xs" : "sm"}
                          className="ring-2 ring-zinc-800 shadow-xl"
                        />
                        <div className="min-w-0">
                          <h3 className={cn(
                            "font-black text-white truncate tracking-tight transition-all",
                            density === 'compact' ? "text-[10px] md:text-xs" : "text-xs md:text-sm"
                          )}>
                            {row.user.name}
                          </h3>
                          <p className={cn(
                            "text-zinc-500 font-bold uppercase tracking-wider truncate",
                            density === 'compact' ? "text-[7px] md:text-[8px] mt-0.5" : "text-[8px] md:text-[10px] mt-1"
                          )}>
                            {row.user.area || 'Técnico'}
                          </p>
                        </div>
                      </div>

                      <div className={cn(
                        "flex-1 relative transition-all",
                        density === 'compact' ? "py-2" : "py-6"
                      )}>
                        <div className="absolute inset-0 flex">
                          {columns.map((col, i) => (
                            <div
                              key={i}
                              className={cn(
                                "flex-1 border-r border-white/5 last:border-r-0",
                                !col && "bg-white/[0.01]"
                              )}
                            />
                          ))}
                        </div>

                        <div className={cn(
                          "relative h-full flex flex-col justify-center",
                          density === 'compact' ? "gap-1" : "gap-3"
                        )}>
                          {row.demands.map((demand) => {
                            const { style, colorClass } = getBarProps(demand);
                            const startDate = demand.startDate ?? demand.createdAt;
                            const endDate = demand.deadline ?? addDays(startDate, 7);

                            return (
                              <motion.div
                                key={demand.id}
                                style={style}
                                initial={false}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                  'absolute rounded-xl flex items-center px-4 font-black uppercase tracking-wider transition-all',
                                  'cursor-pointer z-10 truncate group/bar',
                                  density === 'compact' ? 'h-6 text-[8px]' : 'h-9 text-[10px]',
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
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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

    </div>
  );
}