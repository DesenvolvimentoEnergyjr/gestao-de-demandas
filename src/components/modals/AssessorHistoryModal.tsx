'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, ClipboardList, CheckCircle2, Zap, AlertCircle, TrendingUp, Flag, MapPin, Pencil, Trash2, Plus, Save, XCircle, Briefcase, LogOut, FolderKanban, MoreHorizontal, Loader2 } from 'lucide-react';
import { User, Demand, Sprint, MemberTimelineEvent, MemberTimelineEventType } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import {
  subscribeToMemberTimeline,
  createMemberTimelineEvent,
  updateMemberTimelineEvent,
  deleteMemberTimelineEvent,
} from '@/lib/firestore';

interface AssessorHistoryModalProps {
  user: User;
  demands: Demand[];
  sprints?: Sprint[];
  onClose: () => void;
}

const EVENT_TYPE_CONFIG: Record<MemberTimelineEventType, { icon: React.ElementType; color: string; label: string }> = {
  ingresso: { icon: MapPin, color: 'bg-primary text-black', label: 'Ingresso' },
  egresso: { icon: LogOut, color: 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]', label: 'Egresso' },
  cargo: { icon: Briefcase, color: 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]', label: 'Mudança de Cargo' },
  projeto: { icon: FolderKanban, color: 'bg-secondary text-white shadow-[0_0_15px_rgba(11,175,77,0.3)]', label: 'Projeto' },
  demanda: { icon: ClipboardList, color: 'bg-zinc-800 text-zinc-400', label: 'Demanda' },
  outro: { icon: MoreHorizontal, color: 'bg-zinc-700 text-zinc-300', label: 'Outro' },
};

const EMPTY_FORM = { date: '', type: 'outro' as MemberTimelineEventType, title: '', description: '' };

