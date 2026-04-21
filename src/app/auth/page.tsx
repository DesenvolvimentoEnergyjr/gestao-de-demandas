'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signInWithGoogle, createUserDoc, getUserDoc } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const firebaseUser = await signInWithGoogle();
      if (firebaseUser) {
        let userData = await getUserDoc(firebaseUser.uid);
        if (!userData) {
          userData = await createUserDoc(firebaseUser);
        }
        router.push('/kanban');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-bg-base app-glow p-4">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-center">
        <div className="w-24 h-24 bg-[#050505] border-2 border-secondary/40 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-2xl shadow-secondary/20 ring-1 ring-secondary/10 overflow-hidden relative">
          <Image 
            src="/logo-energy.svg" 
            alt="Energy Júnior" 
            width={56} 
            height={56}
            priority
            className="object-contain" 
          />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight leading-none">Energy Júnior</h1>
        <p className="text-text-muted text-sm font-black uppercase tracking-[0.25em] mt-3">Gestão de Demandas</p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md p-10 bg-bg-section/80 backdrop-blur-xl border-border-subtle animate-in fade-in zoom-in-95 duration-500 delay-100 rounded-[32px]">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Bem-vindo de volta</h2>
          <p className="text-text-muted text-sm px-4 font-medium leading-relaxed italic opacity-80">Acesse sua conta para gerenciar as demandas da EJ.</p>
        </div>

        <div className="space-y-4">
          <Button
            variant="ghost"
            className="w-full justify-center gap-4 h-14 text-white border-white/5 hover:bg-white/5 bg-white/[0.02] transition-all rounded-2xl group active:scale-[0.98]"
            onClick={handleGoogleLogin}
            loading={loading}
          >
            <div className="relative w-5 h-5 group-hover:scale-110 transition-transform">
              <Image 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                fill 
                alt="Google"
                className="object-contain" 
              />
            </div>
            <span className="font-bold tracking-tight">Entrar com Google</span>
          </Button>
        </div>
        
        <div className="mt-10 text-center">
          <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Plataforma interna • Uso restrito</p>
        </div>
      </Card>
    </div>
  );
}
