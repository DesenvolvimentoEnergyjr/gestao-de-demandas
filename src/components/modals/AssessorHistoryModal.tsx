'use client';

import React from 'react';
import { X, Calendar, ClipboardList, CheckCircle2, Clock, Zap, AlertCircle } from 'lucide-react';
import { User, Demand } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AssessorHistoryModalProps {
  user: User;
  demands: Demand[];
  onClose: () => void;
}

export function AssessorHistoryModal({ user, demands, onClose }: AssessorHistoryModalProps) {
  const sortedDemands = [...demands].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const completedDemands = demands.filter(d => d.status === 'concluido');

  // 1. Taxa de Entrega no Prazo (%)
  const onTimeDemands = completedDemands.filter(d => !d.deadline || new Date(d.updatedAt) <= new Date(d.deadline));
  const onTimeRate = completedDemands.length > 0 ? Math.round((onTimeDemands.length / completedDemands.length) * 100) : 0;

  // 2. Tempo Médio de Ciclo (dias)
  const cycleTimes = completedDemands.map(d => differenceInDays(new Date(d.updatedAt), new Date(d.createdAt)));
  const avgCycleTime = cycleTimes.length > 0 ? Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length) : 0;

  // 3. Teias de Aranha (Demandas Estagnadas)
  const activeDemands = demands.filter(d => d.status === 'em_progresso' || d.status === 'em_revisao');
  const stagnantCount = activeDemands.filter(d => differenceInDays(new Date(), new Date(d.updatedAt)) >= 5).length;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4">
      <div
        className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl bg-bg-section border-gradient rounded-2xl sm:rounded-[2rem] md:rounded-[40px] shadow-[0_0_100px_-20px_rgba(11,175,77,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">

        {/* Header Section */}
        <div className="p-4 sm:p-5 md:p-10 pb-5 sm:pb-6 border-b border-white/[0.03] relative">
          {/* Close button — always top-right */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 text-zinc-500 hover:text-white hover:bg-white/5 transition-all z-10"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Profile row — always horizontal */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-6 pr-10 sm:pr-12 md:pr-16">
            <Avatar src={user.photoURL} alt={user.name} size="lg" className="w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 border-2 sm:border-4 border-white/5 shadow-2xl shrink-0" />
            <div className="min-w-0">
              <h2 className="text-xl md:text-3xl font-black text-white tracking-tight leading-tight truncate">{user.name}</h2>
              <p className="text-[10px] md:text-sm font-black text-secondary uppercase tracking-[0.15em] md:tracking-[0.2em] mt-1 md:mt-3">{user.title || user.role}</p>
              <div className="flex items-center gap-2 mt-2 md:mt-4">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                <span className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">{user.email}</span>
                {user.area && (
                  <>
                    <span className="text-zinc-800 mx-1">•</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-secondary uppercase tracking-widest truncate">{user.area}</span>
                  </>
                )}
              </div>
              {user.history && (
                <div className="mt-3 md:mt-4 bg-secondary/5 border border-secondary/10 rounded-xl px-3 py-2 md:px-4 md:py-2.5">
                  <p className="text-[8px] md:text-[9px] font-black text-secondary uppercase tracking-[0.2em] mb-1">Trajetória</p>
                  <p className="text-[10px] md:text-xs text-zinc-400 font-medium leading-relaxed">
                    {user.history}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Key Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-6 mt-6 md:mt-10">
            {/* Stat 1: No Prazo */}
            <div className="bg-zinc-900/30 rounded-2xl md:rounded-3xl p-3 md:p-5 border border-white/[0.02] flex items-center gap-2 md:gap-4 group hover:bg-zinc-900/50 transition-all">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-[#0baf4d]/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-[#0baf4d]" />
              </div>
              <div className="min-w-0">
                <div className="text-base md:text-xl font-black text-white">{onTimeRate}%</div>
                <div className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest truncate">No Prazo</div>
              </div>
            </div>

            {/* Stat 2: Cycle Time */}
            <div className="bg-zinc-900/30 rounded-2xl md:rounded-3xl p-3 md:p-5 border border-white/[0.02] flex items-center gap-2 md:gap-4 group hover:bg-zinc-900/50 transition-all">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
              </div>
              <div className="min-w-0">
                <div className="text-base md:text-xl font-black text-white">{avgCycleTime}d</div>
                <div className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest truncate">Ciclo Médio</div>
              </div>
            </div>

            {/* Stat 3: Teias de Aranha */}
            <div className="bg-zinc-900/30 rounded-2xl md:rounded-3xl p-3 md:p-5 border border-white/[0.02] flex items-center gap-2 md:gap-4 group hover:bg-zinc-900/50 transition-all">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
              </div>
              <div className="min-w-0 flex items-center gap-3">
                <div>
                  <div className="text-base md:text-xl font-black text-white">{stagnantCount}</div>
                  <div className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest truncate">Teias Atuais</div>
                </div>
                {stagnantCount > 0 && <span className="text-xl md:text-2xl animate-pulse">🕸️</span>}
              </div>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 md:p-10 pt-6 md:pt-8 space-y-3 md:space-y-4">
          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 md:mb-6">Log de Atividades 2026</h3>

          {sortedDemands.length === 0 ? (
            <div className="text-center py-16 md:py-20 bg-zinc-950/20 rounded-2xl md:rounded-[32px] border border-dashed border-white/5">
              <ClipboardList className="w-8 h-8 md:w-10 md:h-10 text-zinc-800 mx-auto mb-3 md:mb-4" />
              <p className="text-xs md:text-sm font-bold text-zinc-600 uppercase tracking-wider">Nenhuma demanda registrada ainda</p>
            </div>
          ) : (
            sortedDemands.map((demand) => (
              <div
                key={demand.id}
                className="group bg-zinc-950/40 hover:bg-zinc-900/40 p-4 md:p-5 rounded-2xl md:rounded-[24px] border border-white/[0.02] hover:border-white/[0.05] transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  <div className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0",
                    demand.status === 'concluido' ? "bg-secondary/10 text-secondary" : "bg-zinc-800 text-zinc-500"
                  )}>
                    {demand.status === 'concluido' ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : <Clock className="w-4 h-4 md:w-5 md:h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs md:text-sm font-black text-white truncate tracking-tight mb-1">{demand.title}</h4>
                    <div className="flex items-center gap-2 md:gap-3 text-[8px] md:text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span className="truncate">{format(demand.createdAt, 'dd MMM yyyy', { locale: ptBR })}</span>
                      <span className="shrink-0">{'\u2022'}</span>
                      <span className={cn(
                        "shrink-0",
                        demand.priority === 'urgente' ? "text-red-500" :
                          demand.priority === 'alta' ? "text-orange-500" :
                            "text-zinc-600"
                      )}>{demand.priority}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={demand.status} className="shrink-0 text-[8px] md:text-[9px]">{demand.status.replace('_', ' ')}</Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
