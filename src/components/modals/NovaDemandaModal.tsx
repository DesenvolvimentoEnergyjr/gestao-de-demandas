'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ArrowRight, Pencil, Trash2, Clock } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useSprintStore } from '@/store/useSprintStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { createDemand, getDemandById, getUsers, updateDemand, deleteDemand } from '@/lib/firestore';
import { useDemandStore } from '@/store/useDemandStore';
import { User, Demand, DemandStatus, Priority } from '@/types';
import { cn } from '@/lib/utils';
import { demandaSchema, DemandaFormData } from '@/lib/schemas';
import { DatePicker } from '@/components/ui/DatePicker';
import { toast } from '@/store/useToastStore';

type FormData = DemandaFormData;

const initialFormData = (status: DemandStatus): FormData => ({
  title: '',
  description: '',
  status,
  priority: 'media',
  assignees: [],
  sprintId: '',
  startDate: '', // Iniciado vazio para evitar mismatch de hidratação
  deadline: '',
  estimatedHours: 0,
  projectType: 'Interno',
});

export const NovaDemandaModal = () => {
  const {
    novaDemandaOpen,
    closeNovaDemanda,
    novaDemandaInitialStatus,
    selectedDemandId,
    demandModalMode,
    setDemandModalMode
  } = useUIStore();

  const { sprints } = useSprintStore();
  const { addDemand, updateDemand: updateStoreDemand, removeDemand } = useDemandStore();
  const { user: currentUser } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<FormData>(initialFormData('backlog'));
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    if (!novaDemandaOpen) {
      setShowDeleteConfirm(false);
      setFormErrors({});
      return;
    }

    getUsers(true).then(setAllUsers);

    if (selectedDemandId && (demandModalMode === 'view' || demandModalMode === 'edit')) {
      const fetchDemand = async () => {
        setLoading(true);
        const d = await getDemandById(selectedDemandId);
        if (d) {
          setSelectedDemand(d);
          setFormData({
            title: d.title,
            description: d.description,
            status: d.status,
            priority: d.priority,
            assignees: d.assignees,
            sprintId: d.sprintId || '',
            startDate: d.startDate ? d.startDate.toISOString().split('T')[0] : '',
            deadline: d.deadline ? d.deadline.toISOString().split('T')[0] : '',
            estimatedHours: d.estimatedHours,
            projectType: d.projectType || 'Interno',
          });
        }
        setLoading(false);
      };
      fetchDemand();
    } else {
      setSelectedDemand(null);
      const initial = initialFormData(novaDemandaInitialStatus);
      // Set current date only on client
      initial.startDate = new Date().toISOString().split('T')[0];
      setFormData(initial);
    }
  }, [novaDemandaOpen, selectedDemandId, demandModalMode, novaDemandaInitialStatus]);

  const handleSprintChange = (sprintId: string) => {
    const sprint = sprints.find((s) => s.id === sprintId);
    setFormData((prev) => ({
      ...prev,
      sprintId,
      startDate: sprint
        ? sprint.startDate.toISOString().split('T')[0]
        : prev.startDate,
      deadline: sprint ? sprint.endDate.toISOString().split('T')[0] : '',
    }));
  };

  const toggleAssignee = (uid: string) => {
    if (demandModalMode === 'view') return;
    setFormData((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(uid)
        ? prev.assignees.filter((id) => id !== uid)
        : [...prev.assignees, uid],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // ── Zod validation ──────────────────────────────────────────────────────
    const result = demandaSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormData;
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setFormErrors(fieldErrors);
      return;
    }
    setFormErrors({});
    // ────────────────────────────────────────────────────────────────────────

    setLoading(true);

    try {
      if (demandModalMode === 'create') {
        const demandId = await createDemand({
          title: formData.title,
          description: formData.description ?? '',
          status: formData.status,
          priority: formData.priority,
          assignees: formData.assignees,
          sprintId: formData.sprintId || null,
          tags: [],
          startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
          deadline: formData.deadline ? new Date(formData.deadline) : null,
          estimatedHours: Number(formData.estimatedHours),
          projectType: formData.projectType,
          completedHours: 0,
          subtasks: [],
          comments: [],
          activityLog: [],
          createdBy: currentUser.uid,
        });

        const createdDemand = await getDemandById(demandId);
        if (createdDemand) {
          addDemand(createdDemand);
        }
        toast.success('Demanda criada com sucesso!');
      } else if (demandModalMode === 'edit' && selectedDemandId) {
        const updateData = {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          assignees: formData.assignees,
          sprintId: formData.sprintId || null,
          startDate: formData.startDate ? new Date(formData.startDate) : null,
          deadline: formData.deadline ? new Date(formData.deadline) : null,
          estimatedHours: Number(formData.estimatedHours),
          projectType: formData.projectType,
        };

        await updateDemand(selectedDemandId, updateData);
        const updatedDemand = await getDemandById(selectedDemandId);
        if (updatedDemand) {
          updateStoreDemand(selectedDemandId, updatedDemand);
        }
        toast.success('Demanda atualizada com sucesso!');
      }

      closeNovaDemanda();
    } catch (error) {
      console.error('Erro ao processar demanda:', error);
      toast.error('Erro ao processar demanda. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDemandId) return;
    setLoading(true);
    try {
      await deleteDemand(selectedDemandId);
      removeDemand(selectedDemandId);
      toast.success('Demanda excluída com sucesso!');
      closeNovaDemanda();
    } catch (error) {
      console.error('Erro ao excluir demanda:', error);
      toast.error('Ocorreu um erro ao excluir a demanda.');
    } finally {
      setLoading(false);
    }
  };

  if (!novaDemandaOpen) return null;

  const isView = demandModalMode === 'view';
  const isCreate = demandModalMode === 'create';

  const modalTitle = isCreate
    ? 'Nova Demanda'
    : `${selectedDemand?.code || ''} • Detalhes da Demanda`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-sm"
        onClick={closeNovaDemanda}
      />

      <div className={cn(
        "relative w-full max-w-2xl bg-bg-section border-gradient rounded-[2rem] md:rounded-[32px] shadow-[0_0_50px_-12px_rgba(11,175,77,0.2)] overflow-hidden transition-all duration-500 flex flex-col max-h-[90vh]",
        "animate-in fade-in zoom-in-95"
      )}>

        {/* Header */}
        <div className="p-6 md:p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary/5 rounded-2xl flex items-center justify-center border border-white/5 shadow-[0_0_20px_rgba(11,175,77,0.1)] shrink-0">
              <Image src="/logo-energy.svg" alt="Energy" width={24} height={24} className="object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-black text-white tracking-tight truncate">{modalTitle}</h2>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter truncate">
                Energy Júnior • {isCreate ? 'Nova Solicitação' : 'Gestão de Fluxo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreate && isView && currentUser?.role === 'diretor' && (
              <button
                onClick={() => setDemandModalMode('edit')}
                className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/5 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                title="Editar Demanda"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={closeNovaDemanda}
              className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 pt-4 md:pt-6 space-y-6 md:space-y-8 flex-1 overflow-y-auto no-scrollbar">

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" />
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest animate-pulse">Carregando dados...</p>
            </div>
          ) : (
            <>
              {/* Title Section */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                  Título da Demanda
                </label>
                {isView ? (
                  <div className="p-4 bg-zinc-950/50 rounded-2xl border border-white/[0.05] text-sm font-black text-white">
                    {formData.title}
                  </div>
                ) : (
                  <>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Otimização de Fluxo de Caixa"
                      className={cn(
                        'bg-zinc-950 border-white/[0.03] focus:border-secondary h-12 text-sm rounded-xl px-4',
                        formErrors.title && 'border-red-500/50 focus:border-red-500'
                      )}
                    />
                    {formErrors.title && (
                      <p className="text-[10px] text-red-400 font-semibold ml-1 mt-1">{formErrors.title}</p>
                    )}
                  </>
                )}
              </div>

              {/* Description Section */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                  Descrição
                </label>
                {isView ? (
                  <div className="p-4 bg-zinc-950/50 rounded-2xl border border-white/[0.05] text-sm font-black text-white leading-relaxed min-h-[100px] whitespace-pre-wrap">
                    {formData.description || 'Sem descrição.'}
                  </div>
                ) : (
                  <>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      className={cn(
                        'w-full bg-zinc-950 border border-white/[0.03] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-secondary transition-all resize-none',
                        formErrors.description && 'border-red-500/50 focus:border-red-500'
                      )}
                      placeholder="Descreva os requisitos principais..."
                    />
                    {formErrors.description && (
                      <p className="text-[10px] text-red-400 font-semibold ml-1 mt-1">{formErrors.description}</p>
                    )}
                  </>
                )}
              </div>

              {/* Project Type Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                  Tipo de Projeto
                </label>
                {isView ? (
                  <div className="h-12 bg-zinc-950/50 flex items-center px-4 rounded-xl border border-white/[0.08] text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    {formData.projectType === 'Externo' ? 'Serviços Empresa' : 'Projetos Internos'}
                  </div>
                ) : (
                  <div className="flex p-1 bg-zinc-950 border border-white/[0.08] rounded-xl h-12">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, projectType: 'Interno' }))}
                      className={cn(
                        'flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                        formData.projectType === 'Interno'
                          ? 'bg-white text-black shadow-lg shadow-white/10'
                          : 'text-zinc-600 hover:text-white/40'
                      )}
                    >
                      Interno
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, projectType: 'Externo' }))}
                      className={cn(
                        'flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                        formData.projectType === 'Externo'
                          ? 'bg-secondary text-white shadow-lg shadow-secondary/10'
                          : 'text-zinc-600 hover:text-white/40'
                      )}
                    >
                      Externo
                    </button>
                  </div>
                )}
              </div>

              {/* Assignees & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                    Responsáveis
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
                      {allUsers
                        .filter((u) => formData.assignees.includes(u.uid))
                        .map((u) => (
                          <div key={u.uid} className="relative group shrink-0">
                            <Avatar src={u.photoURL} alt={u.name} size="sm" className="border-2 border-[#0f0f0f]" />
                            
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-2xl">
                              <span className="text-[10px] font-black text-white uppercase tracking-widest">{u.name}</span>
                            </div>

                            {!isView && (
                              <button
                                type="button"
                                onClick={() => toggleAssignee(u.uid)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              >
                                <X className="w-2 text-white" />
                              </button>
                            )}
                          </div>
                        ))}
                      {formData.assignees.length === 0 && (
                        <div className="flex items-center gap-2 text-zinc-600">
                          <Avatar size="sm" className="border-2 border-dashed border-white/5 opacity-40" />
                          <span className="text-[9px] font-black uppercase tracking-widest italic">Não atribuído</span>
                        </div>
                      )}
                    </div>

                    {!isView && (
                      <>
                        <div className="h-6 w-px bg-white/10 mx-1 shrink-0" />
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 flex-1">
                          {allUsers
                            .filter((u) => !formData.assignees.includes(u.uid))
                            .map((u) => (
                              <div key={u.uid} className="relative group shrink-0">
                                <button
                                  type="button"
                                  onClick={() => toggleAssignee(u.uid)}
                                  className="opacity-40 hover:opacity-100 transition-all hover:scale-110"
                                >
                                  <Avatar src={u.photoURL} alt={u.name} size="sm" />
                                </button>
                                
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-2xl">
                                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{u.name}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {isView ? (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Status</label>
                    <div className="h-12 bg-zinc-950/50 flex items-center px-4 rounded-xl border border-white/[0.08] text-[10px] font-black uppercase tracking-[0.2em] text-white">
                      {formData.status.replace('_', ' ')}
                    </div>
                  </div>
                ) : (
                  <Select
                    label="Status"
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as DemandStatus }))}
                  >
                    <option value="backlog">Backlog</option>
                    <option value="criando_escopo">Criando Escopo</option>
                    <option value="em_progresso">Em Progresso</option>
                    <option value="em_revisao">Em Revisão</option>
                    <option value="concluido">Concluído</option>
                  </Select>
                )}
              </div>

              {/* Priority & Sprint */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                {isView ? (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Prioridade</label>
                    <div className="h-12 bg-zinc-950/50 flex items-center px-4 rounded-xl border border-white/[0.02] text-[10px] font-black uppercase tracking-[0.2em]">
                      <span className={cn(
                        "px-2 py-0.5 rounded",
                        formData.priority === 'urgente' ? 'text-red-400 bg-red-400/10' :
                          formData.priority === 'alta' ? 'text-orange-400 bg-orange-400/10' :
                            formData.priority === 'media' ? 'text-yellow-400 bg-yellow-400/10' :
                              'text-zinc-400 bg-zinc-400/10'
                      )}>
                        {formData.priority}
                      </span>
                    </div>
                  </div>
                ) : (
                  <Select
                    label="Prioridade"
                    value={formData.priority}
                    onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value as Priority }))}
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </Select>
                )}

                {isView ? (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Ciclo de Sprint</label>
                    <div className="h-12 bg-zinc-950/50 flex items-center px-4 rounded-xl border border-white/[0.02] text-[10px] font-black uppercase tracking-[0.2em] text-white">
                      {sprints.find(s => s.id === formData.sprintId)?.title || 'Sem sprint definida'}
                    </div>
                  </div>
                ) : (
                  <Select
                    label="Sprint"
                    value={formData.sprintId}
                    onChange={(e) => handleSprintChange(e.target.value)}
                  >
                    <option value="">Sem Sprint (Backlog)</option>
                    {sprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.number} • {s.title}
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              {/* Dates & Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Início</label>
                    {isView ? (
                      <div className="h-12 bg-zinc-950/50 flex items-center px-4 rounded-xl border border-white/[0.02] text-[10px] font-black uppercase tracking-[0.2em] text-white">
                        {formData.startDate || '—'}
                      </div>
                    ) : (
                      <DatePicker
                        value={formData.startDate}
                        onChange={(date) => setFormData((prev) => ({ ...prev, startDate: date }))}
                        error={!!formErrors.startDate}
                      />
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Fim (Deadline)</label>
                    {isView ? (
                      <div className="h-12 bg-zinc-950/50 flex items-center px-4 rounded-xl border border-white/[0.02] text-[10px] font-black uppercase tracking-[0.2em] text-white">
                        {formData.deadline || '—'}
                      </div>
                    ) : (
                      <DatePicker
                        value={formData.deadline}
                        onChange={(date) => setFormData((prev) => ({ ...prev, deadline: date }))}
                        error={!!formErrors.deadline}
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Horas Estimadas</label>
                  {isView ? (
                    <div className="h-12 bg-zinc-950/50 flex items-center px-4 rounded-xl border border-white/[0.02] text-sm font-black text-white">
                      {formData.estimatedHours} <span className="text-[10px] text-zinc-600 ml-2 uppercase">Horas</span>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          value={formData.estimatedHours}
                          onChange={(e) => setFormData((prev) => ({ ...prev, estimatedHours: Number(e.target.value) }))}
                          className={cn(
                            'bg-zinc-950 border-white/[0.03] h-12 text-sm font-bold pr-12',
                            formErrors.estimatedHours && 'border-red-500/50'
                          )}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600 uppercase">hrs</span>
                      </div>
                      {formErrors.estimatedHours && (
                        <p className="text-[10px] text-red-400 font-semibold ml-1 mt-1">{formErrors.estimatedHours}</p>
                      )}
                      {formErrors.deadline && (
                        <p className="text-[10px] text-red-400 font-semibold ml-1 mt-1">{formErrors.deadline}</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-6 flex flex-col gap-4">
                {isView ? (
                  <div className="flex items-center justify-center p-4 bg-zinc-950/50 rounded-2xl border border-dashed border-white/5">
                    <Clock className="w-4 h-4 text-zinc-700 mr-3" />
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Visualizando apenas leitura</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {isCreate || currentUser?.role === 'diretor' ? (
                      <Button
                        type="submit"
                        variant="primary"
                        className="w-full h-14 rounded-2xl text-white font-black text-sm gap-3 transition-all active:scale-[0.98] shadow-lg shadow-secondary/20"
                        loading={loading}
                      >
                        {isCreate ? 'Criar Demanda' : 'Salvar Alterações'}
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    ) : null}

                    {!isCreate && currentUser?.role === 'diretor' && (
                      <div className="flex flex-col gap-2">
                        {showDeleteConfirm ? (
                          <div className="flex items-center gap-2 animate-in slide-in-from-bottom-2">
                            <Button
                              type="button"
                              onClick={handleDelete}
                              className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest gap-2"
                              loading={loading}
                            >
                              Confirmar Exclusão
                            </Button>
                            <Button
                              type="button"
                              onClick={() => setShowDeleteConfirm(false)}
                              variant="ghost"
                              className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest"
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            variant="ghost"
                            className="w-full h-12 rounded-xl border-red-500/10 hover:bg-red-500/10 hover:text-red-400 group text-[10px] font-black uppercase tracking-widest gap-2 transition-all"
                          >
                            <Trash2 className="w-4 h-4 text-red-500 opacity-50 group-hover:opacity-100" />
                            Excluir Demanda
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[9px] text-center text-zinc-600 uppercase tracking-[0.3em] font-black leading-relaxed mt-2">
                  Sistema de Gestão Energy Júnior — 2026
                </p>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};