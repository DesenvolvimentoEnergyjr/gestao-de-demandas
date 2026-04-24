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
import { differenceInWeeks, addDays, format } from 'date-fns';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { sprintUpdateSchema } from '@/lib/schemas';
import { toast } from '@/store/useToastStore';

export const SprintDetalhesModal = () => {
  const { sprintDetalhesOpen, closeSprintDetalhes, selectedSprintId } = useUIStore();
  const { sprints, updateSprint: updateStoreSprint, removeSprint } = useSprintStore();
  const { demands } = useDemandStore();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Estado de Edição
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Sprint>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
    if (sprintDetalhesOpen) {
      getUsers(true).then(setUsers);
      setIsEditMode(false);
      setShowDeleteConfirm(false);
      setFormErrors({});
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

  // Chart Data (Burn-up)
  const chartData = useMemo(() => {
    if (!sprint || weekGroups.length === 0) return null;

    const totalEffort = sprintDemands.length > 0
      ? sprintDemands.reduce((acc, d) => acc + (d.estimatedHours || 1), 0)
      : 1;

    const start = new Date(sprint.startDate);
    start.setHours(0, 0, 0, 0);
    const totalWeeks = weekGroups.length;

    const data = [];
    const now = new Date();

    for (let i = 0; i <= totalWeeks; i++) {
      const pointDate = addDays(start, i * 7);
      const idealProgress = Math.round((i / totalWeeks) * 100);

      let actualProgress: number | null = null;
      // We compute actual progress if pointDate is before today or it is the first point
      if (pointDate <= addDays(now, 7) || i === 0) {
        // If i=0, actual is 0
        if (i === 0) {
          actualProgress = 0;
        } else {
          const completedEffort = sprintDemands
            .filter(d => d.status === 'concluido' && d.updatedAt && new Date(d.updatedAt) <= pointDate)
            .reduce((acc, d) => acc + (d.estimatedHours || 1), 0);
          actualProgress = Math.round((completedEffort / totalEffort) * 100);
        }
      }

      data.push({
        week: i,
        label: i === 0 ? 'Início' : `S${i}`,
        ideal: idealProgress,
        actual: actualProgress,
        pointDate
      });
    }
    return data;
  }, [sprint, sprintDemands, weekGroups.length]);

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
    setFormErrors({});
  };

  const handleSave = async () => {
    if (!selectedSprintId || !editFormData) return;

    // ── Zod validation ──────────────────────────────────────────────────────
    const result = sprintUpdateSchema.safeParse(editFormData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setFormErrors(fieldErrors);
      return;
    }
    setFormErrors({});
    // ────────────────────────────────────────────────────────────────────────

    setLoading(true);
    try {
      await updateSprint(selectedSprintId, editFormData);
      updateStoreSprint(selectedSprintId, editFormData);
      toast.success('Sprint atualizada com sucesso!');
      setIsEditMode(false);
    } catch (error) {
      console.error('Erro ao atualizar sprint:', error);
      toast.error('Erro ao atualizar sprint.');
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
      toast.success('Sprint excluída com sucesso!');
      closeSprintDetalhes();
    } catch (error) {
      console.error('Erro ao excluir sprint:', error);
      toast.error('Erro ao excluir sprint.');
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

      <div className="relative w-full max-w-4xl bg-bg-section border border-white/[0.08] rounded-[2rem] md:rounded-[40px] shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">

        {/* Decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-b from-secondary/5 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="p-6 md:p-10 pb-6 flex items-start justify-between relative z-10 gap-4">
          <div className="space-y-4 min-w-0">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black tracking-widest uppercase border',
                  sprint.status === 'active'
                    ? 'bg-secondary/10 text-secondary border-secondary/20'
                    : 'bg-zinc-800 text-zinc-500 border-white/5'
                )}
              >
                {statusLabel}
              </span>
              <span className="text-zinc-600 font-bold text-xs">•</span>
              <span className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase tracking-widest">
                Sprint #{sprint.number}
              </span>
            </div>
            <div className="min-w-0">
              {isEditMode ? (
                <>
                  <Input
                    value={editFormData.title}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={cn(
                      "text-2xl md:text-4xl font-black text-white bg-white/5 border-white/10 h-auto py-2",
                      formErrors.title && "border-red-500/50 focus:border-red-500"
                    )}
                  />
                  {formErrors.title && (
                    <p className="text-[10px] text-red-400 font-semibold ml-1">{formErrors.title}</p>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter leading-tight truncate">
                    {sprint.title}
                  </h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mt-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-600" />
                      <span className="text-[10px] md:text-xs font-bold whitespace-nowrap">
                        {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-600" />
                      <span className="text-[10px] md:text-xs font-bold whitespace-nowrap">
                        {sprint.storyPoints.total} Pontos
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
        <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10 space-y-8 md:space-y-10 no-scrollbar relative z-10">

          {isEditMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 bg-white/[0.02] border border-white/5 rounded-[32px] p-6 md:p-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                  Início do Ciclo
                </label>
                <div className="relative">
                  <DatePicker
                    value={editFormData.startDate ? format(new Date(editFormData.startDate), 'yyyy-MM-dd') : ''}
                    onChange={(date) => setEditFormData(prev => ({ ...prev, startDate: new Date(date) }))}
                    error={!!formErrors.startDate}
                  />
                </div>
                {formErrors.startDate && (
                  <p className="text-[10px] text-red-400 font-semibold ml-1 mt-1">{formErrors.startDate}</p>
                )}
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                  Previsão de Término
                </label>
                <div className="relative">
                  <DatePicker
                    value={editFormData.endDate ? format(new Date(editFormData.endDate), 'yyyy-MM-dd') : ''}
                    onChange={(date) => setEditFormData(prev => ({ ...prev, endDate: new Date(date) }))}
                    error={!!formErrors.endDate}
                  />
                </div>
                {formErrors.endDate && (
                  <p className="text-[10px] text-red-400 font-semibold ml-1 mt-1">{formErrors.endDate}</p>
                )}
              </div>
            </div>
          )}

          {/* Progress + Objective */}
          <div className={cn(
            "grid gap-6",
            currentUser?.role === 'diretor' ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1"
          )}>
            {currentUser?.role === 'diretor' && (
              <div className="col-span-1 md:col-span-2 bg-white/[0.02] border border-white/5 rounded-[2rem] md:rounded-[32px] p-6 md:p-8">
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
              "bg-secondary/5 border border-secondary/10 rounded-[2rem] md:rounded-[32px] p-6 md:p-8 flex flex-col justify-center transition-all",
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
                  className={cn(
                    "bg-transparent border-none text-sm font-bold text-zinc-300 leading-relaxed focus:ring-0 w-full resize-none h-24 p-0",
                    formErrors.objective && "text-red-400"
                  )}
                  placeholder="Qual a meta deste ciclo?"
                />
              ) : (
                <p className="text-sm font-bold text-zinc-300 leading-relaxed">{sprint.objective}</p>
              )}
              {isEditMode && formErrors.objective && (
                <p className="text-[10px] text-red-400 font-semibold mt-2">{formErrors.objective}</p>
              )}
            </div>
          </div>

          {/* Burn-up Chart */}
          {chartData && chartData.length > 1 && !isEditMode && (
            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] md:rounded-[32px] p-6 md:p-8 overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-4 h-4 text-secondary" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                  Gráfico de Acompanhamento (Burn-up)
                </h4>
              </div>

              <div className="relative w-full h-[200px] md:h-[250px]">
                <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="idealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(11, 175, 77, 0.4)" />
                      <stop offset="100%" stopColor="rgba(11, 175, 77, 0)" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map(percent => {
                    const y = 250 - (percent / 100) * 200;
                    return (
                      <g key={percent}>
                        <line x1="50" y1={y} x2="950" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                        <text x="40" y={y + 4} fill="rgba(255,255,255,0.3)" fontSize="12" fontWeight="bold" textAnchor="end">{percent}%</text>
                      </g>
                    );
                  })}

                  {/* Ideal Line & Area */}
                  <path
                    d={`M ${chartData.map((d) => `${50 + (d.week / (chartData.length - 1)) * 900},${250 - (d.ideal / 100) * 200}`).join(' L ')}`}
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2"
                    strokeDasharray="8 8"
                  />
                  <path
                    d={`M 50,250 L ${chartData.map((d) => `${50 + (d.week / (chartData.length - 1)) * 900},${250 - (d.ideal / 100) * 200}`).join(' L ')} L 950,250 Z`}
                    fill="url(#idealGrad)"
                  />

                  {/* Actual Line & Area */}
                  {chartData.filter(d => d.actual !== null).length > 0 && (
                    <>
                      <path
                        d={`M 50,250 L ${chartData.filter(d => d.actual !== null).map((d) => `${50 + (d.week / (chartData.length - 1)) * 900},${250 - (d.actual! / 100) * 200}`).join(' L ')} L ${50 + ((chartData.filter(d => d.actual !== null).length - 1) / (chartData.length - 1)) * 900},250 Z`}
                        fill="url(#actualGrad)"
                      />
                      <path
                        d={`M ${chartData.filter(d => d.actual !== null).map((d) => `${50 + (d.week / (chartData.length - 1)) * 900},${250 - (d.actual! / 100) * 200}`).join(' L ')}`}
                        fill="none"
                        stroke="#0baf4d"
                        strokeWidth="4"
                        style={{ filter: 'drop-shadow(0px 0px 8px rgba(11, 175, 77, 0.6))' }}
                      />

                      {/* Dots */}
                      {chartData.filter(d => d.actual !== null).map((d, i) => (
                        <circle
                          key={i}
                          cx={50 + (d.week / (chartData.length - 1)) * 900}
                          cy={250 - (d.actual! / 100) * 200}
                          r="6"
                          fill="#0f0f0f"
                          stroke="#0baf4d"
                          strokeWidth="3"
                        />
                      ))}
                    </>
                  )}

                  {/* X Axis Labels */}
                  {chartData.map((d, i) => (
                    <text
                      key={i}
                      x={50 + (i / (chartData.length - 1)) * 900}
                      y="280"
                      fill="rgba(255,255,255,0.5)"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {d.label}
                    </text>
                  ))}
                </svg>
              </div>

              <div className="flex items-center justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-white/20 border border-white/20 border-dashed" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ritmo Ideal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-secondary rounded-full shadow-[0_0_8px_rgba(11,175,77,0.5)]" />
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Progresso Real</span>
                </div>
              </div>
            </div>
          )}

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
                <>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    className={cn(
                      "w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-sm text-zinc-400 leading-relaxed font-medium focus:border-secondary transition-all resize-none h-32",
                      formErrors.description && "border-red-500/50"
                    )}
                    placeholder="Detalhes adicionais..."
                  />
                  {formErrors.description && (
                    <p className="text-[10px] text-red-400 font-semibold ml-1">{formErrors.description}</p>
                  )}
                </>
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
                        mounted ? sprintDemands.filter(
                          (d) =>
                            d.deadline &&
                            new Date(d.deadline) < new Date() &&
                            d.status !== 'concluido'
                        ).length : 0
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
                          mounted &&
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

                            <div className="flex -space-x-2 shrink-0 ml-4 overflow-x-auto no-scrollbar max-w-[80px]">
                              {demand.assignees.map((uid) => {
                                const u = users.find((user) => user.uid === uid);
                                return (
                                  <div key={uid} className="relative group shrink-0">
                                    <Avatar
                                      src={u?.photoURL}
                                      alt={u?.name ?? uid}
                                      size="sm"
                                      className="border-2 border-[#101010]"
                                      fallback={uid.substring(0, 1).toUpperCase()}
                                    />
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-2xl">
                                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{u?.name ?? uid}</span>
                                    </div>
                                  </div>
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
        <div className="p-6 md:p-8 border-t border-white/5 bg-zinc-950/40 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.3em] text-center sm:text-left">
            Energy Júnior • Bate Meta pra Valer
          </p>
          <button
            onClick={closeSprintDetalhes}
            className="w-full sm:w-auto px-8 py-3 bg-secondary text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};