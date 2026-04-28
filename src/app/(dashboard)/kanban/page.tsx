'use client';

import React, { useEffect } from 'react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { getUsers } from '@/lib/firestore';
import { useDemandStore } from '@/store/useDemandStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { User } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { KanbanBoardSkeleton } from '@/components/kanban/KanbanBoardSkeleton';

export default function KanbanPage() {
  const { loading } = useDemandStore();
  const [users, setUsers] = React.useState<User[]>([]);

  useEffect(() => {
    getUsers(true).then(setUsers).catch(console.error);
  }, []);

  return (
    <div className="h-full flex flex-col relative px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Quadro de Demandas"
        description="Gerencie o fluxo de trabalho e acompanhe o status de cada atividade em tempo real."
      />

      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <KanbanBoardSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <KanbanBoard users={users} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}