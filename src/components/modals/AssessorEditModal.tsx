'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { User as UserType } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { updateUser } from '@/lib/firestore';
import { toast } from '@/store/useToastStore';

interface AssessorEditModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedUser: UserType) => void;
}

export function AssessorEditModal({ user, isOpen, onClose, onUpdate }: AssessorEditModalProps) {
  const [name, setName] = useState(user.name);
  const [title, setTitle] = useState(user.title || '');
  const [area, setArea] = useState(user.area || '');
  const [history, setHistory] = useState(user.history || '');
  const [workloadLimit, setWorkloadLimit] = useState(user.workloadLimit || 3);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(user.name);
    setTitle(user.title || '');
    setArea(user.area || '');
    setHistory(user.history || '');
    setWorkloadLimit(user.workloadLimit || 3);
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedData = { name, title, area, history, workloadLimit };
      await updateUser(user.uid, updatedData);

      onUpdate({ ...user, ...updatedData });
      toast.success('Perfil atualizado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Error updating assessor:', error);
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Editar Perfil</h2>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Configurações de {user.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/5 text-zinc-500 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Nome Completo</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/5 border-white/5 h-14 focus:bg-white/[0.08] transition-all rounded-2xl text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Cargo Atual</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white/5 border-white/5 h-14 focus:bg-white/[0.08] transition-all rounded-2xl text-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Diretoria / Área</label>
              <Input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="bg-white/5 border-white/5 h-14 focus:bg-white/[0.08] transition-all rounded-2xl text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Trajetória (Cargos Anteriores)</label>
            <Input
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              placeholder="Ex: Assessor de Dev - Jan/2025 | Gerente - Jan/2026"
              className="bg-white/5 border-white/5 h-14 focus:bg-white/[0.08] transition-all rounded-2xl text-sm"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Meta de Demandas</label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min="1"
                max="20"
                value={workloadLimit}
                onChange={(e) => setWorkloadLimit(parseInt(e.target.value) || 1)}
                className="bg-white/5 border-white/5 h-14 focus:bg-white/[0.08] transition-all rounded-2xl text-sm w-24 text-center"
              />
              <p className="text-xs text-zinc-600 font-medium italic">Demandas simultâneas por projeto</p>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full h-14 rounded-2xl gap-2 transition-all active:scale-[0.98] shadow-lg shadow-secondary/20 font-black uppercase tracking-widest text-[11px]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
