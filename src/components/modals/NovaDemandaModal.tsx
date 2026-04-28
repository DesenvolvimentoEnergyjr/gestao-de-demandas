'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ArrowRight, Pencil, Trash2, Clock, Users, ChevronUp, ChevronDown } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useSprintStore } from '@/store/useSprintStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { createDemand, getDemandById, getUsers, updateDemand, deleteDemand } from '@/lib/firestore';
import { useDemandStore } from '@/store/useDemandStore';
import { User, DemandStatus, Priority } from '@/types';
import { cn } from '@/lib/utils';
import { demandaSchema, DemandaFormData } from '@/lib/schemas';
import { DatePicker } from '@/components/ui/DatePicker';
import { toast } from '@/store/useToastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/Skeleton';

const DemandFormSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-12 w-full" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-32 w-full" />
    </div>
    <div className="grid grid-cols-2 gap-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
    <div className="space-y-3">
      <Skeleton className="h-4 w-28" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  </div>
);

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
  createdAt: '',
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<FormData>(initialFormData('backlog'));

  // Carregar dados ao abrir o modal
  useEffect(() => {
    if (!novaDemandaOpen) {
      setLoading(false);
      setShowDeleteConfirm(false);
      setFormErrors({});
      return;
    }

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const usersData = await getUsers(true);
        setAllUsers(usersData);

        if (selectedDemandId && (demandModalMode === 'view' || demandModalMode === 'edit')) {
          const d = await getDemandById(selectedDemandId);
          if (d) {
            setFormData({
              title: d.title,
              description: d.description || '',
              status: d.status,
              priority: d.priority,
              assignees: d.assignees,
              sprintId: d.sprintId || '',
              estimatedHours: d.estimatedHours || 0,
              startDate: d.startDate instanceof Date ? d.startDate.toISOString().split('T')[0] : d.startDate || '',
              deadline: d.deadline instanceof Date ? d.deadline.toISOString().split('T')[0] : d.deadline || '',
              projectType: d.projectType || 'Interno',
            });
          }
        } else if (demandModalMode === 'create') {
          setFormData(initialFormData(novaDemandaInitialStatus || 'backlog'));
          setFormErrors({});
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados do modal.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [novaDemandaOpen, selectedDemandId, demandModalMode, novaDemandaInitialStatus]);

  const handleSprintChange = (sprintId: string) => {
    const sprint = sprints.find((s) => s.id === sprintId);
    setFormData((prev) => ({
      ...prev,
      sprintId,
      startDate: sprint
        ? (sprint.startDate instanceof Date ? sprint.startDate.toISOString().split('T')[0] : (sprint.startDate as unknown as string))
        : prev.startDate,
      deadline: sprint 
        ? (sprint.endDate instanceof Date ? sprint.endDate.toISOString().split('T')[0] : (sprint.endDate as unknown as string)) 
        : '',
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
          createdAt: formData.createdAt ? new Date(formData.createdAt) : new Date(),
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
          createdAt: formData.createdAt ? new Date(formData.createdAt) : undefined,
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

  const isView = demandModalMode === 'view';
  const isCreate = demandModalMode === 'create';

  const modalTitle = isCreate
    ? 'Nova Demanda'
    : 'Detalhes da Demanda';

  return (
    <AnimatePresence>
      {novaDemandaOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-sm"
            onClick={closeNovaDemanda}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-bg-section border-gradient rounded-[2rem] md:rounded-[32px] shadow-[0_0_50px_-12px_rgba(11,175,77,0.2)] overflow-hidden flex flex-col max-h-[90vh]"
          >
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
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DemandFormSkeleton />
                  </motion.div>
                ) : (
                  <motion.div
                    key="form-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 md:space-y-8"
                  >
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
                            'w-full bg-zinc-950 border border-white/[0.03] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-secondary transition-all resize-none',
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

                  {/* Assignees - Full Width */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                      Responsáveis
                    </label>

                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {allUsers
                          .filter((u) => formData.assignees.includes(u.uid))
                          .map((u) => (
                            <motion.div
                              key={u.uid}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center gap-2 bg-secondary/10 border border-secondary/20 p-1 pr-3 rounded-full"
                            >
                              <Avatar src={u.photoURL} alt={u.name} size="xs" className="border-none" />
                              <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate max-w-[120px]">
                                {u.name.split(' ')[0]} {u.name.split(' ')[1] ? u.name.split(' ')[1][0] + '.' : ''}
                              </span>
                              {!isView && (
                                <button
                                  type="button"
                                  onClick={() => toggleAssignee(u.uid)}
                                  className="w-4 h-4 rounded-full bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all flex items-center justify-center ml-1"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </motion.div>
                          ))}

                        {formData.assignees.length === 0 && (
                          <div className="flex items-center gap-2 text-zinc-600 px-1 py-1">
                            <div className="w-6 h-6 rounded-full border border-dashed border-white/10 flex items-center justify-center">
                              <Users className="w-3 h-3 opacity-30" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest italic opacity-40">Ninguém atribuído</span>
                          </div>
                        )}
                      </div>

                      {!isView && (
                        <div className="space-y-3">
                          <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Adicionar Membros</p>
                          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-40 overflow-y-auto no-scrollbar p-1 rounded-xl bg-black/20 border border-white/5">
                            {allUsers
                              .filter((u) => !formData.assignees.includes(u.uid))
                              .map((u) => (
                                <button
                                  key={u.uid}
                                  type="button"
                                  onClick={() => toggleAssignee(u.uid)}
                                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-all text-left border border-transparent hover:border-white/5"
                                >
                                  <Avatar src={u.photoURL} alt={u.name} size="xs" className="opacity-60 grayscale group-hover:grayscale-0 transition-all" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] font-black text-zinc-400 truncate">{u.name.split(' ')[0]}</span>
                                    <span className="text-[7px] font-bold text-zinc-600 uppercase truncate">{u.area || 'Membro'}</span>
                                  </div>
                                </button>
                              ))}
                            {allUsers.filter((u) => !formData.assignees.includes(u.uid)).length === 0 && (
                              <p className="col-span-full text-[8px] text-zinc-700 text-center py-2 uppercase font-black">Todos selecionados</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status & Priority */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
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
                  </div>

                  {/* Sprint & Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                    {isView ? (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Ciclo de Sprint</label>
                        <div className="h-12 bg-zinc-950/50 flex items-center px-4 rounded-xl border border-white/[0.02] text-[10px] font-black uppercase tracking-[0.2em] text-white">
                          {sprints.find(s => s.id === formData.sprintId)?.title || 'Sem sprint'}
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

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Horas Estimadas</label>
                      {isView ? (
                        <div className="h-12 bg-zinc-950/50 flex items-center px-4 rounded-xl border border-white/[0.02] text-sm font-black text-white">
                          {formData.estimatedHours} <span className="text-[10px] text-zinc-600 ml-2 uppercase">Horas</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              min={0}
                              value={formData.estimatedHours || ''}
                              placeholder="0"
                              onChange={(e) => setFormData((prev) => ({
                                ...prev,
                                estimatedHours: e.target.value === '' ? 0 : Number(e.target.value)
                              }))}
                              className={cn(
                                'bg-zinc-950 border-white/[0.03] h-12 text-sm font-bold pr-12',
                                formErrors.estimatedHours && 'border-red-500/50'
                              )}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600 uppercase pointer-events-none">hrs</span>
                          </div>

                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, estimatedHours: (prev.estimatedHours || 0) + 1 }))}
                              className="w-8 h-[22px] flex items-center justify-center bg-zinc-900 border border-white/5 rounded-md hover:bg-zinc-800 hover:text-secondary transition-all active:scale-95"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, estimatedHours: Math.max(0, (prev.estimatedHours || 0) - 1) }))}
                              className="w-8 h-[22px] flex items-center justify-center bg-zinc-900 border border-white/5 rounded-md hover:bg-zinc-800 hover:text-red-400 transition-all active:scale-95"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                      {formErrors.estimatedHours && (
                        <p className="text-[10px] text-red-400 font-semibold ml-1 mt-1">{formErrors.estimatedHours}</p>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
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
                      {!isView && formErrors.deadline && (
                        <p className="text-[10px] text-red-400 font-semibold ml-1 mt-1">{formErrors.deadline}</p>
                      )}
                    </div>
                  </div>

                  {/* Ação */}
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
                            <AnimatePresence mode="wait">
                              {showDeleteConfirm ? (
                                <motion.div 
                                  key="confirm"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="flex items-center gap-2"
                                >
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
                                </motion.div>
                              ) : (
                                <motion.div key="delete">
                                  <Button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    variant="ghost"
                                    className="w-full h-12 rounded-xl border-red-500/10 hover:bg-red-500/10 hover:text-red-400 group text-[10px] font-black uppercase tracking-widest gap-2 transition-all"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500 opacity-50 group-hover:opacity-100" />
                                    Excluir Demanda
                                  </Button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-[9px] text-center text-zinc-600 uppercase tracking-[0.3em] font-black leading-relaxed mt-2">
                      Sistema de Gestão Energy Júnior — 2026
                    </p>
                  </div>
                </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};