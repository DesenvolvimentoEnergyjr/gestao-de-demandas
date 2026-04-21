'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, ArrowRight, Calendar, Target } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useSprintStore } from '@/store/useSprintStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createSprint } from '@/lib/firestore';
import { Sprint } from '@/types';
import { cn } from '@/lib/utils';

interface FormData {
  title: string;
  description: string;
  objective: string;
  startDate: string;
  endDate: string;
  totalPoints: number;
  type: 'Interno' | 'Externo';
}

const initialFormData: FormData = {
  title: '',
  description: '',
  objective: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  totalPoints: 50,
  type: 'Interno',
};

export const NovaSprintModal = () => {
  const { novaSprintOpen, closeNovaSprint } = useUIStore();
  const { sprints, addSprint } = useSprintStore();
  const { user: currentUser } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  if (!novaSprintOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.endDate) return;
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      alert('A data de término deve ser posterior à data de início.');
      return;
    }

    setLoading(true);
    try {
      const nextNumber =
        sprints.length > 0 ? Math.max(...sprints.map((s) => s.number)) + 1 : 1;

      const sprintData: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'> = {
        number: nextNumber,
        title: formData.title,
        description: formData.description,
        objective: formData.objective,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        status: 'planned',
        tags: [formData.type],
        storyPoints: { total: Number(formData.totalPoints), completed: 0 },
        demandIds: [],
        createdBy: currentUser?.uid ?? 'unknown',
      };

      const sprintId = await createSprint(sprintData);

      addSprint({
        id: sprintId,
        ...sprintData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      closeNovaSprint();
      setFormData(initialFormData);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        console.error('Erro ao criar sprint:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-sm"
        onClick={closeNovaSprint}
      />

      <div className="relative w-full max-w-xl bg-[#0f0f0f] border border-white/[0.05] rounded-[32px] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/5 rounded-2xl flex items-center justify-center border border-white/5 shadow-[0_0_20px_rgba(11,175,77,0.1)]">
              <Image
                src="/logo-energy.svg"
                alt="Energy"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Novo Ciclo de Sprint</h2>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-tighter">
                Planejamento e Metas • Energy Júnior
              </p>
            </div>
          </div>
          <button
            onClick={closeNovaSprint}
            className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-6 max-h-[75vh] overflow-y-auto no-scrollbar">

          {/* Título */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
              Título do Ciclo
            </label>
            <Input
              required
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Otimização Operacional Q2"
              className="bg-zinc-950 border-white/[0.03] focus:border-secondary h-12 text-sm rounded-xl px-4"
            />
          </div>

          {/* Objetivo */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
              Objetivo da Sprint
            </label>
            <div className="relative">
              <textarea
                required
                rows={3}
                value={formData.objective}
                onChange={(e) => setFormData((prev) => ({ ...prev, objective: e.target.value }))}
                className="w-full bg-zinc-950 border border-white/[0.03] rounded-2xl px-10 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-secondary transition-all resize-none"
                placeholder="Qual o foco principal dessa entrega?"
              />
              <Target className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-600 pointer-events-none" />
            </div>
          </div>

          {/* Descrição (opcional) */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
              Descrição <span className="text-zinc-600 normal-case font-medium">(opcional)</span>
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full bg-zinc-950 border border-white/[0.03] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-secondary transition-all resize-none"
              placeholder="Contexto adicional sobre este ciclo..."
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                Início
              </label>
              <div className="relative">
                <Input
                  required
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="bg-zinc-950 border-white/[0.03] h-12 text-xs rounded-xl pl-10"
                />
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                Previsão de Término
              </label>
              <div className="relative">
                <Input
                  required
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="bg-zinc-950 border-white/[0.03] h-12 text-xs rounded-xl pl-10"
                />
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Pontos e Tipo */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                Meta de Pontos
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min={1}
                  value={formData.totalPoints}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, totalPoints: Number(e.target.value) }))
                  }
                  className="bg-zinc-950 border-white/[0.03] h-12 text-sm rounded-xl px-4 pr-12 font-bold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600 uppercase pointer-events-none">
                  PTS
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                Tipo de Sprint
              </label>
              <div className="flex p-1 bg-zinc-950 border border-white/[0.03] rounded-xl h-12">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'Interno' }))}
                  className={cn(
                    'flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                    formData.type === 'Interno'
                      ? 'bg-white text-black shadow-lg'
                      : 'text-zinc-600 hover:text-zinc-400'
                  )}
                >
                  Interno
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'Externo' }))}
                  className={cn(
                    'flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                    formData.type === 'Externo'
                      ? 'bg-secondary text-white shadow-lg shadow-secondary/10'
                      : 'text-zinc-600 hover:text-zinc-400'
                  )}
                >
                  Externo
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              className="w-full h-14 rounded-2xl text-white font-black text-sm gap-3 transition-all active:scale-[0.98] shadow-lg shadow-secondary/20"
              loading={loading}
            >
              Criar Ciclo de Sprint
              <ArrowRight className="w-5 h-5 flex-shrink-0" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};