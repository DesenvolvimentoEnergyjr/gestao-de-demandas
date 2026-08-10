"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Calendar,
  Target,
  TrendingUp,
  Layers,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  Save,
  RotateCcw,
  FileText,
  Paperclip,
  Plus,
  Pause,
  Play,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/useUIStore";

import { tenantConfig } from "@/config/tenant";
import { useSprintStore } from "@/store/useSprintStore";
import { useDemandStore } from "@/store/useDemandStore";
import { formatDate, cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import {
  getUsers,
  updateSprint,
  deleteSprint,
  pauseSprint,
  resumeSprint,
} from "@/lib/firestore";
import { exportSprintToPDF } from "@/lib/export";
import { useAuthStore } from "@/store/useAuthStore";
import { User, Sprint } from "@/types";
import { addDays, format, differenceInDays } from "date-fns";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { getThemeColor, hexToRgba } from "@/lib/colors";

import { sprintUpdateSchema } from "@/lib/schemas";
import { DriveAttachment } from "@/components/ui/DriveAttachment";
import { parseDriveLink } from "@/lib/drive";
import { toast } from "@/store/useToastStore";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Skeleton } from "@/components/ui/Skeleton";

const SprintDetalhesSkeleton = () => (
  <div className="space-y-10 animate-pulse p-6 md:p-10">
    <div className="space-y-4">
      <Skeleton className="h-10 w-2/3" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton className="col-span-2 h-40 rounded-[32px]" />
      <Skeleton className="h-40 rounded-[32px]" />
    </div>
    <Skeleton className="h-64 w-full rounded-[32px]" />
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    </div>
  </div>
);

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
};

const FORM_FIELD_ORDER: (keyof Sprint)[] = [
  "title",
  "startDate",
  "endDate",
  "objective",
  "description",
];

