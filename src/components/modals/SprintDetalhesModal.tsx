'use client';

import React, { useMemo } from 'react';
import { X, Calendar, Target, TrendingUp, Layers, CheckCircle2, Clock } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useSprintStore } from '@/store/useSprintStore';
import { useDemandStore } from '@/store/useDemandStore';
import { formatDate, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/useAuthStore';

export const SprintDetalhesModal = () => {
  const { sprintDetalhesOpen, closeSprintDetalhes, selectedSprintId } = useUIStore();
  const { sprints } = useSprintStore();
  const { demands } = useDemandStore();

  const sprint = useMemo(() =>
    sprints.find(s => s.id === selectedSprintId),
    [sprints, selectedSprintId]);

  const sprintDemands = useMemo(() =>
    demands.filter(d => d.sprintId === selectedSprintId),
    [demands, selectedSprintId]);

  if (!sprintDetalhesOpen || !sprint) return null;

  const progress = (sprint.storyPoints.completed / sprint.storyPoints.total) * 100;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-md animate-in fade-in duration-300"
        onClick={closeSprintDetalhes}
      ></div>

      <div className="relative w-full max-w-4xl bg-[#0f0f0f] border border-white/[0.08] rounded-[40px] shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">

        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-b from-secondary/5 to-transparent pointer-events-none" />

        {/* Content Header */}
        <div className="p-10 pb-6 flex items-start justify-between relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border",
                sprint.status === 'active' ? "bg-secondary/10 text-secondary border-secondary/20" : "bg-zinc-800 text-zinc-500 border-white/5"
              )}>
                {sprint.status === 'active' ? 'Ciclo Ativo' : sprint.status === 'completed' ? 'Concluído' : 'Planejado'}
              </span>
              <span className="text-zinc-600 font-bold text-xs">•</span>
              <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Sprint #{sprint.number}</span>
            </div>
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">{sprint.title}</h2>
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Calendar className="w-4 h-4 text-zinc-600" />
                  <span className="text-xs font-bold">{formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <TrendingUp className="w-4 h-4 text-zinc-600" />
                  <span className="text-xs font-bold">{sprint.storyPoints.total} Pontos Planejados</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={closeSprintDetalhes}
            className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-10 pb-10 space-y-10 no-scrollbar relative z-10">

          {/* Progress Overview Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 bg-white/[0.02] border border-white/5 rounded-[32px] p-8 relative overflow-hidden group">
              <div className="flex justify-between items-end mb-6">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Progresso Geral</h4>
                  <div className="text-3xl font-black text-white">{Math.round(progress)}%</div>
                </div>
                <div className="text-right">
                  <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Status de Entrega</div>
                  <div className="text-sm font-black text-white">{sprint.storyPoints.completed} / {sprint.storyPoints.total} PTS</div>
                </div>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-secondary shadow-[0_0_20px_rgba(11,175,77,0.4)] transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="bg-secondary/5 border border-secondary/10 rounded-[32px] p-8 flex flex-col justify-center">
              <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
                <Target className="w-5 h-5 text-secondary" />
              </div>
              <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">Meta Principal</h4>
              <p className="text-sm font-bold text-zinc-300 leading-relaxed">{sprint.objective}</p>
            </div>
          </div>

          {/* Detailed Content Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-500" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Contexto do Ciclo</h4>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                {sprint.description || "Este ciclo foca na aceleração de entregas críticas e alinhamento estratégico com os objetivos do trimestre."}
              </p>
            </div>

            {/* Metrics */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-zinc-500" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Métricas de Eficiência</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                  <div className="text-xs font-black text-white">{sprintDemands.length}</div>
                  <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Demandas Totais</div>
                </div>
                <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                  <div className="text-xs font-black text-secondary">{sprintDemands.filter(d => d.status === 'concluido').length}</div>
                  <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Concluídas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Demands List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-secondary" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Escopo Detalhado</h4>
              </div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{sprintDemands.length} Itens</span>
            </div>

            <div className="space-y-3">
              {sprintDemands.length > 0 ? (
                sprintDemands.map(demand => (
                  <div
                    key={demand.id}
                    className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        demand.status === 'concluido' ? "bg-secondary" : "bg-zinc-600"
                      )} />
                      <div>
                        <h5 className="text-sm font-black text-white group-hover:text-secondary transition-colors">{demand.title}</h5>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                            <Clock className="w-3 h-3" />
                            {demand.estimatedHours}h Planejadas
                          </div>
                          <span className="text-zinc-800">•</span>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded",
                            demand.priority === 'urgente' ? "text-red-500" : "text-zinc-600"
                          )}>
                            {demand.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex -space-x-2">
                      {/* This would ideally map specific users, using placeholders for now if users aren't loaded in this specific context */}
                      <div className="w-8 h-8 rounded-full border-2 border-[#0f0f0f] bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white">
                        {demand.assignees.length}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center bg-white/[0.01] border border-dashed border-white/5 rounded-[32px]">
                  <Layers className="w-8 h-8 text-zinc-800 mb-3" />
                  <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest">Nenhuma demanda vinculada a este ciclo</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-8 border-t border-white/5 bg-zinc-950/40 backdrop-blur-md flex items-center justify-between relative z-10">
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Energy Júnior • Ecossistema de Produtividade</p>
          <div className="flex items-center gap-4">
            <button
              onClick={closeSprintDetalhes}
              className="px-8 py-3 bg-secondary text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
