'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getUsers, getDemands, getSprints } from '@/lib/firestore';
import { User, Demand, Sprint } from '@/types';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Mail, Activity, Clock, Layers, Target, TrendingUp, AlertCircle, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AssessorHistoryModal } from '@/components/modals/AssessorHistoryModal';
import { AssessorEditModal } from '@/components/modals/AssessorEditModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
export default function AssessoresPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState<User | null>(null);
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    Promise.all([getUsers(), getDemands(), getSprints()]).then(([uData, dData, sData]) => {
      setUsers(uData);
      setDemands(dData);
      setSprints(sData);
      setLoading(false);
    });
  }, []);





  const groupedUsers = useMemo(() => {
    const activeMembers = users.filter(u => u.status !== 'desligado').sort((a, b) => a.name.localeCompare(b.name));

    const inactiveGroupsMap: Record<string, User[]> = {};
    const currentYear = new Date().getFullYear();

    users.forEach(u => {
      const startYear = new Date(u.joinDate || u.createdAt).getFullYear();
      const endYear = (u.status === 'desligado' && u.deactivatedAt)
        ? new Date(u.deactivatedAt).getFullYear()
        : currentYear;

      for (let y = startYear; y <= endYear; y++) {
        // Se o membro está ativo e o ano do loop é o ano atual, ele já está na "Gestão Atual".
        // Não precisamos criar um "Time Atual" duplicado no histórico para ele.
        if (y === currentYear && u.status !== 'desligado') continue;

        const label = `Time ${y}`;
        if (!inactiveGroupsMap[label]) inactiveGroupsMap[label] = [];
        if (!inactiveGroupsMap[label].some(m => m.uid === u.uid)) {
          inactiveGroupsMap[label].push(u);
        }
      }
    });

    const inactiveGroups = Object.entries(inactiveGroupsMap)
      .map(([label, members]) => ({
        label,
        members: members.sort((a, b) => a.name.localeCompare(b.name)),
        year: parseInt(label.replace('Time ', ''))
      }))
      .sort((a, b) => b.year - a.year);

    return { activeMembers, inactiveGroups };
  }, [users]);

  if (!mounted) return null;

  const renderUserCard = (user: User) => {
    const userDemands = demands.filter(d => d.assignees.includes(user.uid));
    const activeDemands = userDemands.filter(d => d.status !== 'concluido').length;
    const totalEstimated = userDemands.reduce((acc, d) => acc + d.estimatedHours, 0);

    const currentLimit = user.workloadLimit || 3;
    const isOverloaded = activeDemands >= currentLimit;

    return (
      <Card
        key={user.uid}
        hoverGlow
        variant="gradient"
        className="p-6 md:p-8 group rounded-[32px] flex flex-col h-full cursor-pointer transition-all active:scale-[0.98]"
        onClick={() => setSelectedUser(user)}
      >
        {/* Profile Section - Centered */}
        <div className="flex flex-col items-center text-center relative">
          {currentUser?.role === 'diretor' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEditModal(user);
              }}
              className="absolute top-0 right-0 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white border border-white/0 hover:border-white/5 transition-all opacity-0 group-hover:opacity-100 z-10"
              title="Editar Perfil"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="relative mb-6">
            <Avatar 
              src={user.photoURL} 
              alt={user.name} 
              size="lg" 
              className="border-2 border-white/5 h-20 w-20 md:h-24 md:w-24 shadow-2xl group-hover:scale-105 transition-transform duration-500" 
            />
            <div className={cn(
              "absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-[#0f0f0f] flex items-center justify-center transition-all",
              isOverloaded ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-secondary shadow-[0_0_10px_rgba(11,175,77,0.5)]"
            )}>
              {isOverloaded ? <AlertCircle className="w-3.5 h-3.5 text-white" /> : <Layers className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>

          <div className="space-y-1.5 w-full">
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">{user.name}</h3>
            <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 font-bold">
              <Mail className="w-3 h-3 text-zinc-700 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <p className="text-[12px] font-black text-secondary uppercase tracking-[0.15em] pt-1">
              {user.title || user.role} {user.area && <span className="text-zinc-600 font-bold mx-1.5">|</span>} {user.area && <span className="text-zinc-400">{user.area}</span>}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-zinc-900/40 rounded-2xl p-3 md:p-4 border border-white/[0.03] flex flex-col items-center justify-center group-hover:bg-zinc-900/60 transition-all">
            <Activity className="w-3.5 h-3.5 text-zinc-700 mb-2 group-hover:text-zinc-500 transition-colors" />
            <div className="text-lg md:text-xl font-black text-white leading-none">{activeDemands}</div>
            <div className="text-[8px] uppercase font-black text-zinc-600 mt-2 tracking-widest">Ativas</div>
          </div>

          <div className="bg-zinc-900/40 rounded-2xl p-3 md:p-4 border border-white/[0.03] flex flex-col items-center justify-center group-hover:bg-zinc-900/60 transition-all">
            <Clock className="w-3.5 h-3.5 text-zinc-700 mb-2 group-hover:text-zinc-500 transition-colors" />
            <div className="text-lg md:text-xl font-black text-white leading-none">{totalEstimated}h</div>
            <div className="text-[8px] uppercase font-black text-zinc-600 mt-2 tracking-widest">Horas</div>
          </div>

          <div className="bg-zinc-900/40 rounded-2xl p-3 md:p-4 border border-white/[0.03] flex flex-col items-center justify-center group-hover:bg-zinc-900/60 transition-all">
            <Layers className="w-3.5 h-3.5 text-zinc-700 mb-2 group-hover:text-zinc-500 transition-colors" />
            <div className="text-lg md:text-xl font-black text-white leading-none">
              {userDemands.filter(d => d.status === 'concluido').length}
            </div>
            <div className="text-[8px] uppercase font-black text-zinc-600 mt-2 tracking-widest">Entregas</div>
          </div>
        </div>

        {/* Workload Section */}
        <div className="mt-10 space-y-4 flex-1 flex flex-col justify-end">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 block">Carga de Trabalho</span>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3">
              <span className={cn(
                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-500",
                isOverloaded
                  ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                  : 'bg-secondary/10 text-secondary border-secondary/20 shadow-[0_0_10px_rgba(11,175,77,0.1)]'
              )}>
                {isOverloaded ? 'Sobrecarregado' : 'Estável'}
              </span>
            </div>
          </div>

          <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/[0.02] shadow-inner">
            <div
              className={cn(
                "h-full transition-all duration-1000 ease-out relative",
                isOverloaded
                  ? "bg-gradient-to-r from-red-500 to-orange-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  : "bg-gradient-to-r from-secondary to-green-400 shadow-[0_0_20px_rgba(11,175,77,0.3)]"
              )}
              style={{ width: `${Math.min((activeDemands / currentLimit) * 100, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/10 animate-[shimmer_2s_infinite] skew-x-[45deg]" />
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar pb-12 px-4 sm:px-6 lg:px-8">
      {/* Header Area */}
      <PageHeader
        title="Membros"
        description="Monitore a carga de trabalho, produtividade e disponibilidade dos membros da Energy Júnior em tempo real."
      >
        {/* Quick Stats Summary */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="px-5 py-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <div className="text-xs font-black text-white leading-none">{users.length}</div>
              <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mt-1">Membros</div>
            </div>
          </div>
          <div className="px-5 py-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <div className="text-xs font-black text-white leading-none">{demands.filter(d => d.status !== 'concluido').length}</div>
              <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mt-1">Ativas</div>
            </div>
          </div>
        </div>
      </PageHeader>

      <div className="pb-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[420px] bg-white/[0.02] rounded-[32px] animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Gestão Atual */}
            {groupedUsers.activeMembers.length > 0 && (
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-6">Gestão Atual</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {groupedUsers.activeMembers.map(renderUserCard)}
                </div>
              </div>
            )}

            {/* Pós-Juniores */}
            {groupedUsers.inactiveGroups.length > 0 && (
              <div className="space-y-8">
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-4">Pós-Juniores</h2>
                {groupedUsers.inactiveGroups.map(group => (
                  <div key={group.label} className="bg-white/[0.01] border border-white/5 rounded-[32px] p-6 md:p-8">
                    <h3 className="text-lg font-black text-secondary uppercase tracking-[0.2em] mb-6">{group.label}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                      {group.members.map(renderUserCard)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* History Modal Integration */}
      {selectedUser && (
        <AssessorHistoryModal
          user={selectedUser}
          demands={demands.filter(d => d.assignees.includes(selectedUser.uid))}
          sprints={sprints}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* Edit Assessor Modal */}
      {showEditModal && (
        <AssessorEditModal
          user={showEditModal}
          isOpen={!!showEditModal}
          onClose={() => setShowEditModal(null)}
          onUpdate={(updatedUser) => {
            setUsers(prev => prev.map(u => u.uid === updatedUser.uid ? updatedUser : u));
          }}
        />
      )}
    </div>
  );
}
