'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getUserDoc, createUserDoc } from '@/lib/auth';
import { getDemands, getSprints } from '@/lib/firestore';
import { useAuthStore } from '@/store/useAuthStore';
import { useDemandStore } from '@/store/useDemandStore';
import { useSprintStore } from '@/store/useSprintStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { NovaDemandaModal } from '@/components/modals/NovaDemandaModal';
import { SprintDetalhesModal } from '@/components/modals/SprintDetalhesModal';
import { NovaSprintModal } from '@/components/modals/NovaSprintModal';
import { FloatingNotificationButton } from '@/components/layout/FloatingNotificationButton';
import { Menu } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, setUser, setLoading } = useAuthStore();
  const { setDemands } = useDemandStore();
  const { setSprints } = useSprintStore();
  const { subscribe: subscribeNotifications } = useNotificationStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  useEffect(() => {
    let unsubscribeNotifications: (() => void) | undefined;

    const unsubscribeAuth = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        unsubscribeNotifications = subscribeNotifications(firebaseUser.uid);

        try {
          const [userData, demandsData, sprintsData] = await Promise.all([
            getUserDoc(firebaseUser.uid),
            getDemands(),
            getSprints(),
          ]);

          let finalUser = userData;
          if (!userData) {
            finalUser = await createUserDoc(firebaseUser);
          }

          if (finalUser?.status === 'desligado') {
            console.error('Acesso negado: Membro desligado.');
            setUser(null);
            router.push('/auth');
            return;
          }

          setDemands(demandsData);
          setSprints(sprintsData);
          setUser(finalUser);
        } catch (error) {
          console.error('Erro ao carregar dados iniciais:', error);
          setUser(null);
          router.push('/auth');
        }
      } else {
        setUser(null);
        router.push('/auth');
        if (unsubscribeNotifications) unsubscribeNotifications();
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, [setUser, setLoading, setDemands, setSprints, subscribeNotifications, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg-base">
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
          <p className="text-text-muted text-sm font-medium animate-pulse">Energizando plataforma de gestão...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-bg-base app-glow overflow-hidden relative">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Visible only on Mobile (controlled by sidebarOpen) */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-[60] transform transition-transform duration-300 ease-in-out md:hidden",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden w-full relative">
        {/* Toggle Button for Mobile */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 p-2.5 bg-zinc-900 border border-white/5 rounded-xl text-zinc-400 hover:text-white md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Header - Visible only on Desktop */}
        <div className="hidden md:block">
          <Header />
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-hidden flex flex-col">
          {children}
        </div>
      </main>

      {/* Botão Flutuante de Notificação Global */}
      <FloatingNotificationButton />

      {/* Modais Globais */}
      <NovaDemandaModal />
      <SprintDetalhesModal />
      <NovaSprintModal />
    </div>
  );
}
