'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'ghost' | 'danger' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-gradient-to-r from-secondary to-secondary-dark text-white shadow-lg shadow-secondary/10',
      secondary: 'bg-primary text-bg-base shadow-lg shadow-primary/10',
      ghost: 'bg-transparent border border-border-subtle text-text-muted hover:text-text-main',
      danger: 'bg-red-600 text-white shadow-lg shadow-red-500/10',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        disabled={loading || props.disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-bold uppercase tracking-widest transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
