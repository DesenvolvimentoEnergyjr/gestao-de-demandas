'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getUserDoc, createUserDoc } from '@/lib/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { NovaDemandaModal } from '@/components/modals/NovaDemandaModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        let userData = await getUserDoc(firebaseUser.uid);
        
        // If it's a first-time login, create the user document
        if (!userData) {
          userData = await createUserDoc(firebaseUser);
        }
        
        setUser(userData);
      } else {
        setUser(null);
        router.push('/auth');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading, router]);

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
    <div className="flex h-screen bg-bg-base app-glow overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-[200px] flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          {children}
        </div>
      </main>
      <NovaDemandaModal />
    </div>
  );
}
