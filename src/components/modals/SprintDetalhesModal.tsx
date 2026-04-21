'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Target, TrendingUp, Layers, CheckCircle2, Clock, Pencil, Trash2, Save, RotateCcw } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useSprintStore } from '@/store/useSprintStore';
import { useDemandStore } from '@/store/useDemandStore';
import { formatDate, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { getUsers, updateSprint, deleteSprint } from '@/lib/firestore';
import { useAuthStore } from '@/store/useAuthStore';
import { User, Sprint } from '@/types';
import { differenceInWeeks, addDays } from 'date-fns';
import { Input } from '@/components/ui/Input';

export const SprintDetalhesModal = () => {
  const { sprintDetalhesOpen, closeSprintDetalhes, selectedSprintId } = useUIStore();
  const { sprints, updateSprint: updateStoreSprint, removeSprint } = useSprintStore();
  const { demands } = useDemandStore();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Estado de Edição
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Sprint>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (sprintDetalhesOpen) {
      getUsers(true).then(setUsers);
      setIsEditMode(false);
      setShowDeleteConfirm(false);
    }
  }, [sprintDetalhesOpen]);

  const sprint = useMemo(
    () => sprints.find((s) => s.id === selectedSprintId),
    [sprints, selectedSprintId]
  );

  const sprintDemands = useMemo(
    () => demands.filter((d) => d.sprintId === selectedSprintId),
    [demands, selectedSprintId]
  );

  // Agrupamento por Semana
  const weekGroups = useMemo(() => {
    if (!sprint) return [];

    const start = sprint.startDate;
    const end = sprint.endDate;
    const totalWeeks = Math.max(1, differenceInWeeks(end, start) + 1);

    const groups = Array.from({ length: totalWeeks }, (_, i) => {
      const weekStart = addDays(start, i * 7);
      const weekEnd = addDays(weekStart, 6);

      const demandsInWeek = sprintDemands.filter(d => {
        const dDate = d.deadline || d.startDate || d.createdAt;
        return dDate >= weekStart && dDate <= weekEnd;
      });

      return {
        label: `Semana ${i + 1}`,
        period: `${formatDate(weekStart)} - ${formatDate(weekEnd)}`,
        demands: demandsInWeek
      };
    });

    return groups;
  }, [sprint, sprintDemands]);

  const handleStartEdit = () => {
    if (!sprint) return;
    setEditFormData({
      title: sprint.title,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      objective: sprint.objective,
      description: sprint.description,
      storyPoints: sprint.storyPoints,
      status: sprint.status,
    });
    setIsEditMode(true);
  };

  const handleSave = async () => {
    if (!selectedSprintId || !editFormData) return;
    setLoading(true);
    try {
      await updateSprint(selectedSprintId, editFormData);
      updateStoreSprint(selectedSprintId, editFormData);
      setIsEditMode(false);
    } catch (error) {
      console.error('Erro ao atualizar sprint:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSprintId) return;

    setLoading(true);
    try {
      await deleteSprint(selectedSprintId);
      removeSprint(selectedSprintId);
      closeSprintDetalhes();
    } catch (error) {
      console.error('Erro ao excluir sprint:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!sprintDetalhesOpen || !sprint) return null;

  const progress =
    sprint.storyPoints.total > 0
      ? (sprint.storyPoints.completed / sprint.storyPoints.total) * 100
      : 0;

  const statusLabel =
    sprint.status === 'active'
      ? 'Ciclo Ativo'
      : sprint.status === 'completed'
        ? 'Concluído'
        : 'Planejado';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-md animate-in fade-in duration-300"
        onClick={closeSprintDetalhes}
      />

      <div className="relative w-full max-w-4xl bg-bg-section border border-white/[0.08] rounded-[40px] shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">

        {/* Decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-b from-secondary/5 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="p-10 pb-6 flex items-start justify-between relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border',
                  sprint.status === 'active'
                    ? 'bg-secondary/10 text-secondary border-secondary/20'
                    : 'bg-zinc-800 text-zinc-500 border-white/5'
                )}
              >
                {statusLabel}
              </span>
              <span className="text-zinc-600 font-bold text-xs">•</span>
              <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest">
                Sprint #{sprint.number}
              </span>
            </div>
            <div>
              {isEditMode ? (
                <div className="space-y-4">
                  <Input
                    value={editFormData.title}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="text-4xl font-black text-white bg-white/5 border-white/10 h-auto py-2"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">
                    {sprint.title}
                  </h2>
                  <div className="flex items-center gap-6 mt-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar className="w-4 h-4 text-zinc-600" />
                      <span className="text-xs font-bold">
                        {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <TrendingUp className="w-4 h-4 text-zinc-600" />
                      <span className="text-xs font-bold">
                        {sprint.storyPoints.total} Pontos Planejados
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isEditMode && currentUser?.role === 'diretor' && (
              <>
                <button
                  onClick={handleStartEdit}
                  className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                  title="Editar Ciclo"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="px-4 h-12 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-red-500/20"
                    >
                      {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Confirmar
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 h-12 rounded-2xl bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-zinc-700 transition-all active:scale-95"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-12 h-12 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                    title="Excluir Ciclo"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
            {isEditMode && currentUser?.role === 'diretor' && (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary hover:bg-secondary/20 transition-all active:scale-90"
                  title="Salvar Alterações"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                  title="Cancelar"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={closeSprintDetalhes}
              className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-10 pb-10 space-y-10 no-scrollbar relative z-10">

          {isEditMode && (
            <div className="grid grid-cols-2 gap-6 bg-white/[0.02] border border-white/5 rounded-[32px] p-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                  Início do Ciclo
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={editFormData.startDate ? new Date(editFormData.startDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                    className="bg-zinc-950 border-white/10 h-12 rounded-xl pl-10"
                  />
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                  Previsão de Término
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={editFormData.endDate ? new Date(editFormData.endDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                    className="bg-zinc-950 border-white/10 h-12 rounded-xl pl-10"
                  />
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                </div>
              </div>
            </div>
          )}

          {/* Progress + Objective */}
          <div className={cn(
            "grid gap-6",
            currentUser?.role === 'diretor' ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1"
          )}>
            {currentUser?.role === 'diretor' && (
              <div className="col-span-2 bg-white/[0.02] border border-white/5 rounded-[32px] p-8">
                <div className="flex justify-between items-end mb-6">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">
                      Progresso Geral
                    </h4>
                    <div className="text-3xl font-black text-white">{Math.round(progress)}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                      Status de Entrega
                    </div>
                    <div className="text-sm font-black text-white">
                      {sprint.storyPoints.completed} / {sprint.storyPoints.total} PTS
                    </div>
                  </div>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-secondary shadow-[0_0_20px_rgba(11,175,77,0.4)] transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className={cn(
              "bg-secondary/5 border border-secondary/10 rounded-[32px] p-8 flex flex-col justify-center transition-all",
              isEditMode && "ring-2 ring-secondary",
              currentUser?.role !== 'diretor' && "col-span-1"
            )}>
              <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
                <Target className="w-5 h-5 text-secondary" />
              </div>
              <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">
                Meta Principal
              </h4>
              {isEditMode ? (
                <textarea
                  value={editFormData.objective}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, objective: e.target.value }))}
                  className="bg-transparent border-none text-sm font-bold text-zinc-300 leading-relaxed focus:ring-0 w-full resize-none h-24 p-0"
                  placeholder="Qual a meta deste ciclo?"
                />
              ) : (
                <p className="text-sm font-bold text-zinc-300 leading-relaxed">{sprint.objective}</p>
              )}
            </div>
          </div>

          {/* Description + Metrics */}
          <div className={cn(
            "grid gap-10",
            currentUser?.role === 'diretor' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          )}>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-500" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                  Contexto do Ciclo
                </h4>
              </div>
              {isEditMode ? (
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-sm text-zinc-400 leading-relaxed font-medium focus:border-secondary transition-all resize-none h-32"
                  placeholder="Detalhes adicionais..."
                />
              ) : (
                <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                  {sprint.description ||
                    'Este ciclo foca na aceleração de entregas críticas e alinhamento estratégico com os objetivos do trimestre.'}
                </p>
              )}
            </div>

            {currentUser?.role === 'diretor' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-zinc-500" />
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                    Métricas de Eficiência
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                    <div className="text-xl font-black text-white">{sprintDemands.length}</div>
                    <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                      Demandas Totais
                    </div>
                  </div>
                  <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                    <div className="text-xl font-black text-secondary">
                      {sprintDemands.filter((d) => d.status === 'concluido').length}
                    </div>
                    <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                      Concluídas
                    </div>
                  </div>
                  <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                    <div className="text-xl font-black text-white">
                      {sprintDemands.filter((d) => d.status === 'em_progresso').length}
                    </div>
                    <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                      Em Progresso
                    </div>
                  </div>
                  <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                    <div className="text-xl font-black text-red-400">
                      {
                        sprintDemands.filter(
                          (d) =>
                            d.deadline &&
                            new Date(d.deadline) < new Date() &&
                            d.status !== 'concluido'
                        ).length
                      }
                    </div>
                    <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                      Atrasadas
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Weekly Scope Groups */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-secondary" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                  Planejamento Semanal
                </h4>
              </div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Ciclo de {weekGroups.length} {weekGroups.length === 1 ? 'Semana' : 'Semanas'}
              </span>
            </div>

            <div className="space-y-12">
              {weekGroups.map((group, idx) => (
                <div key={idx} className="relative pl-8 border-l border-white/[0.05]">
                  {/* Week Indicator */}
                  <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-zinc-800 border-2 border-[#101010]" />

                  <div className="flex flex-col gap-1 mb-6">
                    <h5 className="text-sm font-black text-secondary uppercase tracking-wider">{group.label}</h5>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{group.period}</p>
                  </div>

                  <div className="space-y-3">
                    {group.demands.length > 0 ? (
                      group.demands.map((demand) => {
                        const isOverdue =
                          demand.deadline &&
                          new Date(demand.deadline) < new Date() &&
                          demand.status !== 'concluido';

                        return (
                          <div
                            key={demand.id}
                            className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex items-center justify-between transition-all"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div
                                className={cn(
                                  'w-2 h-2 rounded-full shrink-0',
                                  demand.status === 'concluido'
                                    ? 'bg-secondary'
                                    : isOverdue
                                      ? 'bg-red-400'
                                      : 'bg-zinc-600'
                                )}
                              />
                              <div className="min-w-0">
                                <h5 className="text-sm font-black text-white group-hover:text-secondary transition-colors truncate">
                                  {demand.title}
                                </h5>
                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {demand.estimatedHours}h
                                  </span>
                                  <span className="text-zinc-800">•</span>
                                  <span className={cn(
                                    'text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded',
                                    demand.priority === 'urgente' ? 'text-red-400 bg-red-400/10' : 'text-zinc-500 bg-zinc-800'
                                  )}>
                                    {demand.priority}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex -space-x-2 shrink-0 ml-4">
                              {demand.assignees.slice(0, 2).map((uid) => {
                                const u = users.find((user) => user.uid === uid);
                                return (
                                  <Avatar
                                    key={uid}
                                    src={u?.photoURL}
                                    alt={u?.name ?? uid}
                                    size="sm"
                                    className="border-2 border-[#101010]"
                                    fallback={uid.substring(0, 1).toUpperCase()}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-4 px-6 rounded-2xl border border-dashed border-white/5 text-[10px] font-medium text-zinc-700 uppercase tracking-widest">
                        Sem entregas planejadas
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-zinc-950/40 backdrop-blur-md flex items-center justify-between relative z-10">
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
            Energy Júnior • Bate Meta pra Valer
          </p>
          <button
            onClick={closeSprintDetalhes}
            className="px-8 py-3 bg-secondary text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};