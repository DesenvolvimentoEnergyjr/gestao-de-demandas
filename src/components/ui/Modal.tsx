'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />
      
      <div className={cn(
        "relative w-full max-w-xl bg-bg-section border-gradient rounded-[2rem] md:rounded-[40px] shadow-[0_0_100px_-20px_rgba(11,175,77,0.15)] overflow-y-auto max-h-[90vh] no-scrollbar animate-in zoom-in-95 duration-500",
        className
      )}>
        {children}
      </div>
    </div>
  );
}
