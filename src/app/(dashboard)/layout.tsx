'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { onAuthChange, getUserDoc, createUserDoc, setSessionCookie, clearSessionCookie } from '@/lib/auth';
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
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
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
            await clearSessionCookie();
            setUser(null);
            router.push('/auth');
            return;
          }

          // Refresh the session cookie on page load / auth state change
          await setSessionCookie();

          setDemands(demandsData);
          setSprints(sprintsData);
          setUser(finalUser);
        } catch (error) {
          console.error('Erro ao carregar dados iniciais:', error);
          await clearSessionCookie();
          setUser(null);
          router.push('/auth');
        }
      } else {
        await clearSessionCookie();
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

  // ✅ FIX: Retorna null antes do mount para garantir que servidor e cliente
  // renderizem o mesmo HTML inicial, evitando o erro de hidratação.
  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-bg-base app-glow overflow-hidden relative">
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
          <p className="text-text-muted text-sm font-medium animate-pulse">Energizando plataforma de gestão...</p>
        </div>
      ) : user ? (
        <>
          {/* Sidebar Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] xl:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar - Visible only on Mobile (controlled by sidebarOpen) */}
          <div className={cn(
            "fixed inset-y-0 left-0 z-[60] transform transition-transform duration-300 ease-in-out xl:hidden",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <Sidebar />
          </div>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col overflow-hidden w-full relative">
            {/* Mobile Top Bar */}
            <div className="flex md:hidden items-center justify-between px-4 h-16 border-b border-white/[0.05] bg-bg-base/80 backdrop-blur-xl sticky top-0 z-40 gap-2">
              {/* Logo Left */}
              <div className="w-8 h-8 relative shrink-0">
                <Image src="/logo-energy.svg" alt="Logo" fill className="object-contain" />
              </div>

              {/* Title Center (Stacked) */}
              <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                <span className="text-[10px] font-black text-white uppercase tracking-tight truncate">Energy Júnior</span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest truncate mt-0.5">Gestão de Demandas</span>
              </div>

              {/* Menu Right */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 bg-zinc-900/50 border border-white/5 rounded-xl text-zinc-400 hover:text-white transition-all active:scale-95 shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

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
        </>
      ) : null}
    </div>
  );
}
