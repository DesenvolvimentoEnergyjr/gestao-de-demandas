'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';

interface TimelineViewProps {
  demands: Demand[];
  users: User[];
}

type ViewMode = 'dia' | 'semana' | 'ano';

export function TimelineView({ demands, users }: TimelineViewProps) {
  const router = useRouter();
  const { searchQuery } = useDemandStore();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('semana');
  const [referenceDate, setReferenceDate] = useState(new Date());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Timeline Range Logic
  const range = useMemo(() => {
    if (viewMode === 'dia') {
      const start = startOfDay(referenceDate);
      const end = addDays(start, 13); // 14 days
      return { start, end, totalDays: 14 };
    } else if (viewMode === 'semana') {
      const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
      const end = addWeeks(start, 8); // 8 weeks
      return { start, end, totalDays: 56 };
    } else {
      const start = startOfYear(referenceDate);
      const end = endOfYear(referenceDate);
      return { start, end, totalDays: differenceInDays(end, start) + 1 };
    }
  }, [viewMode, referenceDate]);

  // Headers Generation
  const columns = useMemo(() => {
    if (viewMode === 'dia') {
      return Array.from({ length: 14 }, (_, i) => ({
        date: addDays(range.start, i),
        label: format(addDays(range.start, i), 'eee', { locale: ptBR }),
        subLabel: format(addDays(range.start, i), 'dd'),
      }));
    } else if (viewMode === 'semana') {
      return Array.from({ length: 8 }, (_, i) => ({
        date: addWeeks(range.start, i),
        label: `Semana ${i + 1}`,
        subLabel: format(addWeeks(range.start, i), 'dd/MM'),
      }));
    } else {
      return eachMonthOfInterval({ start: range.start, end: range.end }).map(month => ({
        date: month,
        label: format(month, 'MMMM', { locale: ptBR }),
        subLabel: format(month, 'yyyy'),
      }));
    }
  }, [viewMode, range]);

  // Grouping Logic
  const userRows = useMemo(() => {
    if (!mounted) return [];

    const filteredDemands = demands.filter(d =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return users.map(user => {
      const userDemands = filteredDemands.filter(d => d.assignees.includes(user.uid));
      return {
        user,
        demands: userDemands.filter(d => {
          const dStart = d.startDate || d.createdAt;
          const dEnd = d.deadline || addDays(dStart, 7);
          return (dStart <= range.end && dEnd >= range.start);
        })
      };
    }).filter(row => row.demands.length > 0 || row.user.role === 'assessor');
  }, [users, demands, range, searchQuery, mounted]);

  // Bar Position Helper
  const getBarStyles = (demand: Demand) => {
    const dStart = startOfDay(demand.startDate || demand.createdAt);
    const dEnd = demand.deadline ? endOfDay(demand.deadline) : endOfDay(addDays(dStart, 7));

    // Clamp dates to range
    const effectiveStart = dStart < range.start ? range.start : dStart;
    const effectiveEnd = dEnd > range.end ? range.end : dEnd;

    const leftPercent = (differenceInDays(effectiveStart, range.start) / range.totalDays) * 100;
    const widthPercent = (differenceInDays(effectiveEnd, effectiveStart) + 1) / range.totalDays * 100;

    // Coloring Logic
    const isInterno = demand.tags.some(t => t.toLowerCase().includes('interno'));
    const isExterno = demand.tags.some(t => t.toLowerCase().includes('externo')) || !isInterno;

    const colors = isExterno
      ? 'bg-[#0baf4d] text-white shadow-[0_0_20px_-5px_rgba(11,175,77,0.4)]'
      : 'bg-[#ffc20e] text-black shadow-[0_0_20px_-5px_rgba(255,194,14,0.4)]';

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      className: cn("absolute h-9 rounded-xl flex items-center px-4 font-black text-[10px] uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 cursor-pointer z-10 border border-white/10 truncate", colors)
    };
  };

  const navigateTime = (direction: 'next' | 'prev' | 'today') => {
    if (direction === 'today') {
      setReferenceDate(new Date());
    } else if (viewMode === 'ano') {
      setReferenceDate(prev => direction === 'next' ? addMonths(prev, 12) : addMonths(prev, -12));
    } else if (viewMode === 'semana') {
      setReferenceDate(prev => direction === 'next' ? addWeeks(prev, 4) : addWeeks(prev, -4));
    } else {
      setReferenceDate(prev => direction === 'next' ? addDays(prev, 7) : addDays(prev, -7));
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white font-sans selection:bg-secondary/30 px-8">

      {/* Header */}
      <PageHeader 
        title="Linha do Tempo" 
        description="Gestão estratégica e acompanhamento temporal de todas as frentes de trabalho em tempo real."
      />

      {/* Control & Legend Bar */}
      <div className="py-4 flex items-center justify-between bg-zinc-950/40 border border-white/[0.03] rounded-[24px] px-6 mb-6 backdrop-blur-md">
        <div className="flex items-center gap-8">
          {/* Legend */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0baf4d] shadow-[0_0_10px_rgba(11,175,77,0.5)]" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Serviços Empresa</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffc20e] shadow-[0_0_10px_rgba(255,194,14,0.5)]" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Projetos Internos</span>
            </div>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2 p-1.5 bg-zinc-900/80 rounded-2xl border border-white/5 shadow-inner">
          <button
            onClick={() => setViewMode('dia')}
            className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", viewMode === 'dia' ? "bg-white text-black shadow-xl" : "text-zinc-500 hover:text-white")}
          >Dia</button>
          <button
            onClick={() => setViewMode('semana')}
            className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", viewMode === 'semana' ? "bg-white text-black shadow-xl" : "text-zinc-500 hover:text-white")}
          >Semana</button>
          <button
            onClick={() => setViewMode('ano')}
            className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", viewMode === 'ano' ? "bg-white text-black shadow-xl" : "text-zinc-500 hover:text-white")}
          >Ano</button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigateTime('prev')} className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/20 transition-all"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => navigateTime('today')} className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/20 text-[10px] font-black uppercase tracking-[0.2em] transition-all">Hoje</button>
          <button onClick={() => navigateTime('next')} className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/20 transition-all"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-x-auto overflow-y-auto no-scrollbar">
          <div className="min-w-fit w-full flex flex-col">

            {/* Grid Header */}
            <div className="flex sticky top-0 z-[40] bg-[#0a0a0a]">
              <div className="w-[320px] min-w-[320px] px-8 py-6 border-r border-b border-white/[0.03] flex items-end">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Assessor Responsável</span>
              </div>
              <div
                className="flex-1 grid border-b border-white/[0.03]"
                style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(120px, 1fr))` }}
              >
                {columns.map((col, i) => {
                  const isToday = isSameDay(col.date, new Date()) && viewMode === 'dia';
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex flex-col items-center justify-center py-5 border-r border-white/[0.03] last:border-r-0 transition-all",
                        isToday ? "bg-secondary/10" : "hover:bg-white/[0.01]"
                      )}
                    >
                      <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1", isToday ? "text-secondary" : "text-zinc-600")}>
                        {col.label}
                      </span>
                      <span className={cn("text-lg font-black tracking-tighter", isToday ? "text-white" : "text-zinc-400")}>
                        {col.subLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 relative">
              {userRows.map((row) => (
                <div key={row.user.uid} className="flex min-h-[110px] border-b border-white/[0.03] group hover:bg-white/[0.01] transition-all">

                  {/* Sticky User Profile */}
                  <div className="w-[320px] min-w-[320px] px-8 py-4 flex items-center gap-5 border-r border-white/[0.03] sticky left-0 bg-[#0a0a0a] z-30 transition-transform group-hover:translate-x-1">
                    <Avatar src={row.user.photoURL} alt={row.user.name} size="md" className="ring-2 ring-zinc-800 shadow-xl" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-white truncate tracking-tight">{row.user.name}</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
                        {row.user.role === 'assessor' ? (row.user.area || 'Setor Técnico') : row.user.role}
                      </p>
                    </div>
                  </div>

                  {/* Task Bar Container */}
                  <div className="flex-1 relative p-6">
                    {/* Visual Vertical Grid Lines */}
                    <div className="absolute inset-0 flex">
                      {columns.map((_, i) => (
                        <div key={i} className="flex-1 border-r border-white/[0.02] last:border-r-0" />
                      ))}
                    </div>

                    <div className="relative h-full flex flex-col justify-center gap-3">
                      {row.demands.map((demand) => (
                        <div
                          key={demand.id}
                          className="relative h-9 group/bar"
                          style={{
                            ...getBarStyles(demand),
                            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                          onClick={() => demand.sprintId && router.push(`/sprints?id=${demand.sprintId}`)}
                        >
                          <span className="truncate w-full">{demand.title}</span>

                          {/* Tooltip or hover detail */}
                          <div className="absolute top-[120%] left-0 opacity-0 group-hover/bar:opacity-100 transition-all z-50 bg-zinc-900 border border-white/10 p-3 rounded-2xl shadow-2xl pointer-events-none scale-90 group-hover/bar:scale-100 min-w-[200px]">
                            <p className="text-xs font-black text-white mb-1">{demand.title}</p>
                            <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                              <Calendar className="w-3 h-3" />
                              {format(demand.startDate || demand.createdAt, 'dd MMM')} — {format(demand.deadline || addDays(demand.createdAt, 7), 'dd MMM')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Today line marker */}
              {(viewMode === 'dia' || viewMode === 'semana') && isWithinInterval(new Date(), { start: range.start, end: range.end }) && (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-secondary shadow-[0_0_15px_rgba(11,175,77,0.5)] z-[35] pointer-events-none"
                  style={{
                    left: `calc(320px + ${(differenceInDays(new Date(), range.start) / range.totalDays) * 100}%)`
                  }}
                >
                  <div className="absolute top-0 -translate-x-1/2 bg-secondary text-black text-[8px] font-black px-1.5 py-0.5 rounded-full">HOJE</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Floating Button */}
      <button
        className="fixed bottom-10 right-10 w-14 h-14 bg-secondary text-white rounded-2xl flex items-center justify-center shadow-[0_20px_40px_rgba(11,175,77,0.3)] hover:scale-110 active:scale-95 transition-all z-[100]"
        onClick={() => router.push('/kanban')}
      >
        <LayoutGrid className="w-6 h-6" />
      </button>

    </div>
  );
}
