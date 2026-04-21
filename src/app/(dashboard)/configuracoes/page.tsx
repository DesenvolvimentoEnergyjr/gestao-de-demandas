'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { updateUser, getUsers } from '@/lib/firestore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Camera, Check, Save, Loader2, UserX, AlertCircle } from 'lucide-react';
import { User, Role } from '@/types';
import { cn } from '@/lib/utils';

export default function ConfiguracoesPage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('');
  const [workloadLimit, setWorkloadLimit] = useState(3);
  const [photoURL, setPhotoURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Member Management State
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [mgmtLoading, setMgmtLoading] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState<User | null>(null);

  useEffect(() => {
    setMounted(true);
    if (user) {
      setName(user.name);
      setTitle(user.title || '');
      setArea(user.area || 'Geral');
      setWorkloadLimit(user.workloadLimit || 3);
      setPhotoURL(user.photoURL);

      if (user.role === 'diretor') {
        fetchUsers();
      }
    }
  }, [user]);

  const fetchUsers = async () => {
    setMgmtLoading(true);
    try {
      const data = await getUsers(false);
      setAllUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setMgmtLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await updateUser(user.uid, { name, title, area, workloadLimit });
      setUser({ ...user, name, title, area, workloadLimit });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (uid: string, newRole: Role) => {
    try {
      await updateUser(uid, { role: newRole });
      setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleDeactivateMember = async () => {
    if (!showDeactivateConfirm) return;
    const targetUid = showDeactivateConfirm.uid;
    
    setMgmtLoading(true);
    try {
      await updateUser(targetUid, { status: 'desligado' });
      setAllUsers(prev => prev.map(u => u.uid === targetUid ? { ...u, status: 'desligado' } : u));
      setShowDeactivateConfirm(null);
    } catch (error) {
      console.error('Error deactivating member:', error);
    } finally {
      setMgmtLoading(false);
    }
  };
  if (!mounted) return null;

  return (
    <div className="h-full flex flex-col gap-8 max-w-4xl mx-auto w-full overflow-y-auto pr-2 no-scrollbar">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">Configurações</h2>
        <p className="text-zinc-500 mt-1 text-sm font-medium">Gerencie suas informações de perfil.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pb-12">
        {/* Left Col: Preview */}
        <div className="md:col-span-1">
          <Card variant="gradient" className="p-8 flex flex-col items-center justify-center text-center gap-6 h-full">
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
          <Card variant="gradient" className="p-8 h-full flex flex-col justify-center">
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
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Cargo</label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={user?.role === 'assessor'}
                        placeholder="Ex: Assessor de Projetos"
                        className={cn(
                          "bg-white/5 border-white/5 h-14 transition-all rounded-2xl text-sm",
                          user?.role === 'assessor' ? "bg-white/[0.02] text-zinc-600 cursor-not-allowed" : "focus:bg-white/[0.08]"
                        )}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Diretoria / Área</label>
                      <Input
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="Ex: Projetos, Comercial..."
                        className="bg-white/5 border-white/5 h-14 focus:bg-white/[0.08] transition-all rounded-2xl text-sm"
                      />
                    </div>
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
                    <p className="text-xs text-zinc-600 font-medium">Demandas simultâneas por projeto</p>
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

      {user?.role === 'diretor' && (
        <div className="pb-20">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Gestão da Equipe</h2>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">Controle de acessos e cargos</p>
            </div>
            {mgmtLoading && <Loader2 className="w-5 h-5 text-secondary animate-spin" />}
          </div>

          <Card className="overflow-hidden border-white/5 rounded-[32px] bg-white/[0.01]">
            <div className="divide-y divide-white/[0.03]">
              {allUsers.map((member) => (
                <div key={member.uid} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-colors group">
                  <div className="flex items-center gap-4">
                    <Avatar src={member.photoURL} alt={member.name} size="md" className="border-2 border-white/5 shadow-xl" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm">{member.name}</span>
                        {member.status === 'desligado' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest border border-red-500/20">
                            Pós-Júnior
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 font-medium">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Role Toggle */}
                    <div className={cn(
                      "flex p-1 bg-zinc-950 border border-white/5 rounded-xl transition-opacity",
                      member.status === 'desligado' && "opacity-40 grayscale pointer-events-none"
                    )}>
                      {(['assessor', 'diretor'] as Role[]).map((roleOption) => (
                        <button
                          key={roleOption}
                          disabled={member.uid === user.uid}
                          onClick={() => handleUpdateRole(member.uid, roleOption)}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] transition-all",
                            member.role === roleOption 
                              ? "bg-white text-black shadow-lg" 
                              : "text-zinc-600 hover:text-zinc-400"
                          )}
                        >
                          {roleOption}
                        </button>
                      ))}
                    </div>

                    {/* Deactivate Button */}
                    {member.uid !== user.uid && member.status !== 'desligado' && (
                      <button 
                        onClick={() => setShowDeactivateConfirm(member)}
                        className="p-2.5 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-red-500/30 hover:text-red-500 border border-red-500/0 hover:border-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Desligar Membro"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Modal */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowDeactivateConfirm(null)} />
          <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-500/10 rounded-[20px] flex items-center justify-center mb-6 mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            
            <h3 className="text-xl font-black text-white text-center tracking-tight mb-2">Desligar Membro?</h3>
            <p className="text-sm text-zinc-400 text-center leading-relaxed">
              Você está prestes a desligar <span className="text-white font-bold">{showDeactivateConfirm.name}</span>. 
              Este membro será marcado como <span className="text-red-400 font-bold">Pós-Júnior</span> e perderá acesso à plataforma.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <Button 
                variant="ghost" 
                onClick={() => setShowDeactivateConfirm(null)}
                className="rounded-2xl border-white/5 hover:bg-white/5 font-bold h-12"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleDeactivateMember}
                className="rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold h-12 shadow-lg shadow-red-600/20"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
