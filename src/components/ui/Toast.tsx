'use client';

import React from 'react';
import { useToastStore, Toast as ToastType } from '@/store/useToastStore';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
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
    success: 'border-secondary/40 shadow-[0_10px_40px_-10px_rgba(11,175,77,0.4)]',
    error: 'border-red-500/40 shadow-[0_10px_40px_-10px_rgba(239,68,68,0.4)]',
    info: 'border-secondary/40 shadow-[0_10px_40px_-10px_rgba(11,175,77,0.4)]',
    warning: 'border-amber-500/40 shadow-[0_10px_40px_-10px_rgba(245,158,11,0.4)]',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9, y: -20 }}
      animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }}
      className={cn(
        "pointer-events-auto flex items-center gap-3 min-w-[280px] max-w-[380px] bg-[#0a0a0a] backdrop-blur-3xl border p-3.5 rounded-[18px] relative overflow-hidden",
        borders[toast.type]
      )}
    >
      {/* Decorative gradient background */}
      <div className={cn(
        "absolute inset-0 opacity-[0.06] pointer-events-none",
        (toast.type === 'success' || toast.type === 'info') ? "bg-secondary" :
          toast.type === 'error' ? "bg-red-500" : "bg-amber-500"
      )} />

      <div className="shrink-0 relative z-10">{icons[toast.type]}</div>
      <p className="flex-1 text-[12px] font-bold text-white uppercase tracking-[0.05em] leading-tight relative z-10">
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
