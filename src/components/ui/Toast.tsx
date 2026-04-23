'use client';

import React from 'react';
import { useToastStore, Toast as ToastType } from '@/store/useToastStore';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem = ({ toast, onClose }: { toast: ToastType; onClose: () => void }) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-secondary" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <CheckCircle2 className="w-5 h-5 text-secondary" />, // Alinhado com o design do site
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  };

  const borders = {
    success: 'border-secondary/20 shadow-[0_10px_30px_-10px_rgba(11,175,77,0.3)]',
    error: 'border-red-500/20 shadow-[0_10px_30px_-10px_rgba(239,68,68,0.3)]',
    info: 'border-secondary/20 shadow-[0_10px_30px_-10px_rgba(11,175,77,0.3)]', // Alinhado com o design
    warning: 'border-amber-500/20 shadow-[0_10px_30px_-10px_rgba(245,158,11,0.3)]',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }}
      className={cn(
        "pointer-events-auto flex items-center gap-4 min-w-[320px] max-w-[420px] bg-[#0a0a0a]/95 backdrop-blur-2xl border p-4 rounded-[20px] relative overflow-hidden",
        borders[toast.type]
      )}
    >
      {/* Decorative gradient background */}
      <div className={cn(
        "absolute inset-0 opacity-[0.03] pointer-events-none",
        (toast.type === 'success' || toast.type === 'info') ? "bg-secondary" :
          toast.type === 'error' ? "bg-red-500" : "bg-amber-500"
      )} />

      <div className="shrink-0 relative z-10">{icons[toast.type]}</div>
      <p className="flex-1 text-[11px] font-black text-white uppercase tracking-[0.1em] leading-relaxed relative z-10">
        {toast.message}
      </p>
      <button
        onClick={onClose}
        className="shrink-0 text-zinc-600 hover:text-white transition-colors relative z-10 p-1 hover:bg-white/5 rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar animation */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
        className={cn(
          "absolute bottom-0 left-0 h-[2px] opacity-30",
          (toast.type === 'success' || toast.type === 'info') ? "bg-secondary" :
            toast.type === 'error' ? "bg-red-500" : "bg-amber-500"
        )}
      />
    </motion.div>
  );
};
