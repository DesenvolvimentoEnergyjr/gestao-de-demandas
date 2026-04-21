'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { updateUser } from '@/lib/firestore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Camera, Check, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConfiguracoesPage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [workloadLimit, setWorkloadLimit] = useState(3);
  const [photoURL, setPhotoURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      setName(user.name);
      setTitle(user.title || '');
      setWorkloadLimit(user.workloadLimit || 3);
      setPhotoURL(user.photoURL);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await updateUser(user.uid, { name, title, workloadLimit });

      // Update local store to reflect changes immediately
      setUser({ ...user, name, title, workloadLimit });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="h-full flex flex-col gap-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">Configurações</h2>
        <p className="text-zinc-500 mt-1 text-sm font-medium">Gerencie suas informações de perfil.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pb-12">
        {/* Left Col: Preview */}
        <div className="md:col-span-1">
          <Card className="p-8 flex flex-col items-center justify-center text-center gap-6 border-white/5 bg-white/[0.01] h-full rounded-[32px]">
            <div className="relative group">
              <Avatar
                src={photoURL}
                alt={name}
                size="lg"
                className="w-32 h-32 border-4 border-secondary/20 shadow-2xl shadow-secondary/10 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">{name || 'Seu Nome'}</h3>
              <p className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] mt-2">
                {title || user?.role || 'Assessor'}
              </p>
            </div>
          </Card>
        </div>

        {/* Right Col: Form */}
        <div className="md:col-span-2">
          <Card className="p-8 border-white/5 h-full flex flex-col justify-center rounded-[32px]">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Nome Completo</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como você quer ser chamado?"
                    className="bg-white/5 border-white/5 h-14 focus:bg-white/[0.08] transition-all rounded-2xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Cargo / Diretoria</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Assessor de Projetos"
                      className="bg-white/5 border-white/5 h-14 focus:bg-white/[0.08] transition-all rounded-2xl text-sm"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Meta de Demandas Ativas</label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={workloadLimit}
                        onChange={(e) => setWorkloadLimit(parseInt(e.target.value) || 1)}
                        className="bg-white/5 border-white/5 h-14 focus:bg-white/[0.08] transition-all rounded-2xl text-sm w-24 text-center"
                      />
                      <p className="text-[10px] text-zinc-500 font-medium leading-tight">
                        Define quando sua carga de trabalho será considerada &quot;Sobrecarregada&quot;.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 opacity-60">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">E-mail (Não editável)</label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="bg-white/[0.02] border-white/5 h-14 text-zinc-600 cursor-not-allowed rounded-2xl text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "h-12 px-8 min-w-[160px] transition-all gap-2 font-bold",
                    saved ? "bg-green-600 hover:bg-green-600" : "bg-secondary hover:bg-secondary/90"
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saved ? (
                    <>
                      <Check className="w-4 h-4" />
                      Salvo!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

        </div>
      </div>
    </div>
  );
}