export const SprintDetalhesModal = () => {
  const { sprintDetalhesOpen, closeSprintDetalhes, selectedSprintId } =
    useUIStore();
  const { sprints } = useSprintStore();
  const { demands } = useDemandStore();
  const { user: currentUser } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Sprint>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Chart states
  const [chartMode, setChartMode] = useState<"hours" | "demands">("hours");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Link Attachment State
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const handleAddLink = () => {
    if (!linkUrl.trim() || !currentUser) return;
    const newAttachment = parseDriveLink(linkUrl, linkName, currentUser.uid);
    setEditFormData((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), newAttachment],
    }));
    setLinkUrl("");
    setLinkName("");
    setShowLinkInput(false);
  };

  const handleExport = async () => {
    if (!sprint) return;
    setIsExporting(true);
    try {
      await exportSprintToPDF(sprint, sprintDemands, users);
      toast.success("PDF gerado com sucesso!");
    } catch {
      toast.error("Erro ao gerar PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (sprintDetalhesOpen) {
      getUsers(true).then(setUsers);
      setIsEditMode(false);
      setShowDeleteConfirm(false);
      setFormErrors({});
    }
  }, [sprintDetalhesOpen]);

  const sprint = useMemo(
    () => sprints.find((s) => s.id === selectedSprintId),
    [sprints, selectedSprintId],
  );

  const sprintDemands = useMemo(
    () => demands.filter((d) => d.sprintId === selectedSprintId),
    [demands, selectedSprintId],
  );

  const dynamicStatus = useMemo(() => {
    if (!sprint) return "planned";
    if (sprint.status === "paused") return "paused";
    if (sprint.status === "completed") return "completed";
    if (
      sprintDemands.length > 0 &&
      sprintDemands.every((d) => d.status === "concluido")
    )
      return "completed";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate =
      sprint.startDate instanceof Date
        ? sprint.startDate
        : new Date(sprint.startDate);
    startDate.setHours(0, 0, 0, 0);

    if (startDate <= today) return "active";
    return "planned";
  }, [sprint, sprintDemands]);

  const totalHours = useMemo(
    () => sprintDemands.reduce((acc, d) => acc + (d.estimatedHours || 0), 0),
    [sprintDemands],
  );

  const completedHours = useMemo(
    () =>
      sprintDemands
        .filter((d) => d.status === "concluido")
        .reduce((acc, d) => acc + (d.estimatedHours || 0), 0),
    [sprintDemands],
  );

  // Helper to calculate a date by adding 'active' days (skipping paused periods)
  const getActiveDate = useCallback(
    (start: Date, activeDaysToAdd: number) => {
      if (!sprint) return addDays(start, activeDaysToAdd);

      let currentDate = new Date(start);
      let daysAdded = 0;
      const history = sprint.pauseHistory || [];

      while (daysAdded < activeDaysToAdd) {
        currentDate = addDays(currentDate, 1);

        let isPaused = false;
        for (const p of history) {
          const pStart =
            p.pausedAt instanceof Date ? p.pausedAt : new Date(p.pausedAt);
          const pEnd = p.resumedAt
            ? p.resumedAt instanceof Date
              ? p.resumedAt
              : new Date(p.resumedAt)
            : sprint.status === "paused"
              ? new Date()
              : null;

          if (pEnd) {
            if (currentDate >= pStart && currentDate <= pEnd) {
              isPaused = true;
              break;
            }
          } else if (sprint.status === "paused") {
            if (currentDate >= pStart) {
              isPaused = true;
              break;
            }
          }
        }

        if (!isPaused) {
          daysAdded++;
        }
      }

      return currentDate;
    },
    [sprint],
  );

  // Grouping by Week
  const weekGroups = useMemo(() => {
    if (!sprint) return [];

    const start =
      sprint.startDate instanceof Date
        ? sprint.startDate
        : new Date(sprint.startDate);
    const end =
      sprint.endDate instanceof Date
        ? sprint.endDate
        : new Date(sprint.endDate);

    // Calculate total active weeks
    const totalDays = differenceInDays(end, start) + 1;
    const activeDays = Math.max(1, totalDays - (sprint.totalPausedDays || 0));
    const totalWeeks = Math.max(1, Math.ceil(activeDays / 7));

    const groups = Array.from({ length: totalWeeks }, (_, i) => {
      const weekStart = getActiveDate(start, i * 7);
      const weekEnd = getActiveDate(start, Math.min(activeDays - 1, i * 7 + 6));

      const weekEndOfDay = new Date(weekEnd);
      weekEndOfDay.setHours(23, 59, 59, 999);

      const demandsInWeek = sprintDemands.filter((d) => {
        const dDateRaw = d.deadline || d.startDate || d.createdAt;
        if (!dDateRaw) return false;
        const dDate = new Date(dDateRaw);

        const clamped = dDate < start ? start : dDate > end ? end : dDate;
        return clamped >= weekStart && clamped <= weekEndOfDay;
      });

      return {
        label: `Semana ${i + 1}`,
        period: `${formatDate(weekStart)} - ${formatDate(weekEnd)}`,
        demands: demandsInWeek,
      };
    });

    return groups;
  }, [sprint, sprintDemands, getActiveDate]);

  // Chart Data (Burn-up)
  const chartData = useMemo(() => {
    if (!sprint || weekGroups.length === 0) return null;

    const totalEffort =
      chartMode === "hours"
        ? totalHours > 0
          ? totalHours
          : 1
        : sprintDemands.length > 0
          ? sprintDemands.length
          : 1;

    const start =
      sprint.startDate instanceof Date
        ? sprint.startDate
        : new Date(sprint.startDate);
    start.setHours(0, 0, 0, 0);
    const totalWeeks = weekGroups.length;

    const data = [];
    const now = new Date();

    for (let i = 0; i <= totalWeeks; i++) {
      const pointDate = getActiveDate(start, i * 7);
      const idealValue = Math.round((i / totalWeeks) * totalEffort);
      const idealProgress = Math.round((idealValue / totalEffort) * 100);

      let actualProgress: number | null = null;
      let actualValue: number | null = null;

      if (pointDate <= addDays(now, 7) || i === 0) {
        if (i === 0) {
          actualValue = 0;
          actualProgress = 0;
        } else {
          const completedDemands = sprintDemands.filter((d) => {
            if (d.status !== "concluido") return false;

            const completedDate = d.completedAt || d.updatedAt;
            return completedDate && new Date(completedDate) <= pointDate;
          });

          if (chartMode === "hours") {
            actualValue = completedDemands.reduce(
              (acc, d) => acc + (d.estimatedHours || 0),
              0,
            );
          } else {
            actualValue = completedDemands.length;
          }

          actualProgress = Math.round((actualValue / totalEffort) * 100);
        }
      }

      data.push({
        week: i,
        label: i === 0 ? "Início" : `S${i}`,
        ideal: idealProgress,
        actual: actualProgress,
        idealValue,
        actualValue,
        pointDate,
      });
    }
    return data;
  }, [
    sprint,
    sprintDemands,
    weekGroups.length,
    chartMode,
    totalHours,
    getActiveDate,
  ]);

  const handleStartEdit = () => {
    if (!sprint) return;
    setEditFormData({
      title: sprint.title,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      objective: sprint.objective,
      description: sprint.description,
      storyPoints: sprint.storyPoints,
      status: sprint.status,
      attachments: sprint.attachments || [],
    });
    setIsEditMode(true);
    setFormErrors({});
  };

  const handleSave = async () => {
    if (!selectedSprintId || !editFormData) return;

    const result = sprintUpdateSchema.safeParse(editFormData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setFormErrors(fieldErrors);

      const firstErrorField = FORM_FIELD_ORDER.find((field) => fieldErrors[field]);
      if (firstErrorField) {
        requestAnimationFrame(() => {
          modalContentRef.current
            ?.querySelector(`[data-field="${firstErrorField}"]`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
      return;
    }
    setFormErrors({});

    setLoading(true);
    try {
      await updateSprint(selectedSprintId, editFormData);
      toast.success("Sprint atualizada com sucesso!");
      setIsEditMode(false);
    } catch (error) {
      console.error("Erro ao atualizar sprint:", error);
      toast.error("Erro ao atualizar sprint.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSprintId) return;

    setLoading(true);
    try {
      await deleteSprint(selectedSprintId);
      toast.success("Sprint excluída com sucesso!");
      closeSprintDetalhes();
    } catch (error) {
      console.error("Erro ao excluir sprint:", error);
      toast.error("Erro ao excluir sprint.");
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (!sprint) return;
    setIsPausing(true);
    try {
      await pauseSprint(sprint.id);

      const sprintAssignees = Array.from(
        new Set(sprintDemands.flatMap((d) => d.assignees)),
      );
      const emails = sprintAssignees
        .map((uid) => users.find((u) => u.uid === uid)?.email)
        .filter(Boolean);

      if (emails.length > 0) {
        fetch("/api/integrations/notify-demand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sprint,
            newSprintAssignees: emails,
            action: "pause",
          }),
        }).catch((err) => console.error("Erro ao notificar pausa:", err));
      }

      toast.success("Sprint pausada com sucesso. Os prazos foram congelados.");
    } catch (error) {
      console.error("Erro ao pausar sprint:", error);
      toast.error("Erro ao pausar sprint.");
    } finally {
      setIsPausing(false);
    }
  };

  const handleResume = async () => {
    if (!sprint) return;
    setIsResuming(true);
    try {
      await resumeSprint(sprint.id);

      const sprintAssignees = Array.from(
        new Set(sprintDemands.flatMap((d) => d.assignees)),
      );
      const emails = sprintAssignees
        .map((uid) => users.find((u) => u.uid === uid)?.email)
        .filter(Boolean);

      if (emails.length > 0) {
        fetch("/api/integrations/notify-demand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sprint,
            newSprintAssignees: emails,
            action: "resume",
          }),
        }).catch((err) => console.error("Erro ao notificar retomada:", err));
      }

      toast.success(
        "Sprint retomada. Os prazos das demandas foram recalculados.",
      );
    } catch (error) {
      console.error("Erro ao retomar sprint:", error);
      toast.error("Erro ao retomar sprint.");
    } finally {
      setIsResuming(false);
    }
  };

  return (
    <AnimatePresence>
      {sprintDetalhesOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-md"
            onClick={closeSprintDetalhes}
          />

          <motion.div
            ref={modalContentRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl bg-bg-section border border-white/[0.08] rounded-[2rem] md:rounded-[40px] shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
            id="sprint-modal-content"
          >
            {/* Decorative glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-b from-secondary/5 to-transparent pointer-events-none" />

            {!sprint || !mounted ? (
              <SprintDetalhesSkeleton />
            ) : (
              <>
                {(() => {
                  const progress =
                    totalHours > 0 ? (completedHours / totalHours) * 100 : 0;

                  const secondaryColor = getThemeColor("secondary");

                  return (
                    <>
                      {/* Header */}
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 md:p-10 pb-6 flex items-start justify-between relative z-10 gap-4"
                      >
                        <div className="space-y-4 min-w-0">
                          <div className="min-w-0" data-field="title">
                            {isEditMode ? (
                              <>
                                <Input
                                  value={editFormData.title}
                                  onChange={(e) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      title: e.target.value,
                                    }))
                                  }
                                  className={cn(
                                    "text-2xl md:text-4xl font-black text-white bg-white/5 border-white/10 h-auto py-2",
                                    formErrors.title &&
                                      "border-red-500/50 focus:border-red-500",
                                  )}
                                />
                                {formErrors.title && (
                                  <p className="text-[10px] text-red-400 font-semibold ml-1">
                                    {formErrors.title}
                                  </p>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-3">
                                  <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter leading-tight truncate">
                                    {sprint.title}
                                  </h2>
                                  {dynamicStatus === "paused" && (
                                    <div
                                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400"
                                      title="O tempo da sprint está congelado"
                                    >
                                      <Pause className="w-3.5 h-3.5" />
                                      <span className="text-[10px] font-black uppercase tracking-widest">
                                        Pausada
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mt-4">
                                  <div className="flex items-center gap-2 text-zinc-400">
                                    <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-600" />
                                    <span className="text-[10px] md:text-xs font-bold whitespace-nowrap">
                                      {formatDate(sprint.startDate)} —{" "}
                                      {formatDate(sprint.endDate)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-zinc-400">
                                    <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-600" />
                                    <span className="text-[10px] md:text-xs font-bold whitespace-nowrap">
                                      {totalHours} Horas
                                    </span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div
                          className="flex items-center gap-3"
                          data-html2canvas-ignore
                        >
                          {!isEditMode && currentUser?.role === "diretor" && (
                            <>
                              {dynamicStatus === "paused" ? (
                                <button
                                  onClick={handleResume}
                                  disabled={isResuming}
                                  className="group/btnRes relative w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary hover:bg-secondary/20 transition-all active:scale-90 disabled:opacity-50"
                                >
                                  {isResuming ? (
                                    <div className="w-5 h-5 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" />
                                  ) : (
                                    <Play className="w-5 h-5 fill-secondary" />
                                  )}
                                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl opacity-0 group-hover/btnRes:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl whitespace-nowrap hidden group-hover/btnRes:block">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest text-center leading-tight">
                                      Retomar Ciclo
                                    </p>
                                  </div>
                                </button>
                              ) : dynamicStatus === "active" ? (
                                <button
                                  onClick={handlePause}
                                  disabled={isPausing}
                                  className="group/btnPau relative w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 hover:bg-orange-500/20 transition-all active:scale-90 disabled:opacity-50"
                                >
                                  {isPausing ? (
                                    <div className="w-5 h-5 border-2 border-orange-400/20 border-t-orange-400 rounded-full animate-spin" />
                                  ) : (
                                    <Pause className="w-5 h-5 fill-orange-400" />
                                  )}
                                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl opacity-0 group-hover/btnPau:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl whitespace-nowrap hidden group-hover/btnPau:block">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest text-center leading-tight">
                                      Pausar Ciclo
                                    </p>
                                  </div>
                                </button>
                              ) : null}
                              <button
                                onClick={handleStartEdit}
                                className="group/btn1 relative w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                              >
                                <Pencil className="w-5 h-5" />
                                {/* Tooltip */}
                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl opacity-0 group-hover/btn1:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl whitespace-nowrap hidden group-hover/btn1:block">
                                  <p className="text-[10px] font-black text-white uppercase tracking-widest text-center leading-tight">
                                    Editar Ciclo
                                  </p>
                                </div>
                              </button>
                              <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="group/btn2 relative w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-500 hover:text-secondary hover:bg-secondary/10 transition-all active:scale-90 disabled:opacity-50"
                              >
                                {isExporting ? (
                                  <div className="w-5 h-5 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" />
                                ) : (
                                  <FileText className="w-5 h-5" />
                                )}
                                {/* Tooltip */}
                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl opacity-0 group-hover/btn2:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl whitespace-nowrap hidden group-hover/btn2:block">
                                  <p className="text-[10px] font-black text-white uppercase tracking-widest text-center leading-tight">
                                    Exportar Sprint
                                  </p>
                                </div>
                              </button>
                              {showDeleteConfirm ? (
                                <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                                  <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="px-4 h-12 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-red-500/20"
                                  >
                                    {loading ? (
                                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                    Confirmar
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 h-12 rounded-2xl bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-zinc-700 transition-all active:scale-95"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setShowDeleteConfirm(true)}
                                  className="group/btn3 relative w-12 h-12 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                                >
                                  <Trash2 className="w-5 h-5" />
                                  {/* Tooltip */}
                                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl opacity-0 group-hover/btn3:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl whitespace-nowrap hidden group-hover/btn3:block">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest text-center leading-tight">
                                      Excluir Ciclo
                                    </p>
                                  </div>
                                </button>
                              )}
                            </>
                          )}
                          {isEditMode && currentUser?.role === "diretor" && (
                            <>
                              <button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary hover:bg-secondary/20 transition-all active:scale-90"
                                title="Salvar Alterações"
                              >
                                {loading ? (
                                  <div className="w-5 h-5 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" />
                                ) : (
                                  <Save className="w-5 h-5" />
                                )}
                              </button>
                              <button
                                onClick={() => setIsEditMode(false)}
                                className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                title="Cancelar"
                              >
                                <RotateCcw className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={closeSprintDetalhes}
                            className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      </motion.div>

                      {/* Body */}
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex-1 overflow-y-auto px-6 md:px-10 pb-10 space-y-8 md:space-y-10 no-scrollbar relative z-10"
                      >
                        {isEditMode && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 bg-white/[0.02] border border-white/5 rounded-[32px] p-6 md:p-8">
                            <div className="space-y-3" data-field="startDate">
                              <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                                Início do Ciclo
                              </label>
                              <div className="relative">
                                <DatePicker
                                  value={
                                    editFormData.startDate
                                      ? format(
                                          new Date(editFormData.startDate),
                                          "yyyy-MM-dd",
                                        )
                                      : ""
                                  }
                                  onChange={(date) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      startDate: new Date(`${date}T00:00:00`),
                                    }))
                                  }
                                  error={!!formErrors.startDate}
                                />
                              </div>
                              {formErrors.startDate && (
                                <p className="text-[10px] text-red-400 font-semibold ml-1 mt-1">
                                  {formErrors.startDate}
                                </p>
                              )}
                            </div>
                            <div className="space-y-3" data-field="endDate">
                              <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
                                Previsão de Término
                              </label>
                              <div className="relative">
                                <DatePicker
                                  value={
                                    editFormData.endDate
                                      ? format(
                                          new Date(editFormData.endDate),
                                          "yyyy-MM-dd",
                                        )
                                      : ""
                                  }
                                  onChange={(date) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      endDate: new Date(`${date}T23:59:59`),
                                    }))
                                  }
                                  error={!!formErrors.endDate}
                                />
                              </div>
                              {formErrors.endDate && (
                                <p className="text-[10px] text-red-400 font-semibold ml-1 mt-1">
                                  {formErrors.endDate}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Progress + Objective */}
                        <div
                          className={cn(
                            "grid gap-6",
                            currentUser?.role === "diretor"
                              ? "grid-cols-1 md:grid-cols-3"
                              : "grid-cols-1",
                          )}
                        >
                          {currentUser?.role === "diretor" && (
                            <motion.div
                              variants={itemVariants}
                              className="col-span-1 md:col-span-2 bg-white/[0.02] border border-white/5 rounded-[2rem] md:rounded-[32px] p-6 md:p-8"
                            >
                              <div className="flex justify-between items-end mb-6">
                                <div className="space-y-1">
                                  <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">
                                    Progresso Geral
                                  </h4>
                                  <div className="text-3xl font-black text-white">
                                    {Math.round(progress)}%
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                                    Horas Entregues
                                  </div>
                                  <div className="text-sm font-black text-white">
                                    {completedHours}h / {totalHours}h
                                  </div>
                                </div>
                              </div>
                              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{
                                    duration: 1,
                                    ease: "easeOut",
                                    delay: 0.5,
                                  }}
                                  className="h-full bg-secondary"
                                  style={{
                                    boxShadow: `0 0 20px ${hexToRgba(secondaryColor, 0.4)}`,
                                  }}
                                />
                              </div>
                            </motion.div>
                          )}

                          <motion.div
                            variants={itemVariants}
                            data-field="objective"
                            className={cn(
                              "bg-secondary/5 border border-secondary/10 rounded-[2rem] md:rounded-[32px] p-6 md:p-8 flex flex-col justify-center",
                              isEditMode && "ring-2 ring-secondary",
                              currentUser?.role !== "diretor" && "col-span-1",
                            )}
                          >
                            <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
                              <Target className="w-5 h-5 text-secondary" />
                            </div>
                            <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">
                              Meta Principal
                            </h4>
                            {isEditMode ? (
                              <textarea
                                value={editFormData.objective}
                                onChange={(e) =>
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    objective: e.target.value,
                                  }))
                                }
                                className={cn(
                                  "bg-transparent border-none text-sm font-bold text-zinc-300 leading-relaxed focus:ring-0 w-full resize-none h-24 p-0",
                                  formErrors.objective && "text-red-400",
                                )}
                                placeholder="Qual a meta deste ciclo?"
                              />
                            ) : (
                              <p className="text-sm font-bold text-zinc-300 leading-relaxed">
                                {sprint.objective}
                              </p>
                            )}
                            {isEditMode && formErrors.objective && (
                              <p className="text-[10px] text-red-400 font-semibold mt-2">
                                {formErrors.objective}
                              </p>
                            )}
                          </motion.div>
                        </div>

                        {/* Burn-up Chart */}
                        {chartData && chartData.length > 1 && !isEditMode && (
                          <motion.div
                            variants={itemVariants}
                            className="bg-white/[0.02] border border-white/5 rounded-[2rem] md:rounded-[32px] p-6 md:p-8 overflow-hidden"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-secondary" />
                                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                  Gráfico de Acompanhamento (Burn-up)
                                </h4>
                              </div>
                              <div className="flex p-1 bg-zinc-950 border border-white/10 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => setChartMode("hours")}
                                  className={cn(
                                    "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                                    chartMode === "hours"
                                      ? "bg-white text-black shadow-sm"
                                      : "text-zinc-500 hover:text-white/70",
                                  )}
                                >
                                  Horas
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setChartMode("demands")}
                                  className={cn(
                                    "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                                    chartMode === "demands"
                                      ? "bg-white text-black shadow-sm"
                                      : "text-zinc-500 hover:text-white/70",
                                  )}
                                >
                                  Demandas
                                </button>
                              </div>
                            </div>

                            <div
                              className="relative w-full aspect-[1000/500] md:aspect-[1000/400] mt-4"
                              onMouseMove={(e) =>
                                setMousePos({ x: e.clientX, y: e.clientY })
                              }
                            >
                              <svg
                                viewBox="0 0 1000 500"
                                className="w-full h-full overflow-visible"
                              >
                                <defs>
                                  <linearGradient
                                    id="idealGrad"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="rgba(255,255,255,0.1)"
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="rgba(255,255,255,0)"
                                    />
                                  </linearGradient>
                                  <linearGradient
                                    id="actualGrad"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor={hexToRgba(secondaryColor, 0.4)}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor={hexToRgba(secondaryColor, 0)}
                                    />
                                  </linearGradient>
                                </defs>

                                {/* Grid lines */}
                                {[0, 25, 50, 75, 100].map((percent) => {
                                  const y = 450 - (percent / 100) * 400;
                                  return (
                                    <g key={percent}>
                                      <line
                                        x1="50"
                                        y1={y}
                                        x2="950"
                                        y2={y}
                                        stroke="rgba(255,255,255,0.05)"
                                        strokeWidth="1"
                                        strokeDasharray="4 4"
                                      />
                                      <text
                                        x="40"
                                        y={y + 4}
                                        fill="rgba(255,255,255,0.3)"
                                        fontSize="14"
                                        fontWeight="bold"
                                        textAnchor="end"
                                        className="hidden md:block"
                                      >
                                        {percent}%
                                      </text>
                                    </g>
                                  );
                                })}

                                {/* Ideal Line & Area */}
                                <path
                                  d={`M ${chartData.map((d) => `${50 + (d.week / (chartData.length - 1)) * 900},${450 - (d.ideal / 100) * 400}`).join(" L ")}`}
                                  fill="none"
                                  stroke="rgba(255,255,255,0.2)"
                                  strokeWidth="2"
                                  strokeDasharray="8 8"
                                />
                                <path
                                  d={`M 50,450 L ${chartData.map((d) => `${50 + (d.week / (chartData.length - 1)) * 900},${450 - (d.ideal / 100) * 400}`).join(" L ")} L 950,450 Z`}
                                  fill="url(#idealGrad)"
                                />

                                {/* Actual Line & Area */}
                                {chartData.filter((d) => d.actual !== null)
                                  .length > 0 && (
                                  <>
                                    <path
                                      d={`M 50,450 L ${chartData
                                        .filter((d) => d.actual !== null)
                                        .map(
                                          (d) =>
                                            `${50 + (d.week / (chartData.length - 1)) * 900},${450 - (d.actual! / 100) * 400}`,
                                        )
                                        .join(
                                          " L ",
                                        )} L ${50 + ((chartData.filter((d) => d.actual !== null).length - 1) / (chartData.length - 1)) * 900},450 Z`}
                                      fill="url(#actualGrad)"
                                    />
                                    <path
                                      d={`M ${chartData
                                        .filter((d) => d.actual !== null)
                                        .map(
                                          (d) =>
                                            `${50 + (d.week / (chartData.length - 1)) * 900},${450 - (d.actual! / 100) * 400}`,
                                        )
                                        .join(" L ")}`}
                                      fill="none"
                                      stroke={secondaryColor}
                                      strokeWidth="4"
                                      style={{
                                        filter: `drop-shadow(0px 0px 12px ${hexToRgba(secondaryColor, 0.6)})`,
                                      }}
                                    />

                                    {/* Dots & Hit Areas */}
                                    {chartData
                                      .filter((d) => d.actual !== null)
                                      .map((d, i) => {
                                        const x =
                                          50 +
                                          (d.week / (chartData.length - 1)) *
                                            900;
                                        const yActual =
                                          450 - (d.actual! / 100) * 400;
                                        const isHovered =
                                          hoveredPoint === d.week;

                                        return (
                                          <g
                                            key={`actual-point-${i}`}
                                            onMouseEnter={() =>
                                              setHoveredPoint(d.week)
                                            }
                                            onMouseLeave={() =>
                                              setHoveredPoint(null)
                                            }
                                            onClick={() =>
                                              setHoveredPoint(
                                                isHovered ? null : d.week,
                                              )
                                            }
                                            className="cursor-pointer"
                                          >
                                            <circle
                                              cx={x}
                                              cy={yActual}
                                              r="30"
                                              fill="transparent"
                                            />
                                            <circle
                                              cx={x}
                                              cy={yActual}
                                              r={isHovered ? "8" : "6"}
                                              fill="#0f0f0f"
                                              stroke={secondaryColor}
                                              strokeWidth={
                                                isHovered ? "4" : "3"
                                              }
                                              className="transition-all duration-200 pointer-events-none"
                                            />
                                          </g>
                                        );
                                      })}
                                  </>
                                )}

                                {/* X Axis Labels */}
                                {chartData.map((d, i) => {
                                  return (
                                    <text
                                      key={i}
                                      x={
                                        50 + (i / (chartData.length - 1)) * 900
                                      }
                                      y="485"
                                      fill="rgba(255,255,255,0.5)"
                                      fontSize="14"
                                      fontWeight="bold"
                                      textAnchor="middle"
                                      className="hidden md:block"
                                    >
                                      {d.label}
                                    </text>
                                  );
                                })}
                              </svg>

                              {/* Tooltip Overlay */}
                              {typeof document !== "undefined" &&
                                createPortal(
                                  <AnimatePresence>
                                    {hoveredPoint !== null &&
                                      (() => {
                                        const d = chartData.find(
                                          (data) => data.week === hoveredPoint,
                                        );
                                        if (!d || d.actual === null)
                                          return null;

                                        const isNearTop = mousePos.y < 150;
                                        const isNearRight =
                                          mousePos.x > window.innerWidth - 200;
                                        const isNearLeft = mousePos.x < 150;

                                        const xTranslate = isNearRight
                                          ? "-100%"
                                          : isNearLeft
                                            ? "0%"
                                            : "-50%";
                                        const yTranslate = isNearTop
                                          ? "15px"
                                          : "calc(-100% - 15px)";

                                        return (
                                          <motion.div
                                            key={`tooltip-${d.week}`}
                                            initial={{
                                              opacity: 0,
                                              scale: 0.95,
                                            }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{
                                              type: "spring",
                                              damping: 20,
                                              stiffness: 300,
                                            }}
                                            className="fixed z-[99999] pointer-events-none"
                                            style={{
                                              left: mousePos.x,
                                              top: mousePos.y,
                                              x: xTranslate,
                                              y: yTranslate,
                                            }}
                                          >
                                            <div className="bg-[#141414] border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-1.5 whitespace-nowrap">
                                              <div className="text-[10px] font-black text-white uppercase tracking-widest mb-1 border-b border-white/10 pb-1.5">
                                                {d.label}
                                              </div>
                                              <div className="flex items-center justify-between gap-6">
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase">
                                                  Ritmo Ideal
                                                </span>
                                                <span className="text-[10px] font-black text-white">
                                                  {d.idealValue}{" "}
                                                  {chartMode === "hours"
                                                    ? "h"
                                                    : "dem"}
                                                </span>
                                              </div>
                                              <div className="flex items-center justify-between gap-6">
                                                <span className="text-[10px] font-bold text-secondary uppercase">
                                                  Realizado
                                                </span>
                                                <span className="text-[10px] font-black text-secondary">
                                                  {d.actualValue}{" "}
                                                  {chartMode === "hours"
                                                    ? "h"
                                                    : "dem"}
                                                </span>
                                              </div>
                                            </div>
                                          </motion.div>
                                        );
                                      })()}
                                  </AnimatePresence>,
                                  document.body,
                                )}
                            </div>

                            <div className="flex items-center justify-center gap-6 mt-6">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-0.5 bg-white/20 border border-white/20 border-dashed" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                  Ritmo Ideal
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-1 bg-secondary rounded-full"
                                  style={{
                                    boxShadow: `0 0 8px ${hexToRgba(secondaryColor, 0.5)}`,
                                  }}
                                />
                                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                                  Progresso Real
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Description + Metrics */}
                        <motion.div
                          variants={itemVariants}
                          className={cn(
                            "grid gap-10",
                            currentUser?.role === "diretor"
                              ? "grid-cols-1 md:grid-cols-2"
                              : "grid-cols-1",
                          )}
                        >
                          <div className="space-y-4" data-field="description">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-zinc-500" />
                              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                Contexto do Ciclo
                              </h4>
                            </div>
                            {isEditMode ? (
                              <>
                                <textarea
                                  value={editFormData.description}
                                  onChange={(e) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      description: e.target.value,
                                    }))
                                  }
                                  className={cn(
                                    "w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-sm text-zinc-400 leading-relaxed font-medium focus:border-secondary transition-all resize-none h-32",
                                    formErrors.description &&
                                      "border-red-500/50",
                                  )}
                                  placeholder="Detalhes adicionais..."
                                />
                                {formErrors.description && (
                                  <p className="text-[10px] text-red-400 font-semibold ml-1">
                                    {formErrors.description}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                                {sprint.description ||
                                  "Este ciclo foca na aceleração de entregas críticas e alinhamento estratégico com os objetivos do trimestre."}
                              </p>
                            )}
                          </div>

                          {currentUser?.role === "diretor" && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-zinc-500" />
                                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                  Métricas de Eficiência
                                </h4>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                                  <div className="text-xl font-black text-white">
                                    {sprintDemands.length}
                                  </div>
                                  <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                                    Demandas Totais
                                  </div>
                                </div>
                                <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                                  <div className="text-xl font-black text-secondary">
                                    {
                                      sprintDemands.filter(
                                        (d) => d.status === "concluido",
                                      ).length
                                    }
                                  </div>
                                  <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                                    Concluídas
                                  </div>
                                </div>
                                <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                                  <div className="text-xl font-black text-white">
                                    {
                                      sprintDemands.filter(
                                        (d) => d.status === "em_progresso",
                                      ).length
                                    }
                                  </div>
                                  <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                                    Em Progresso
                                  </div>
                                </div>
                                <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                                  <div className="text-xl font-black text-red-400">
                                    {mounted
                                      ? sprintDemands.filter(
                                          (d) =>
                                            d.deadline &&
                                            new Date(d.deadline) < new Date() &&
                                            d.status !== "concluido",
                                        ).length
                                      : 0}
                                  </div>
                                  <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                                    Atrasadas
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>

                        {/* Attachments Section */}
                        <motion.div
                          variants={itemVariants}
                          className="space-y-4 bg-white/[0.02] border border-white/5 rounded-[2rem] md:rounded-[32px] p-6 md:p-8"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Paperclip className="w-4 h-4 text-zinc-500" />
                              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                Documentos da Sprint
                              </h4>
                            </div>
                            {isEditMode && currentUser?.role === "diretor" && (
                              <div className="flex items-center gap-2">
                                <AnimatePresence>
                                  {showLinkInput ? (
                                    <motion.div
                                      initial={{ opacity: 0, x: 20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: 20 }}
                                      className="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-lg p-1 pr-2"
                                    >
                                      <input
                                        type="text"
                                        placeholder="Nome (opcional)"
                                        value={linkName}
                                        onChange={(e) =>
                                          setLinkName(e.target.value)
                                        }
                                        className="bg-transparent border-none text-[10px] text-white focus:outline-none focus:ring-0 rounded-md w-24 pl-3 placeholder:text-zinc-600"
                                      />
                                      <div className="w-px h-4 bg-white/10" />
                                      <input
                                        type="url"
                                        placeholder="Cole o link aqui..."
                                        value={linkUrl}
                                        onChange={(e) =>
                                          setLinkUrl(e.target.value)
                                        }
                                        className="bg-transparent border-none text-[10px] text-white focus:outline-none focus:ring-0 rounded-md w-40 px-2 placeholder:text-zinc-600"
                                        onKeyDown={(e) =>
                                          e.key === "Enter" &&
                                          (e.preventDefault(), handleAddLink())
                                        }
                                      />
                                      <button
                                        type="button"
                                        onClick={handleAddLink}
                                        className="w-5 h-5 flex items-center justify-center bg-secondary/20 text-secondary rounded-md hover:bg-secondary/30 transition-all"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowLinkInput(false);
                                          setLinkUrl("");
                                          setLinkName("");
                                        }}
                                        className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-white transition-all ml-1"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </motion.div>
                                  ) : (
                                    <motion.button
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      type="button"
                                      onClick={() => setShowLinkInput(true)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-[9px] font-bold text-zinc-400 hover:text-white hover:border-white/10 transition-all uppercase tracking-widest active:scale-95"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Adicionar Link
                                    </motion.button>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>

                          {(isEditMode
                            ? editFormData.attachments
                            : sprint.attachments) &&
                          (isEditMode
                            ? editFormData.attachments
                            : sprint.attachments)!.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {(isEditMode
                                ? editFormData.attachments
                                : sprint.attachments)!.map((att) => (
                                <DriveAttachment
                                  key={att.id}
                                  attachment={att}
                                  isReadOnly={!isEditMode}
                                  onRemove={(id) => {
                                    if (isEditMode) {
                                      setEditFormData((prev) => ({
                                        ...prev,
                                        attachments:
                                          prev.attachments?.filter(
                                            (a) => a.id !== id,
                                          ) || [],
                                      }));
                                    }
                                  }}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-6 bg-zinc-950/50 border border-dashed border-white/5 rounded-2xl">
                              <Paperclip className="w-6 h-6 text-zinc-700 mb-2" />
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">
                                Nenhum documento anexado
                              </p>
                              {isEditMode && (
                                <p className="text-[8px] font-medium text-zinc-600 text-center mt-1 max-w-[200px]">
                                  Vincule a ata de planejamento, OKRs ou
                                  relatórios do Google Workspace.
                                </p>
                              )}
                            </div>
                          )}
                        </motion.div>

                        {/* Weekly Scope Groups */}
                        <motion.div
                          variants={itemVariants}
                          className="space-y-8"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-secondary" />
                              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                Planejamento Semanal
                              </h4>
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                              Ciclo de {weekGroups.length}{" "}
                              {weekGroups.length === 1 ? "Semana" : "Semanas"}
                            </span>
                          </div>

                          <div className="space-y-12">
                            {weekGroups.map((group, idx) => (
                              <motion.div
                                key={idx}
                                variants={itemVariants}
                                className="relative pl-8 border-l border-white/[0.05]"
                              >
                                {/* Week Indicator */}
                                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-zinc-800 border-2 border-[#101010]" />

                                <div className="flex flex-col gap-1 mb-6">
                                  <h5 className="text-sm font-black text-secondary uppercase tracking-wider">
                                    {group.label}
                                  </h5>
                                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                    {group.period}
                                  </p>
                                </div>

                                <div className="space-y-3">
                                  {group.demands.length > 0 ? (
                                    group.demands.map((demand) => {
                                      const isOverdue =
                                        demand.deadline &&
                                        mounted &&
                                        new Date(demand.deadline) <
                                          new Date() &&
                                        demand.status !== "concluido";

                                      return (
                                        <motion.div
                                          key={demand.id}
                                          initial={{ opacity: 0, x: -20 }}
                                          whileInView={{ opacity: 1, x: 0 }}
                                          viewport={{ once: true }}
                                          transition={{ delay: 0.1 }}
                                          onClick={() => {
                                            closeSprintDetalhes();
                                            router.push(
                                              `/kanban?demandId=${demand.id}`,
                                            );
                                          }}
                                          className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex items-center justify-between transition-all cursor-pointer"
                                        >
                                          <div className="flex items-center gap-4 min-w-0">
                                            <div
                                              className={cn(
                                                "w-2 h-2 rounded-full shrink-0",
                                                demand.status === "concluido"
                                                  ? "bg-secondary"
                                                  : isOverdue
                                                    ? "bg-red-400"
                                                    : "bg-zinc-600",
                                              )}
                                            />
                                            <div className="min-w-0">
                                              <h5 className="text-sm font-black text-white group-hover:text-secondary transition-colors truncate">
                                                {demand.title}
                                              </h5>
                                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                                                  <Clock className="w-3 h-3" />
                                                  {demand.estimatedHours}h
                                                </span>
                                                <span className="text-zinc-800">
                                                  •
                                                </span>
                                                <span
                                                  className={cn(
                                                    "text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded",
                                                    demand.priority ===
                                                      "urgente"
                                                      ? "text-red-400 bg-red-400/10"
                                                      : "text-zinc-500 bg-zinc-800",
                                                  )}
                                                >
                                                  {demand.priority}
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex -space-x-2 shrink-0 ml-4">
                                            {demand.assignees.map((uid) => {
                                              const u = users.find(
                                                (user) => user.uid === uid,
                                              );
                                              return (
                                                <div
                                                  key={uid}
                                                  className="relative group shrink-0"
                                                >
                                                  <Avatar
                                                    src={u?.photoURL}
                                                    alt={u?.name ?? uid}
                                                    size="sm"
                                                    className="border-2 border-[#101010]"
                                                    fallback={uid
                                                      .substring(0, 1)
                                                      .toUpperCase()}
                                                  />
                                                  {/* Tooltip */}
                                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl min-w-[100px] max-w-[200px]">
                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest text-center leading-tight break-words">
                                                      {u?.name ?? uid}
                                                    </p>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </motion.div>
                                      );
                                    })
                                  ) : (
                                    <div className="py-4 px-6 rounded-2xl border border-dashed border-white/5 text-[10px] font-medium text-zinc-700 uppercase tracking-widest">
                                      Sem entregas planejadas
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      </motion.div>

                      {/* Footer */}
                      <div className="p-6 md:p-8 border-t border-white/5 bg-zinc-950/40 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.3em] text-center sm:text-left">
                          {process.env.NEXT_PUBLIC_COMPANY_NAME ||
                            "Empresa Júnior"}{" "}
                          • {tenantConfig.phrases.sprintTagline}
                        </p>
                        <button
                          onClick={closeSprintDetalhes}
                          className="w-full sm:w-auto px-8 py-3 bg-secondary text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          Entendido
                        </button>
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
