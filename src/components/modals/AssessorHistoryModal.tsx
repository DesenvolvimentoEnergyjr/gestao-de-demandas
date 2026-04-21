'use client';

import React from 'react';
import { X, Calendar, ClipboardList, CheckCircle2, Clock, BarChart3, TrendingUp } from 'lucide-react';
import { User, Demand } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AssessorHistoryModalProps {
  user: User;
  demands: Demand[];
  onClose: () => void;
}

export function AssessorHistoryModal({ user, demands, onClose }: AssessorHistoryModalProps) {
  const sortedDemands = [...demands].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const completedDemands = demands.filter(d => d.status === 'concluido');
  const completionRate = demands.length > 0 ? Math.round((completedDemands.length / demands.length) * 100) : 0;
  const totalHours = demands.reduce((acc, d) => acc + d.estimatedHours, 0);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-3xl bg-[#1c1c1c] border border-white/[0.08] rounded-[40px] shadow-[0_0_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-500 flex flex-col max-h-[85vh]">
        
        {/* Header Section */}
        <div className="p-10 pb-6 border-b border-white/[0.03]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Avatar src={user.photoURL} alt={user.name} size="lg" className="w-20 h-20 border-4 border-white/5 shadow-2xl" />
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight leading-none">{user.name}</h2>
                <p className="text-sm font-black text-secondary uppercase tracking-[0.2em] mt-3">{user.title || user.role}</p>
                <div className="flex items-center gap-4 mt-5">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{user.email}</span>
                   </div>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.02] border border-white/5 text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Key Stats Row */}
          <div className="grid grid-cols-3 gap-6 mt-10">
             <div className="bg-zinc-900/30 rounded-3xl p-5 border border-white/[0.02] flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                   <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                   <div className="text-xl font-black text-white">{demands.length}</div>
                   <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Total Projetos</div>
                </div>
             </div>
             <div className="bg-zinc-900/30 rounded-3xl p-5 border border-white/[0.02] flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center">
                   <TrendingUp className="w-5 h-5 text-secondary" />
                </div>
                <div>
                   <div className="text-xl font-black text-white">{completionRate}%</div>
                   <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Taxa Entrega</div>
                </div>
             </div>
             <div className="bg-zinc-900/30 rounded-3xl p-5 border border-white/[0.02] flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                   <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                   <div className="text-xl font-black text-white">{totalHours}h</div>
                   <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Horas Totais</div>
                </div>
             </div>
          </div>
        </div>

        {/* List Section */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-10 pt-8 space-y-4">
           <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6">Log de Atividades 2026</h3>
           
           {sortedDemands.length === 0 ? (
             <div className="text-center py-20 bg-zinc-950/20 rounded-[32px] border border-dashed border-white/5">
                <ClipboardList className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
                <p className="text-sm font-bold text-zinc-600 uppercase tracking-wider">Nenhuma demanda registrada ainda</p>
             </div>
           ) : (
             sortedDemands.map((demand) => (
               <div 
                 key={demand.id}
                 className="group bg-zinc-950/40 hover:bg-zinc-900/40 p-5 rounded-[24px] border border-white/[0.02] hover:border-white/[0.05] transition-all flex items-center justify-between"
               >
                 <div className="flex items-center gap-4 flex-1 pr-4">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                      demand.status === 'concluido' ? "bg-secondary/10 text-secondary" : "bg-zinc-800 text-zinc-500"
                    )}>
                       {demand.status === 'concluido' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                       <h4 className="text-sm font-black text-white truncate tracking-tight mb-1">{demand.title}</h4>
                       <div className="flex items-center gap-3 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                          <Calendar className="w-3 h-3" />
                          {format(demand.createdAt, 'dd MMM yyyy', { locale: ptBR })}
                          <span>•</span>
                          <span className={cn(
                             demand.priority === 'urgente' ? "text-red-500" : 
                             demand.priority === 'alta' ? "text-orange-500" : 
                             "text-zinc-600"
                          )}>{demand.priority}</span>
                       </div>
                    </div>
                 </div>
                 <Badge variant={demand.status} className="shrink-0">{demand.status.replace('_', ' ')}</Badge>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}
