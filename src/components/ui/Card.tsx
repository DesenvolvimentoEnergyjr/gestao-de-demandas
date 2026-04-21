import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverGlow?: boolean;
  variant?: 'default' | 'gradient';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverGlow = false, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-3xl transition-all duration-300',
          variant === 'gradient' ? 'border-gradient' : 'border border-white/5 bg-bg-surface',
          hoverGlow && 'hover:shadow-[0_0_30px_rgba(11,175,77,0.1)] hover:border-secondary/30',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export { Card };
