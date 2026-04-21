'use client';

import React, { useEffect, useState } from 'react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { getDemands, getSprints } from '@/lib/firestore';
import { useDemandStore } from '@/store/useDemandStore';
import { useSprintStore } from '@/store/useSprintStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { TrendingUp } from 'lucide-react';
import Link from 'next/link';


export default function KanbanPage() {
  const { setDemands, setLoading, loading } = useDemandStore();
  const { setSprints } = useSprintStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const init = async () => {
      setLoading(true);
      try {
        const [demandsData, sprintsData] = await Promise.all([
          getDemands(),
          getSprints()
        ]);
        
        setDemands(demandsData);
        setSprints(sprintsData);
      } catch (error) {
        console.error("Error initializing Kanban:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [setDemands, setSprints, setLoading]);

  if (!mounted) return null;

  return (
    <div className="h-full flex flex-col relative px-8">
      <PageHeader 
        title="Quadro de Demandas" 
        description="Gerencie o fluxo de trabalho e acompanhe o status de cada atividade em tempo real."
      />

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
          </div>
        ) : (
          <KanbanBoard />
        )}
      </div>

      {/* Floating Navigation to Timeline */}
      <Link 
        href="/timeline"
        className="fixed bottom-10 right-10 w-14 h-14 bg-secondary text-white rounded-2xl flex items-center justify-center shadow-[0_20px_40px_rgba(11,175,77,0.3)] hover:scale-110 active:scale-95 transition-all z-[90] group active:rotate-12"
      >
        <TrendingUp className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </Link>
    </div>
  );
}
