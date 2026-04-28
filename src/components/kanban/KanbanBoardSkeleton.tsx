'use client';

import { Skeleton } from '@/components/ui/Skeleton';

export const KanbanBoardSkeleton = () => {
  return (
    <div className="h-full flex gap-4 overflow-x-auto pb-4 no-scrollbar">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex-shrink-0 w-[320px] flex flex-col gap-4">
          {/* Column Header Skeleton */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-32 rounded-lg" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>

          {/* Cards Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-4">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-5 w-full rounded" />
                <div className="flex justify-between items-center pt-2">
                  <div className="flex -space-x-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
