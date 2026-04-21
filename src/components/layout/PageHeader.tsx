'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
  alignment?: 'left' | 'center' | 'between';
}

export const PageHeader = ({ 
  title, 
  description, 
  children, 
  className,
  alignment = 'between'
}: PageHeaderProps) => {
  return (
    <div className={cn(
      "flex flex-col md:flex-row gap-6 mb-10",
      alignment === 'between' ? "md:items-end justify-between" : "md:items-start",
      className
    )}>
      <div className="max-w-2xl">
        <h2 className="text-[40px] font-black text-white tracking-tighter leading-[0.9] text-left">
          {title}
        </h2>
        <p className="text-zinc-500 mt-4 text-sm font-medium leading-relaxed max-w-xl">
          {description}
        </p>
      </div>
      {children && (
        <div className="flex items-center gap-4 shrink-0 px-2 md:px-0">
          {children}
        </div>
      )}
    </div>
  );
};
