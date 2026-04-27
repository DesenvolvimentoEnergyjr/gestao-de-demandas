'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-center app-glow">
      <title>404 - Página não encontrada | Energy Júnior</title>

      {/* Glow effects are handled by app-glow class in globals.css */}

      <div className="relative z-10 flex flex-col items-center max-w-lg w-full">
        {/* Logo */}
        <div className="mb-12 animate-fade-in">
          <div className="relative w-20 h-20 md:w-24 md:h-24 animate-float">
            <Image
              src="/logo-energy.svg"
              alt="Energy Júnior Logo"
              fill
              className="object-contain filter drop-shadow-[0_0_15px_rgba(11,175,77,0.3)]"
              priority
            />
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-8xl md:text-9xl font-black mb-4 tracking-tighter">
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20">
            404
          </span>
        </h1>

        <div className="h-1 w-20 bg-secondary rounded-full mb-8" />

        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Página não encontrada
        </h2>

        <p className="text-text-muted text-lg mb-12 max-w-sm">
          Parece que você se perdeu no sistema. O link que você seguiu pode estar quebrado ou a página foi movida.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/kanban"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-secondary to-secondary-dark hover:brightness-110 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-glow"
          >
            <Home className="w-5 h-5" />
            Voltar ao Kanban
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar anterior
          </button>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10 opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px]" />
      </div>

      <footer className="absolute bottom-8 text-text-muted text-sm font-medium">
        &copy; {new Date().getFullYear()} Energy Júnior - Todos os direitos reservados.
      </footer>
    </div>
  );
}