export function AssessorHistoryModal({ user, demands, onClose }: AssessorHistoryModalProps) {
  const { user: currentUser } = useAuthStore();
  const isDirector = currentUser?.role === 'diretor';

  const [timelineEvents, setTimelineEvents] = useState<MemberTimelineEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Subscribe to timeline events
  useEffect(() => {
    const unsub = subscribeToMemberTimeline(user.uid, (events) => {
      setTimelineEvents(events);
      setLoadingTimeline(false);
    });
    return () => unsub();
  }, [user.uid]);

  // Stats
  const completedDemands = demands.filter(d => d.status === 'concluido');
  const onTimeDemands = completedDemands.filter(d => !d.deadline || new Date(d.updatedAt) <= new Date(d.deadline));
  const onTimeRate = completedDemands.length > 0 ? Math.round((onTimeDemands.length / completedDemands.length) * 100) : 0;
  const cycleTimes = completedDemands.map(d => differenceInDays(new Date(d.updatedAt), new Date(d.createdAt)));
  const avgCycleTime = cycleTimes.length > 0 ? Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length) : 0;
  const activeDemands = demands.filter(d => d.status === 'em_progresso' || d.status === 'em_revisao');
  const stagnantCount = activeDemands.filter(d => differenceInDays(new Date(), new Date(d.updatedAt)) >= 5).length;

  const handleStartEdit = useCallback((event: MemberTimelineEvent) => {
    setEditingId(event.id);
    setEditForm({
      date: format(event.date, 'yyyy-MM-dd'),
      type: event.type,
      title: event.title,
      description: event.description,
    });
  }, []);

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.title.trim() || !editForm.date) return;
    setSaving(true);
    try {
      await updateMemberTimelineEvent(editingId, {
        date: new Date(editForm.date + 'T12:00:00'),
        type: editForm.type,
        title: editForm.title.trim(),
        description: editForm.description.trim(),
      });
      setEditingId(null);
      toast.success('Evento atualizado!');
    } catch { toast.error('Erro ao salvar.'); }
    finally { setSaving(false); }
  };

  const handleAdd = async () => {
    if (!addForm.title.trim() || !addForm.date) return;
    setSaving(true);
    try {
      await createMemberTimelineEvent({
        userId: user.uid,
        date: new Date(addForm.date + 'T12:00:00'),
        type: addForm.type,
        title: addForm.title.trim(),
        description: addForm.description.trim(),
      });
      setAddForm(EMPTY_FORM);
      setShowAddForm(false);
      toast.success('Evento adicionado!');
    } catch { toast.error('Erro ao adicionar.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await deleteMemberTimelineEvent(id);
      toast.success('Evento removido.');
    } catch { toast.error('Erro ao remover.'); }
    finally { setSaving(false); }
  };

  const renderEventForm = (
    form: typeof EMPTY_FORM,
    setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>,
    onSave: () => void,
    onCancel: () => void
  ) => (
    <div className="space-y-4 bg-zinc-950/60 border border-white/5 rounded-2xl p-5 animate-in fade-in duration-200">
      <div className="grid grid-cols-2 gap-4 items-start">
        <div className="space-y-3 w-full">
          <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Data</label>
          <DatePicker
            value={form.date}
            onChange={(date) => setForm(prev => ({ ...prev, date }))}
            placeholder="Selecione uma data"
          />
        </div>
        <Select
          value={form.type}
          onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as MemberTimelineEventType }))}
          label="Tipo"
        >
          {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Título</label>
        <Input
          value={form.title}
          onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Ex: Promoção a Gerente"
          className="bg-zinc-950 border-white/[0.03] focus:border-secondary h-12 text-sm rounded-xl px-4"
        />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Descrição</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descrição do evento..."
          className="w-full bg-zinc-950 border border-white/[0.03] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-secondary transition-all resize-none"
        />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving || !form.title.trim() || !form.date}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-black text-[10px] font-black uppercase tracking-widest hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Salvar
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
        >
          <XCircle className="w-3 h-3" />
          Cancelar
        </button>
      </div>
    </div>
  );

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

          {/* User History/Trajetória block if exists */}
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
            <div className="flex items-center gap-2">
              {isDirector && (
                <button
                  onClick={() => { setShowAddForm(true); setAddForm({ ...EMPTY_FORM, date: format(new Date(), 'yyyy-MM-dd') }); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 border border-secondary/20 rounded-full text-[9px] font-black text-secondary uppercase tracking-widest hover:bg-secondary/20 transition-all"
                >
                  <Plus className="w-3 h-3" />
                  Novo Evento
                </button>
              )}
              <div className="px-3 py-1 bg-zinc-950 rounded-full border border-white/5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                {timelineEvents.length} Eventos
              </div>
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && renderEventForm(addForm, setAddForm, handleAdd, () => setShowAddForm(false))}

          {/* Loading state */}
          {loadingTimeline ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-secondary animate-spin" />
            </div>
          ) : timelineEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-700">
              <Flag className="w-8 h-8 mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest">Nenhum evento registrado</p>
              {isDirector && (
                <p className="text-[10px] text-zinc-600 mt-2">Clique em &quot;Novo Evento&quot; para adicionar o primeiro registro.</p>
              )}
            </div>
          ) : (
            <div className="relative space-y-8 pl-4">
              {/* Vertical Line */}
              <div className="absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-secondary/50 via-zinc-800 to-transparent" />

              {timelineEvents.map((event) => {
                const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.outro;
                const Icon = config.icon;
                const isEditing = editingId === event.id;

                return (
                  <div key={event.id} className="relative pl-8 group/item">
                    {/* Node dot */}
                    <div className={cn(
                      "absolute left-[-17px] top-1.5 w-8 h-8 rounded-full border-4 border-[#0f0f0f] z-10 flex items-center justify-center transition-all group-hover/item:scale-110",
                      config.color
                    )}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    {isEditing ? (
                      renderEventForm(editForm, setEditForm, handleSaveEdit, () => setEditingId(null))
                    ) : (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                            {format(event.date, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                          </span>
                          <span className="text-[8px] font-black text-zinc-500 uppercase bg-white/5 px-2 py-0.5 rounded-md">
                            {config.label}
                          </span>

                          {/* Edit/Delete buttons for directors */}
                          {isDirector && (
                            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity ml-auto">
                              <button
                                onClick={() => handleStartEdit(event)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all"
                                title="Editar"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(event.id)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all"
                                title="Remover"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        <h4 className="text-sm font-black text-white tracking-tight group-hover/item:text-secondary transition-colors">
                          {event.title}
                        </h4>

                        {event.description && (
                          <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed max-w-lg italic">
                            &quot;{event.description}&quot;
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
