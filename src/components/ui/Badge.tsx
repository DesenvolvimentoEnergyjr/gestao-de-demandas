import * as React from 'react';
import { cn } from '@/lib/utils';
import { Priority, DemandStatus } from '@/types';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Priority | DemandStatus | 'tag';
}

const Badge: React.FC<BadgeProps> = ({ className, variant = 'tag', children, ...props }) => {
  const variants: Record<string, string> = {
    // Priority
    urgente: 'bg-red-600/20 text-red-500 border-red-600/30',
    alta: 'bg-orange-600/20 text-orange-500 border-orange-600/30',
    media: 'bg-primary/20 text-primary border-primary/30',
    baixa: 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30',
    
    // Status
    backlog: 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30',
    criando_escopo: 'bg-blue-600/20 text-blue-500 border-blue-600/30',
    em_progresso: 'bg-primary/20 text-primary border-primary/30',
    em_revisao: 'bg-orange-600/20 text-orange-500 border-orange-600/30',
    concluido: 'bg-secondary/20 text-secondary border-secondary/30',
    
    // Tag
    tag: 'bg-bg-surface border-border-subtle text-text-muted',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
        variants[variant] || variants.tag,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { Badge };
