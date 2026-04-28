'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-white/[0.03] rounded-lg',
        className
      )}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};
