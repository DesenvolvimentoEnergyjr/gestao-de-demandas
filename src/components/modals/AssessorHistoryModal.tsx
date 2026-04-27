import { X, ClipboardList, CheckCircle2, Zap, AlertCircle, TrendingUp, Flag, MapPin } from 'lucide-react';
import { User, Demand, Sprint } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AssessorHistoryModalProps {
  user: User;
  demands: Demand[];
  sprints: Sprint[];
  onClose: () => void;
}

interface TimelineEvent {
  id: string;
  date: Date;
  type: 'entry' | 'assignment' | 'completion' | 'movement';
  title: string;
  description?: string;
  metadata?: {
    code?: string;
    sprint?: string;
    onTime?: boolean
  };
}

export function AssessorHistoryModal({ user, demands, sprints, onClose }: AssessorHistoryModalProps) {
  const completedDemands = demands.filter(d => d.status === 'concluido');

  // 1. Taxa de Entrega no Prazo (%)
  const onTimeDemands = completedDemands.filter(d => !d.deadline || new Date(d.updatedAt) <= new Date(d.deadline));
  const onTimeRate = completedDemands.length > 0 ? Math.round((onTimeDemands.length / completedDemands.length) * 100) : 0;

  // 2. Tempo Médio de Ciclo (dias)
  const cycleTimes = completedDemands.map(d => differenceInDays(new Date(d.updatedAt), new Date(d.createdAt)));
  const avgCycleTime = cycleTimes.length > 0 ? Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length) : 0;

  // 3. Demandas Estagnadas
  const activeDemands = demands.filter(d => d.status === 'em_progresso' || d.status === 'em_revisao');
  const stagnantCount = activeDemands.filter(d => differenceInDays(new Date(), new Date(d.updatedAt)) >= 5).length;

  // --- Lógica da Timeline de Histórico ---
  const timelineEvents = (() => {
    const events: TimelineEvent[] = [];

    // Evento de Entrada
    events.push({
      id: 'entry-' + user.uid,
      date: user.joinDate || user.createdAt,
      type: 'entry',
      title: 'Ingresso na Energy Júnior',
      description: `Início da jornada na diretoria de ${user.area || 'Operações'}.`,
    });

    // Eventos de Demandas
    demands.forEach((d) => {
      // Atribuição
      events.push({
        id: 'assign-' + d.id,
        date: d.createdAt,
        type: 'assignment',
        title: 'Nova Demanda Atribuída',
        description: d.title,
        metadata: { code: d.code }
      });

      // Conclusão
      if (d.status === 'concluido') {
        const sprint = sprints.find(s => s.id === d.sprintId);
        events.push({
          id: 'complete-' + d.id,
          date: d.updatedAt,
          type: 'completion',
          title: 'Demanda Concluída',
          description: d.title,
          metadata: {
            sprint: sprint ? `${sprint.number} • ${sprint.title}` : 'Sem Sprint',
            onTime: !d.deadline || d.updatedAt <= d.deadline
          }
        });
      }
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  })();

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4">
      <div
        className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl bg-bg-section border-gradient rounded-2xl sm:rounded-[2rem] md:rounded-[40px] shadow-[0_0_100px_-20px_rgba(11,175,77,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">

        {/* Header Section */}
        <div className="p-4 sm:p-5 md:p-10 pb-5 sm:pb-6 border-b border-white/[0.03] relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 text-zinc-500 hover:text-white hover:bg-white/5 transition-all z-10"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center gap-3 sm:gap-4 md:gap-6 pr-10 sm:pr-12 md:pr-16">
            <Avatar src={user.photoURL} alt={user.name} size="lg" className="w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 border-2 sm:border-4 border-white/5 shadow-2xl shrink-0" />
            <div className="min-w-0">
              <h2 className="text-xl md:text-3xl font-black text-white tracking-tight leading-tight truncate">{user.name}</h2>
              <p className="text-[10px] md:text-sm font-black text-secondary uppercase tracking-[0.15em] md:tracking-[0.2em] mt-1 md:mt-3">{user.title || user.role}</p>
              <div className="flex items-center gap-2 mt-2 md:mt-4">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                <span className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">{user.email}</span>
                {user.area && (
                  <>
                    <span className="text-zinc-800 mx-1">•</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-secondary uppercase tracking-widest truncate">{user.area}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-6 mt-6 md:mt-10">
            <div className="bg-zinc-900/30 rounded-2xl md:rounded-3xl p-3 md:p-5 border border-white/[0.02] flex items-center gap-3 md:gap-4 group hover:bg-zinc-900/50 transition-all">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-[#0baf4d]/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-[#0baf4d]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base md:text-xl font-black text-white leading-none mb-1">{onTimeRate}%</div>
                <div className="text-[7px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-tight">No Prazo</div>
              </div>
            </div>

            <div className="bg-zinc-900/30 rounded-2xl md:rounded-3xl p-3 md:p-5 border border-white/[0.02] flex items-center gap-3 md:gap-4 group hover:bg-zinc-900/50 transition-all">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base md:text-xl font-black text-white leading-none mb-1">{avgCycleTime}d</div>
                <div className="text-[7px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-tight">Ciclo Médio</div>
              </div>
            </div>

            <div className="bg-zinc-900/30 rounded-2xl md:rounded-3xl p-3 md:p-5 border border-white/[0.02] flex items-center gap-3 md:gap-4 group hover:bg-zinc-900/50 transition-all">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base md:text-xl font-black text-white leading-none mb-1">{stagnantCount}</div>
                <div className="text-[7px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-tight">Demandas Estagnadas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 md:p-10 pt-6">
          
          {/* User History/Trajetória block if exists - MOVED TO TOP */}
          {user.history && (
            <div className="mb-10 p-6 bg-zinc-950/40 rounded-3xl border border-white/[0.03] border-l-secondary border-l-4">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-4 h-4 text-secondary" />
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Trajetória Profissional</h3>
              </div>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed italic">
                {user.history}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Linha do Tempo</h3>
            <div className="px-3 py-1 bg-zinc-950 rounded-full border border-white/5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              {timelineEvents.length} Eventos
            </div>
          </div>

          <div className="relative space-y-8 pl-4">
            {/* Vertical Line */}
            <div className="absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-secondary/50 via-zinc-800 to-transparent" />

            {timelineEvents.map((event) => (
              <div key={event.id} className="relative pl-8 group">
                {/* Node dot */}
                <div className={cn(
                  "absolute left-[-17px] top-1.5 w-8 h-8 rounded-full border-4 border-[#0f0f0f] z-10 flex items-center justify-center transition-all group-hover:scale-110",
                  event.type === 'entry' ? "bg-primary text-black" :
                    event.type === 'assignment' ? "bg-zinc-800 text-zinc-400" :
                      event.type === 'completion' ? "bg-secondary text-white shadow-[0_0_15px_rgba(11,175,77,0.3)]" :
                        "bg-zinc-900 text-zinc-600"
                )}>
                  {event.type === 'entry' && <MapPin className="w-3.5 h-3.5" />}
                  {event.type === 'assignment' && <ClipboardList className="w-3.5 h-3.5" />}
                  {event.type === 'completion' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                      {format(event.date, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </span>
                    {event.type === 'completion' && event.metadata?.onTime && (
                      <span className="text-[8px] font-black text-secondary uppercase bg-secondary/10 px-2 py-0.5 rounded-md">No Prazo</span>
                    )}
                  </div>

                  <h4 className="text-sm font-black text-white tracking-tight group-hover:text-secondary transition-colors">
                    {event.title}
                  </h4>

                  {event.description && (
                    <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed max-w-lg italic">
                      &quot;{event.description}&quot;
                    </p>
                  )}

                  {event.metadata?.sprint && (
                    <div className="mt-2 flex items-center gap-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest bg-white/5 w-fit px-3 py-1 rounded-lg">
                      <Flag className="w-3 h-3 text-secondary" />
                      {event.metadata.sprint}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
