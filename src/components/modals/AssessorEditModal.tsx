'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { User as UserType } from '@/types';
import { format } from 'date-fns';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { updateUser } from '@/lib/firestore';
import { toast } from '@/store/useToastStore';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [joinDate, setJoinDate] = useState(user.joinDate ? format(user.joinDate, 'yyyy-MM-dd') : '');
  const [workloadLimit, setWorkloadLimit] = useState(user.workloadLimit || 3);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(user.name);
    setTitle(user.title || '');
    setArea(user.area || '');
    setHistory(user.history || '');
    setJoinDate(user.joinDate ? format(user.joinDate, 'yyyy-MM-dd') : '');
    setWorkloadLimit(user.workloadLimit || 3);
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedData: Partial<UserType> = {
        name,
        title,
        area,
        history,
        workloadLimit,
        joinDate: joinDate ? new Date(joinDate + 'T12:00:00') : undefined
      };
      await updateUser(user.uid, updatedData);

      onUpdate({ ...user, ...updatedData } as UserType);
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-sm"
            onClick={onClose}
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
                  <h2 className="text-lg md:text-xl font-black text-white tracking-tight truncate">Editar Perfil</h2>
                  <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter truncate">
                    Energy Júnior • Configurações de {user.name}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 md:p-8 pt-4 md:pt-6 space-y-6 md:space-y-8 flex-1 overflow-y-auto no-scrollbar">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Nome Completo</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-950 border-white/[0.03] focus:border-secondary h-12 text-sm rounded-xl px-4"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Cargo Atual</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-zinc-950 border-white/[0.03] focus:border-secondary h-12 text-sm rounded-xl px-4"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Diretoria</label>
                  <Input
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="bg-zinc-950 border-white/[0.03] focus:border-secondary h-12 text-sm rounded-xl px-4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Trajetória</label>
                  <textarea
                    rows={4}
                    value={history}
                    onChange={(e) => setHistory(e.target.value)}
                    placeholder="Ex: Assessor de Dev - Jan/2025 | Gerente - Jan/2026"
                    className="w-full bg-zinc-950 border border-white/[0.03] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-secondary transition-all resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Data de Ingresso</label>
                  <Input
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="bg-zinc-950 border-white/[0.03] focus:border-secondary h-12 text-sm rounded-xl px-4"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Meta de Demandas</label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={workloadLimit}
                    onChange={(e) => setWorkloadLimit(parseInt(e.target.value) || 1)}
                    className="bg-zinc-950 border-white/[0.03] h-12 text-sm rounded-xl px-4 w-24 text-center"
                  />
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest italic">Simultâneas por projeto</p>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  className="w-full h-14 rounded-2xl gap-3 transition-all active:scale-[0.98] shadow-lg shadow-secondary/20 font-black text-sm"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Salvar Alterações
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>

                <p className="text-[9px] text-center text-zinc-600 uppercase tracking-[0.3em] font-black leading-relaxed mt-6">
                  Sistema de Gestão Energy Júnior — 2026
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
