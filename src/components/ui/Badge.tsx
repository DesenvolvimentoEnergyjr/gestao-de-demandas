import * as React from 'react';
import { cn } from '@/lib/utils';
import { Priority, DemandStatus } from '@/types';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Priority | DemandStatus | 'tag';
}

import { tenantConfig } from '@/config/tenant';

const Badge: React.FC<BadgeProps> = ({ className, variant = 'tag', children, ...props }) => {
  let badgeClass = 'bg-bg-surface border-border-subtle text-text-muted'; // Default tag class
  
  if (variant !== 'tag') {
    const configStatus = tenantConfig.demandStatuses.find(s => s.id === variant);
    const configPriority = tenantConfig.priorities.find(p => p.id === variant);
    badgeClass = configStatus?.badgeClass || configPriority?.badgeClass || badgeClass;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
        badgeClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { Badge };
