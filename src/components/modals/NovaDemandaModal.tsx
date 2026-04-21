'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ArrowRight, Plus } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useSprintStore } from '@/store/useSprintStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { createDemand, getDemandById, getUsers } from '@/lib/firestore';
import { useDemandStore } from '@/store/useDemandStore';
import { User, Priority, DemandStatus } from '@/types';

interface FormData {
  title: string;
  description: string;
  status: DemandStatus;
  priority: Priority;
  assignees: string[];
  sprintId: string;
  startDate: string;
  deadline: string;
  estimatedHours: number;
}

const initialFormData = (status: DemandStatus): FormData => ({
  title: '',
  description: '',
  status,
  priority: 'media',
  assignees: [],
  sprintId: '',
  startDate: new Date().toISOString().split('T')[0],
  deadline: '',
  estimatedHours: 0,
});

export const NovaDemandaModal = () => {
  const { novaDemandaOpen, closeNovaDemanda, novaDemandaInitialStatus } = useUIStore();
  const { sprints } = useSprintStore();
  const { addDemand } = useDemandStore();
  const { user: currentUser } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<FormData>(initialFormData('backlog'));

  useEffect(() => {
    if (!novaDemandaOpen) return;

    getUsers(true).then(setAllUsers);
    setFormData(initialFormData(novaDemandaInitialStatus));
  }, [novaDemandaOpen, novaDemandaInitialStatus]);

  // Auto-fill dates when a sprint is selected
  const handleSprintChange = (sprintId: string) => {
    const sprint = sprints.find((s) => s.id === sprintId);
    setFormData((prev) => ({
      ...prev,
      sprintId,
      startDate: sprint
        ? sprint.startDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      deadline: sprint ? sprint.endDate.toISOString().split('T')[0] : '',
    }));
  };

  const toggleAssignee = (uid: string) => {
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
    setLoading(true);

    try {
      const demandId = await createDemand({
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        assignees: formData.assignees,
        sprintId: formData.sprintId || null,
        tags: [],
        startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
        deadline: formData.deadline ? new Date(formData.deadline) : null,
        estimatedHours: Number(formData.estimatedHours),
        completedHours: 0,
        subtasks: [],
        comments: [],
        activityLog: [],
        createdBy: currentUser.uid,
      });

      // Fetch the created demand to get the generated code
      const createdDemand = await getDemandById(demandId);
      if (createdDemand) {
        addDemand(createdDemand);
      }

      closeNovaDemanda();
    } catch (error) {
      console.error('Erro ao criar demanda:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!novaDemandaOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-sm"
        onClick={closeNovaDemanda}
      />

      <div className="relative w-full max-w-2xl bg-[#0f0f0f] border border-white/[0.05] rounded-[32px] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-500">

        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/5 rounded-2xl flex items-center justify-center border border-white/5 shadow-[0_0_20px_rgba(11,175,77,0.1)]">
              <Image src="/logo-energy.svg" alt="Energy" width={28} height={28} className="object-contain" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Nova Demanda</h2>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-tighter">
                Energy Júnior • Gestão de Demandas
              </p>
            </div>
          </div>
          <button
            onClick={closeNovaDemanda}
            className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-8 max-h-[80vh] overflow-y-auto no-scrollbar">

          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
              Título da Demanda
            </label>
            <Input
              required
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Otimização de Fluxo de Caixa"
              className="bg-zinc-950 border-white/[0.03] focus:border-secondary h-12 text-sm rounded-xl px-4 placeholder:text-zinc-700"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
              Descrição
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full bg-zinc-950 border border-white/[0.03] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/5 transition-all resize-none"
              placeholder="Descreva os objetivos e requisitos principais..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                Responsáveis
              </label>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {allUsers
                    .filter((u) => formData.assignees.includes(u.uid))
                    .map((u) => (
                      <button
                        key={u.uid}
                        type="button"
                        onClick={() => toggleAssignee(u.uid)}
                        title={`Remover ${u.name}`}
                        className="transition-transform hover:scale-110 active:scale-95"
                      >
                        <Avatar src={u.photoURL} alt={u.name} size="sm" className="border-2 border-[#0f0f0f]" />
                      </button>
                    ))}
                  {formData.assignees.length === 0 && (
                    <div className="w-8 h-8 rounded-full border border-dashed border-white/10 flex items-center justify-center text-[8px] text-zinc-600 font-bold uppercase">
                      —
                    </div>
                  )}
                </div>

                <div className="h-6 w-px bg-white/10 mx-1" />

                <div className="flex gap-2">
                  {allUsers
                    .filter((u) => !formData.assignees.includes(u.uid))
                    .slice(0, 4)
                    .map((u) => (
                      <button
                        key={u.uid}
                        type="button"
                        onClick={() => toggleAssignee(u.uid)}
                        className="opacity-40 hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                        title={`Selecionar ${u.name}`}
                      >
                        <Avatar src={u.photoURL} alt={u.name} size="sm" />
                      </button>
                    ))}
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all bg-white/[0.01]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <Select
              label="Status Inicial"
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as DemandStatus }))}
            >
              <option value="backlog">Backlog</option>
              <option value="criando_escopo">Criando Escopo</option>
              <option value="em_progresso">Em Progresso</option>
              <option value="em_revisao">Em Revisão</option>
              <option value="concluido">Concluído</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                  Início
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="bg-zinc-950 border-white/[0.03] h-12 text-xs rounded-xl px-3"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                  Fim
                </label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData((prev) => ({ ...prev, deadline: e.target.value }))}
                  className="bg-zinc-950 border-white/[0.03] h-12 text-xs rounded-xl px-3"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                Horas Est.
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  value={formData.estimatedHours}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, estimatedHours: Number(e.target.value) }))
                  }
                  placeholder="00"
                  className="bg-zinc-950 border-white/[0.03] h-12 text-sm rounded-xl px-4 pr-12 font-bold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600 uppercase">
                  hrs
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Button
              type="submit"
              variant="primary"
              className="w-full h-14 rounded-2xl text-white font-black text-sm gap-3 transition-all active:scale-[0.98] shadow-lg shadow-secondary/20"
              loading={loading}
            >
              Criar Demanda
              <ArrowRight className="w-5 h-5 flex-shrink-0" />
            </Button>
            <p className="mt-6 text-[9px] text-center text-zinc-600 uppercase tracking-[0.3em] font-black leading-relaxed">
              A demanda será notificada aos responsáveis selecionados
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};