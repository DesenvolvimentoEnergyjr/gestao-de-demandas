'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import {
  updateUser,
  getUsers,
  createMemberTimelineEvent,
  getInstitutionalAccounts,
  createInstitutionalAccount,
  updateInstitutionalAccount,
  deleteInstitutionalAccount,
} from '@/lib/firestore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Camera, Check, Loader2, UserX, AlertCircle, ChevronDown, ChevronRight, Trash2, Lock } from 'lucide-react';
import { User, Role, InstitutionalAccount } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function ConfiguracoesPage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('');
  const [historyList, setHistoryList] = useState<{ role: string; date: string }[]>([]);
  const [workloadLimit, setWorkloadLimit] = useState(3);
  const [joinDate, setJoinDate] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Member Management State
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [mgmtLoading, setMgmtLoading] = useState(false);

  // Institutional Accounts State
  const [institutionalAccounts, setInstitutionalAccounts] = useState<InstitutionalAccount[]>([]);
  const [iaLoading, setIaLoading] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState<User | null>(null);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'pos_junior' | 'gestao_atual'>('gestao_atual');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'Gestão Atual': true });

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const groupedUsers = useMemo(() => {
    if (activeFilter !== 'todos') {
      let list = [...allUsers];
      if (activeFilter === 'pos_junior') list = list.filter(u => u.status === 'desligado');
      if (activeFilter === 'gestao_atual') list = list.filter(u => u.status === 'ativo');
      return [{ label: '', members: list.sort((a, b) => a.name.localeCompare(b.name)) }];
    }

    const groupsMap: Record<string, User[]> = {};
    const currentYear = new Date().getFullYear();

    allUsers.forEach(u => {
      const startYear = new Date(u.createdAt).getFullYear();
      const endYear = u.status === 'ativo' ? currentYear : (u.deactivatedAt ? new Date(u.deactivatedAt).getFullYear() : new Date(u.updatedAt).getFullYear());

      for (let y = startYear; y <= endYear; y++) {
        // If it's the current year and the user is active, they go to "Gestão Atual"
        // Otherwise they go to "Time YYYY"
        const label = (y === currentYear && u.status === 'ativo') ? 'Gestão Atual' : `Time ${y}`;
        if (!groupsMap[label]) groupsMap[label] = [];
        groupsMap[label].push(u);
      }
    });

    return Object.entries(groupsMap)
      .map(([label, members]) => ({
        label,
        members: members.sort((a, b) => a.name.localeCompare(b.name)),
        year: label === 'Gestão Atual' ? 9999 : parseInt(label.replace('Time ', ''))
      }))
      .sort((a, b) => b.year - a.year);
  }, [allUsers, activeFilter]);

  useEffect(() => {
    setMounted(true);
    if (user) {
      setName(user.name);
      setTitle(user.title || '');
      setArea(user.area || 'Geral');
      setHistoryList(() => {
        if (Array.isArray(user.history)) return user.history;
        if (typeof user.history === 'string' && user.history.trim()) {
          return [{ role: user.history, date: '' }];
        }
        return [];
      });
      setWorkloadLimit(user.workloadLimit || 3);
      
      let initialJoinDate = '';
      if (user.joinDate) {
        if (typeof user.joinDate === 'string') {
          // Backward compatibility for old yyyy-MM format
          initialJoinDate = (user.joinDate as string).length === 7 ? `${user.joinDate}-01` : (user.joinDate as string);
        } else if (user.joinDate instanceof Date && !isNaN(user.joinDate.getTime())) {
          initialJoinDate = format(user.joinDate, 'yyyy-MM-dd');
        } else if ((user.joinDate as unknown as { toDate?: () => Date }).toDate) {
          initialJoinDate = format((user.joinDate as unknown as { toDate: () => Date }).toDate(), 'yyyy-MM-dd');
        }
      }
      setJoinDate(initialJoinDate);
      
      setPhotoURL(user.photoURL);

      if (user.role === 'diretor') {
        fetchUsers();
        fetchInstitutionalAccounts();
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

  const fetchInstitutionalAccounts = async () => {
    setIaLoading(true);
    try {
      const data = await getInstitutionalAccounts();
      setInstitutionalAccounts(data);
    } catch (error) {
      console.error('Error fetching institutional accounts:', error);
    } finally {
      setIaLoading(false);
    }
  };

  const handleAddInstitutionalAccount = async () => {
    try {
      const id = await createInstitutionalAccount({ email: '', label: '', assignedUserId: null });
      setInstitutionalAccounts((prev) => [
        ...prev,
        { id, email: '', label: '', assignedUserId: null, createdAt: new Date(), updatedAt: new Date() },
      ]);
    } catch (error) {
      console.error('Error creating institutional account:', error);
    }
  };

  const updateLocalInstitutionalAccount = (id: string, field: 'email' | 'label', value: string) => {
    setInstitutionalAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const persistInstitutionalAccountField = async (id: string, field: 'email' | 'label', value: string) => {
    try {
      await updateInstitutionalAccount(id, { [field]: value });
    } catch (error) {
      console.error('Error updating institutional account:', error);
    }
  };

  const handleAssignInstitutionalAccount = async (id: string, uid: string) => {
    const assignedUserId = uid || null;
    setInstitutionalAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, assignedUserId } : a)));
    try {
      await updateInstitutionalAccount(id, { assignedUserId });
    } catch (error) {
      console.error('Error assigning institutional account:', error);
    }
  };

  const handleDeleteInstitutionalAccount = async (id: string) => {
    setInstitutionalAccounts((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteInstitutionalAccount(id);
    } catch (error) {
      console.error('Error deleting institutional account:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const joinDateObj = joinDate ? new Date(joinDate + 'T12:00:00') : undefined;
      await updateUser(user.uid, { name, title, area, history: historyList, workloadLimit, joinDate: joinDateObj });
      setUser({ ...user, name, title, area, history: historyList, workloadLimit, joinDate: joinDateObj });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (uid: string, newRole: Role) => {
    const member = allUsers.find(u => u.uid === uid);
    if (!member || member.role === newRole) return;

    try {
      await updateUser(uid, { role: newRole });

      // Register role change in the timeline
      const roleLabels: Record<string, string> = { assessor: 'Assessor', diretor: 'Diretor' };
      await createMemberTimelineEvent({
        userId: uid,
        date: new Date(),
        type: 'cargo',
        title: `Promovido a ${roleLabels[newRole] || newRole}`,
        description: `Mudança de ${roleLabels[member.role] || member.role} para ${roleLabels[newRole] || newRole}.`,
      }).catch((e: unknown) => console.error('Erro ao criar evento de cargo na timeline:', e));

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
      const now = new Date();
      await updateUser(targetUid, { status: 'desligado', deactivatedAt: now });

      // Register member deactivation in the timeline
      await createMemberTimelineEvent({
        userId: targetUid,
        date: now,
        type: 'egresso',
        title: `Desligamento da ${process.env.NEXT_PUBLIC_COMPANY_NAME || 'Empresa Júnior'}`,
        description: `Fim da jornada como ${showDeactivateConfirm.title || showDeactivateConfirm.role} na diretoria de ${showDeactivateConfirm.area || 'Operações'}.`,
      }).catch((e: unknown) => console.error('Erro ao criar evento de egresso na timeline:', e));

      setAllUsers(prev => prev.map(u => u.uid === targetUid ? { ...u, status: 'desligado', deactivatedAt: now } : u));
      setShowDeactivateConfirm(null);
    } catch (error) {
      console.error('Error deactivating member:', error);
    } finally {
      setMgmtLoading(false);
    }
  };
  if (!mounted) return null;

  return (
    <div className="h-full flex flex-col gap-8 max-w-4xl mx-auto w-full overflow-y-auto px-4 md:px-0 pb-12 no-scrollbar">


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch pb-6 md:pb-12">
        {/* Left Col: Preview */}
        <div className="md:col-span-1">
          <Card variant="gradient" className="p-6 md:p-8 flex flex-col items-center justify-center text-center gap-6 h-full">
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
          <Card variant="gradient" className="p-6 md:p-8 h-full flex flex-col justify-center">
            <form onSubmit={handleSave} className="space-y-6 md:space-y-8 flex-1">
              <div className="space-y-3">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Nome Completo</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como você quer ser chamado?"
                    className="bg-zinc-950 border-white/[0.03] focus:border-secondary h-12 text-sm rounded-xl px-4"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Cargo</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={user?.role === 'assessor'}
                      placeholder="Ex: Assessor de Projetos"
                      className={cn(
                        "bg-zinc-950 border-white/[0.03] focus:border-secondary h-12 text-sm rounded-xl px-4",
                        user?.role === 'assessor' ? "opacity-60 cursor-not-allowed" : ""
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Diretoria</label>
                    <Input
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="Ex: Projetos, Comercial..."
                      className="bg-zinc-950 border-white/[0.03] focus:border-secondary h-12 text-sm rounded-xl px-4"
                    />
                  </div>
                </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Timeline de Cargos</label>
                    <button
                      type="button"
                      onClick={() => setHistoryList([...historyList, { role: '', date: '' }])}
                      className="text-[10px] font-black text-white bg-secondary/20 hover:bg-secondary/40 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span className="text-secondary">+</span> Adicionar Cargo
                    </button>
                  </div>

                  <div className="space-y-3">
                    {historyList.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 bg-zinc-950 border border-white/[0.03] p-3 rounded-2xl">
                        <div className="flex-1 space-y-3 sm:space-y-0 sm:flex sm:gap-3">
                          <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Cargo</label>
                            <Input
                              value={item.role}
                              onChange={(e) => {
                                const newHistory = [...historyList];
                                newHistory[index].role = e.target.value;
                                setHistoryList(newHistory);
                              }}
                              placeholder="Ex: Assessor de Dev"
                              className="h-10 text-xs bg-zinc-900 border-none"
                            />
                          </div>
                          <div className="w-full sm:w-[200px] space-y-1">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Data</label>
                            <DatePicker
                              value={item.date}
                              align="right"
                              onChange={(date) => {
                                const newHistory = [...historyList];
                                newHistory[index].date = date;
                                setHistoryList(newHistory);
                              }}
                              className="h-10 text-xs bg-zinc-900 border-none"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newHistory = historyList.filter((_, i) => i !== index);
                            setHistoryList(newHistory);
                          }}
                          className="w-10 h-10 shrink-0 flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                    ))}

                    {historyList.length === 0 && (
                      <div className="text-center py-6 border border-dashed border-white/10 rounded-2xl">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nenhum cargo adicionado na timeline.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Data de Ingresso</label>
                    <DatePicker
                      value={joinDate}
                      onChange={(date) => setJoinDate(date)}
                      className="bg-zinc-950 border-white/[0.03] focus:border-secondary h-12 text-sm rounded-xl px-4"
                    />
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
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">E-mail (Não editável)</label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="bg-zinc-950 border-white/[0.03] h-12 text-zinc-600 cursor-not-allowed rounded-xl px-4 text-sm opacity-60"
                  />
                </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  className={cn(
                    "w-full h-14 rounded-2xl gap-3 transition-all active:scale-[0.98] shadow-lg shadow-secondary/20 font-black text-sm",
                    saved && "bg-none bg-green-600 shadow-[0_0_20px_rgba(22,163,74,0.3)]"
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : saved ? (
                    <>
                      <Check className="w-5 h-5" />
                      Salvo com Sucesso!
                    </>
                  ) : (
                    <>
                      Salvar Alterações
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

        </div>
      </div>

      {user?.role === 'diretor' && (
        <div className="pb-6 md:pb-12">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Contas Institucionais</h2>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">Logins compartilhados bloqueados</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleAddInstitutionalAccount}
                className="text-[10px] font-black text-white bg-secondary/20 hover:bg-secondary/40 px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0"
              >
                <span className="text-secondary">+</span> Adicionar Conta
              </button>
              {iaLoading && <Loader2 className="w-5 h-5 text-secondary animate-spin" />}
            </div>
          </div>

          <Card className="border-white/5 rounded-[32px] bg-white/[0.01]">
            {institutionalAccounts.length === 0 ? (
              <div className="text-center py-10 px-6">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nenhuma conta institucional cadastrada</p>
                <p className="text-xs text-zinc-600 mt-2 max-w-md mx-auto leading-relaxed">
                  Cadastre e-mails compartilhados (ex: presidencia@energyjr.com) para bloquear o login por eles e sugerir o e-mail pessoal de quem ocupa o cargo hoje.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {institutionalAccounts.map((account) => {
                  const assignedUser = allUsers.find((u) => u.uid === account.assignedUserId);

                  return (
                    <div key={account.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4 text-red-400" />
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Cargo</label>
                          <Input
                            value={account.label}
                            onChange={(e) => updateLocalInstitutionalAccount(account.id, 'label', e.target.value)}
                            onBlur={(e) => persistInstitutionalAccountField(account.id, 'label', e.target.value)}
                            placeholder="Ex: Presidência"
                            className="h-10 text-xs bg-zinc-950 border-white/[0.03]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">E-mail bloqueado</label>
                          <Input
                            value={account.email}
                            onChange={(e) => updateLocalInstitutionalAccount(account.id, 'email', e.target.value)}
                            onBlur={(e) => persistInstitutionalAccountField(account.id, 'email', e.target.value)}
                            placeholder="Ex: presidencia@energyjr.com"
                            className="h-10 text-xs bg-zinc-950 border-white/[0.03]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Responsável Atual</label>
                          <div className="flex items-center gap-2">
                            {assignedUser && (
                              <Avatar
                                src={assignedUser.photoURL}
                                alt={assignedUser.name}
                                size="sm"
                                className="shrink-0 border border-secondary/30"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <Select
                                value={account.assignedUserId || ''}
                                onChange={(e) => handleAssignInstitutionalAccount(account.id, e.target.value)}
                                placeholder="Quem ocupa hoje?"
                                className="h-10 text-xs bg-zinc-950 border-white/[0.03]"
                              >
                                <option value="">Ninguém vinculado</option>
                                {allUsers
                                  .filter((u) => u.status === 'ativo')
                                  .map((u) => (
                                    <option key={u.uid} value={u.uid}>
                                      {u.name}
                                    </option>
                                  ))}
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteInstitutionalAccount(account.id)}
                        className="w-10 h-10 shrink-0 self-center flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {user?.role === 'diretor' && (
        <div className="pb-20">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Gestão da Equipe</h2>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">Controle de acessos e cargos</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex bg-zinc-950/50 border border-white/5 rounded-2xl p-1 gap-1">
                {(['gestao_atual', 'pos_junior', 'todos'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                      activeFilter === f
                        ? "bg-white text-black shadow-lg"
                        : "text-zinc-600 hover:text-zinc-400"
                    )}
                  >
                    {f === 'gestao_atual' ? 'Gestão Atual' : f === 'pos_junior' ? 'Pós-Juniores' : 'Todos'}
                  </button>
                ))}
              </div>
              {mgmtLoading && <Loader2 className="w-5 h-5 text-secondary animate-spin" />}
            </div>
          </div>

          <Card className="overflow-hidden border-white/5 rounded-[32px] bg-white/[0.01]">
            <div className="flex flex-col">
              {groupedUsers.map((group, groupIdx) => {
                const isExpanded = activeFilter !== 'todos' || expandedGroups[group.label] || group.label === 'Gestão Atual';

                return (
                  <div key={group.label || 'single'} className={cn(groupIdx > 0 && "border-t border-white/[0.05]")}>
                    {group.label && (
                      <button
                        onClick={() => toggleGroup(group.label)}
                        className="w-full px-6 py-4 bg-white/[0.02] border-b border-white/[0.03] flex items-center justify-between hover:bg-white/[0.04] transition-colors group/header"
                      >
                        <div className="flex items-center gap-3">
                          <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">{group.label}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-white/5 text-zinc-500 text-[8px] font-black uppercase tracking-widest">
                            {group.members.length} {group.members.length === 1 ? 'Membro' : 'Membros'}
                          </span>
                        </div>
                        {activeFilter === 'todos' && (
                          <div className="text-zinc-600 group-hover/header:text-zinc-400 transition-colors">
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </div>
                        )}
                      </button>
                    )}

                    {isExpanded && (
                      <div className="divide-y divide-white/[0.03] animate-in slide-in-from-top-2 duration-300">
                        {group.members.map((member) => (
                          <div key={member.uid} className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/[0.01] transition-colors group gap-4">
                            <div className="flex items-center gap-4">
                              <Avatar src={member.photoURL} alt={member.name} size="md" className="border-2 border-white/5 shadow-xl shrink-0" />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-black text-white text-sm truncate">{member.name}</span>
                                  {member.status === 'desligado' && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest border border-red-500/20 shrink-0">
                                      Pós-Júnior
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-500 font-medium truncate">{member.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
                              {/* Deactivate Button */}
                              {member.uid !== user.uid && member.status !== 'desligado' && (
                                <button
                                  onClick={() => setShowDeactivateConfirm(member)}
                                  className="group/btn relative p-2.5 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-red-500/30 hover:text-red-500 border border-red-500/0 hover:border-red-500/10 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
                                >
                                  <UserX className="w-4 h-4" />
                                  {/* Tooltip */}
                                  <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl whitespace-nowrap hidden group-hover/btn:block">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest text-center leading-tight">Desligar Membro</p>
                                  </div>
                                </button>
                              )}

                              {/* Role Toggle */}
                              <div className={cn(
                                "flex p-1 bg-zinc-950 border border-white/5 rounded-xl transition-opacity flex-1 sm:flex-none",
                                member.status === 'desligado' && "opacity-40 grayscale pointer-events-none"
                              )}>
                                {(['assessor', 'diretor'] as Role[]).map((roleOption) => (
                                  <button
                                    key={roleOption}
                                    disabled={member.uid === user.uid}
                                    onClick={() => handleUpdateRole(member.uid, roleOption)}
                                    className={cn(
                                      "flex-1 sm:flex-none px-3 md:px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] transition-all",
                                      member.role === roleOption
                                        ? "bg-white text-black shadow-lg"
                                        : "text-zinc-600 hover:text-zinc-400"
                                    )}
                                  >
                                    {roleOption}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
