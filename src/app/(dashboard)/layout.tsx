'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { onAuthChange, getUserDoc, createUserDoc, setSessionCookie, clearSessionCookie } from '@/lib/auth';
import { subscribeToDemands, subscribeToSprints } from '@/lib/firestore';
import { useAuthStore } from '@/store/useAuthStore';
import { useDemandStore } from '@/store/useDemandStore';
import { useSprintStore } from '@/store/useSprintStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import dynamic from 'next/dynamic';
import { FloatingNotificationButton } from '@/components/layout/FloatingNotificationButton';
import { Menu } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/lib/utils';

// Dynamic imports for heavy modals to improve initial load performance
const NovaDemandaModal = dynamic(() => import('@/components/modals/NovaDemandaModal').then(mod => mod.NovaDemandaModal), { ssr: false });
const SprintDetalhesModal = dynamic(() => import('@/components/modals/SprintDetalhesModal').then(mod => mod.SprintDetalhesModal), { ssr: false });
const NovaSprintModal = dynamic(() => import('@/components/modals/NovaSprintModal').then(mod => mod.NovaSprintModal), { ssr: false });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, setUser, setLoading } = useAuthStore();
  const { setDemands } = useDemandStore();
  const { setSprints } = useSprintStore();
  const { subscribe: subscribeNotifications } = useNotificationStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    let unsubscribeNotifications: (() => void) | undefined;
    let unsubscribeDemands: (() => void) | undefined;
    let unsubscribeSprints: (() => void) | undefined;

    const unsubscribeAuth = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        unsubscribeNotifications = subscribeNotifications(firebaseUser.uid);
        
        unsubscribeDemands = subscribeToDemands((data) => {
          setDemands(data);
        });

        unsubscribeSprints = subscribeToSprints((data) => {
          setSprints(data);
        });

        try {
          const userData = await getUserDoc(firebaseUser.uid);
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

          await setSessionCookie();
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
        if (unsubscribeDemands) unsubscribeDemands();
        if (unsubscribeSprints) unsubscribeSprints();
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeDemands) unsubscribeDemands();
      if (unsubscribeSprints) unsubscribeSprints();
    };
  }, [setUser, setLoading, setDemands, setSprints, subscribeNotifications, router]);

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
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] xl:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className={cn(
            "fixed inset-y-0 left-0 z-[60] transform transition-transform duration-300 ease-in-out xl:hidden",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <Sidebar />
          </div>

          <main className="flex-1 flex flex-col overflow-hidden w-full relative">
            <div className="flex md:hidden items-center justify-between px-4 h-16 border-b border-white/[0.05] bg-bg-base/80 backdrop-blur-xl sticky top-0 z-40 gap-2">
              <div className="w-8 h-8 relative shrink-0">
                <Image src="/logo-energy.svg" alt="Logo" fill sizes="32px" className="object-contain" />
              </div>

              <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                <span className="text-[10px] font-black text-white uppercase tracking-tight truncate">Energy Júnior</span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest truncate mt-0.5">Gestão de Demandas</span>
              </div>

              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 bg-zinc-900/50 border border-white/5 rounded-xl text-zinc-400 hover:text-white transition-all active:scale-95 shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            <div className="hidden md:block">
              <Header />
            </div>

            <motion.div 
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col no-scrollbar"
            >
              {children}
            </motion.div>
          </main>

          <FloatingNotificationButton />

          <NovaDemandaModal />
          <SprintDetalhesModal />
          <NovaSprintModal />
        </>
      ) : null}
    </div>
  );
}
