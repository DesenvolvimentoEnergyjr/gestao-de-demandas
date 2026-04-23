'use client';

import React, { useEffect, useState } from 'react';
import { getUsers, getDemands } from '@/lib/firestore';
import { User, Demand } from '@/types';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Mail, Activity, Clock, Layers, Target, TrendingUp, AlertCircle, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AssessorHistoryModal } from '@/components/modals/AssessorHistoryModal';
import { PageHeader } from '@/components/layout/PageHeader';

export default function AssessoresPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    setMounted(true);
    Promise.all([getUsers(), getDemands()]).then(([uData, dData]) => {
      setUsers(uData);
      setDemands(dData);
      setLoading(false);
    });
  }, []);

  const handleUpdateLimit = async (uid: string, newLimit: number) => {
    // Optimistic update
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, workloadLimit: newLimit } : u));
    
    try {
      const { updateUser } = await import('@/lib/firestore');
      await updateUser(uid, { workloadLimit: newLimit });
    } catch (error) {
      console.error('Error updating workload limit:', error);
    }
  };

  if (!mounted) return null;

  return (
    <div className="h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar pb-12 px-4 sm:px-6 lg:px-8">
      {/* Header Area */}
      <PageHeader 
        title="Equipe de Assessores" 
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-10">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-[420px] bg-white/[0.02] rounded-[32px] animate-pulse border border-white/5" />
          ))
        ) : users.map(user => {
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

              {/* Profile Section */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  <Avatar src={user.photoURL} alt={user.name} size="lg" className="border-2 border-white/5 h-16 w-16 md:h-20 md:w-20 shadow-2xl group-hover:scale-105 transition-transform duration-500" />
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-[#0f0f0f] flex items-center justify-center transition-all",
                    isOverloaded ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-secondary shadow-[0_0_10px_rgba(11,175,77,0.5)]"
                  )}>
                    {isOverloaded ? <AlertCircle className="w-3 h-3 text-white" /> : <Layers className="w-3 h-3 text-white" />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-xl font-black text-white truncate tracking-tight">{user.name}</h3>
                  <p className="text-[12px] font-black text-secondary uppercase tracking-[0.15em] mt-1.5 leading-none">
                    {user.title || user.role}
                  </p>
                  <div className="mt-4 flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-bold truncate">
                      <Mail className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.history && (
                      <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest truncate pl-5">
                        {user.history}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mt-10">
                <div className="bg-zinc-900/40 rounded-2xl p-3 md:p-4 border border-white/[0.03] text-center group-hover:bg-zinc-900/60 transition-all">
                  <div className="flex justify-center mb-2">
                    <Activity className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                  </div>
                  <div className="text-lg md:text-xl font-black text-white leading-none">{activeDemands}</div>
                  <div className="text-[8px] uppercase font-black text-zinc-600 mt-2 tracking-widest">Ativas</div>
                </div>

                <div className="bg-zinc-900/40 rounded-2xl p-3 md:p-4 border border-white/[0.03] text-center group-hover:bg-zinc-900/60 transition-all">
                  <div className="flex justify-center mb-2">
                    <Clock className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                  </div>
                  <div className="text-lg md:text-xl font-black text-white leading-none">{totalEstimated}h</div>
                  <div className="text-[8px] uppercase font-black text-zinc-600 mt-2 tracking-widest">Horas</div>
                </div>

                <div className="bg-zinc-900/40 rounded-2xl p-3 md:p-4 border border-white/[0.03] text-center group-hover:bg-zinc-900/60 transition-all">
                  <div className="flex justify-center mb-2">
                    <Layers className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                  </div>
                  <div className="text-lg md:text-xl font-black text-white leading-none">{userDemands.length}</div>
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
                    <div 
                      className="flex items-center bg-white/[0.03] border border-white/5 rounded-full px-2 py-1 gap-4 transition-all hover:bg-white/[0.05]"
                      onClick={(e) => e.stopPropagation()} 
                    >
                      <button 
                         onClick={() => handleUpdateLimit(user.uid, Math.max(1, currentLimit - 1))}
                         className="w-5 h-5 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-zinc-600 leading-none mb-0.5">META</span>
                        <span className="text-[10px] font-black text-white leading-none">{currentLimit}</span>
                      </div>

                      <button 
                         onClick={() => handleUpdateLimit(user.uid, currentLimit + 1)}
                         className="w-5 h-5 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    
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
        })}
      </div>

      {/* History Modal Integration */}
      {selectedUser && (
        <AssessorHistoryModal
          user={selectedUser}
          demands={demands.filter(d => d.assignees.includes(selectedUser.uid))}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
