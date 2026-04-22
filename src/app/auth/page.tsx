'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { signInWithGoogle, createUserDoc, getUserDoc, setSessionCookie } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

        // Set the session cookie for middleware auth
        await setSessionCookie();

        // Redirect to original destination or /kanban
        const redirectTo = searchParams.get('redirect') || '/kanban';
        router.push(redirectTo);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-bg-base app-glow p-6 md:p-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-center">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-[#050505] border-2 border-secondary/40 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mb-5 md:mb-6 shadow-2xl shadow-secondary/20 ring-1 ring-secondary/10 overflow-hidden">
          {/* ✅ Single Image — size controlled via className instead of two separate elements */}
          <Image
            src="/logo-energy.svg"
            alt="Energy Júnior"
            width={56}
            height={56}
            priority
            className="object-contain w-12 h-12 md:w-14 md:h-14"
          />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none">Energy Júnior</h1>
        <p className="text-text-muted text-[10px] md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.25em] mt-3">Gestão de Demandas</p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md p-8 md:p-10 bg-bg-section/80 backdrop-blur-xl border-border-subtle animate-in fade-in zoom-in-95 duration-500 delay-100 rounded-[32px]">
        <div className="mb-8 md:mb-10 text-center">
          <h2 className="text-xl md:text-2xl font-black text-white mb-3 tracking-tight">Bem-vindo de volta</h2>
          <p className="text-text-muted text-xs md:text-sm px-2 md:px-4 font-medium leading-relaxed italic opacity-80">Acesse sua conta para gerenciar as demandas da EJ.</p>
        </div>

        <div className="space-y-4">
          <Button
            variant="ghost"
            className="w-full justify-center gap-4 h-14 text-white border-white/5 hover:bg-white/5 bg-white/[0.02] transition-all rounded-2xl group active:scale-[0.98]"
            onClick={handleGoogleLogin}
            loading={loading}
          >
            {/* ✅ Replaced fill with explicit width/height — no extra wrapper div needed */}
            <Image
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              width={20}
              height={20}
              alt="Google"
              className="object-contain group-hover:scale-110 transition-transform"
            />
            <span className="font-bold tracking-tight">Entrar com Google</span>
          </Button>
        </div>

        <div className="mt-8 md:mt-10 text-center">
          <p className="text-[9px] md:text-[10px] font-black text-zinc-700 uppercase tracking-widest">Plataforma interna • Uso restrito</p>
        </div>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  );
}