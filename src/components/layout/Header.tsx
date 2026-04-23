'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useDemandStore } from '@/store/useDemandStore';
import { useUIStore } from '@/store/useUIStore';
import { Avatar } from '@/components/ui/Avatar';
import { Search, Clock, AlertCircle, Plus, Settings, LogOut, ChevronDown, Menu } from 'lucide-react';
import { signOut } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/useToastStore';

const tabs = [
  { name: 'Kanban', href: '/kanban' },
  { name: 'Timeline', href: '/timeline' },
  { name: 'Sprints', href: '/sprints' },
  { name: 'Assessores', href: '/assessores' },
];

export const Header = () => {
  const { user } = useAuthStore();
  const { demands } = useDemandStore();
  const { openNovaDemanda, openDemanda, setSidebarOpen } = useUIStore();
  const [localSearch, setLocalSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      // Se clicar fora do avatar, fecha o menu do usuário
      if (showUserMenu && !(event.target as HTMLElement).closest('.user-menu-trigger')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.info('Sessão encerrada.');
      router.push('/auth');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const filteredDemands = useMemo(() => {
    if (!localSearch.trim()) return [];
    return demands
      .filter((d) =>
        d.title.toLowerCase().includes(localSearch.toLowerCase()) ||
        d.code.toLowerCase().includes(localSearch.toLowerCase())
      )
      .slice(0, 5);
  }, [demands, localSearch]);

  const handleResultClick = (demandId: string) => {
    openDemanda(demandId, 'view');
    setLocalSearch('');
    setShowResults(false);
  };

  return (
    <header className="h-16 md:h-20 border-b border-white/[0.05] bg-bg-section/80 backdrop-blur-xl flex items-center px-4 md:px-6 xl:px-10 sticky top-0 z-40 gap-3 md:gap-4">
      {/* Left: Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 md:w-10 md:h-10 relative shrink-0">
          <Image
            src="/logo-energy.svg"
            alt="Energy Júnior"
            fill
            className="object-contain"
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-white font-black text-sm md:text-base leading-none tracking-tight">Energy Júnior</h1>
          <p className="text-[9px] md:text-[10px] font-bold text-secondary uppercase tracking-[0.1em] mt-0.5 md:mt-1">Gestão de Demandas</p>
        </div>
      </div>

      {/* Sidebar toggle — visible between md and xl when tabs are hidden */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="xl:hidden p-2 bg-zinc-900/50 border border-white/5 rounded-xl text-zinc-400 hover:text-white transition-all active:scale-95 shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Center: Tabs — only show at xl (1280px+) when there's enough room */}
      <nav className="hidden xl:flex flex-1 justify-center h-full">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap',
                  isActive
                    ? 'bg-secondary/10 text-secondary'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                {tab.name}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-secondary rounded-full shadow-[0_0_8px_rgba(11,175,77,1)]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for non-xl screens */}
      <div className="flex-1 xl:hidden" />

      {/* Right: Actions */}
      <div className="flex items-center gap-3 md:gap-4 lg:gap-6 shrink-0">
        {/* Nova Demanda Button - Only for Diretores */}
        {user?.role === 'diretor' && (
          <Button
            onClick={() => openNovaDemanda()}
            className="gap-2 px-3 md:px-5 h-9 md:h-10 shadow-lg shadow-secondary/20 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Demanda</span>
          </Button>
        )}

        {/* Search */}
        <div className="relative group w-40 md:w-52 lg:w-64" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-focus-within:text-secondary transition-colors" />
          <input
            type="text"
            placeholder="Buscar..."
            value={localSearch}
            onFocus={() => setShowResults(true)}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              setShowResults(true);
            }}
            className="w-full bg-[#1a1a1a] border border-white/[0.06] rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-secondary/50 transition-all shadow-inner"
          />

          {/* Search Results Dropdown */}
          {showResults && localSearch.trim() && (
            <div className="absolute top-full mt-3 right-0 w-[min(320px,calc(100vw-32px))] bg-bg-section border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50 backdrop-blur-xl">
              <div className="p-2">
                <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Resultados</span>
                  <span className="text-[10px] font-bold text-zinc-600">{filteredDemands.length}</span>
                </div>

                <div className="mt-1 py-1">
                  {filteredDemands.length > 0 ? (
                    filteredDemands.map((demand) => (
                      <button
                        key={demand.id}
                        onClick={() => handleResultClick(demand.id)}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-secondary/30 group-hover:bg-secondary/5 transition-all">
                          <Clock className="w-4 h-4 text-zinc-600 group-hover:text-secondary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors truncate">{demand.title}</p>
                          <p className="text-[10px] text-zinc-500 font-medium tracking-tight mt-0.5">{demand.code}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 flex flex-col items-center justify-center text-center">
                      <AlertCircle className="w-6 h-6 text-zinc-700 mb-2" />
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nada encontrado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative user-menu-trigger">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 md:gap-3 p-1.5 md:pr-3 bg-zinc-950 border border-white/5 rounded-2xl hover:bg-zinc-900 transition-all group"
          >
            <Avatar
              src={user?.photoURL}
              alt={user?.name}
              fallback={user?.name?.substring(0, 1)}
              size="sm"
              className="border border-zinc-800 group-hover:border-secondary transition-all"
            />
            <div className="hidden lg:flex flex-col items-start text-left">
              <span className="text-[11px] font-black text-white leading-tight">{user?.name?.split(' ')[0]}</span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{user?.role}</span>
            </div>
            <ChevronDown className={cn("hidden lg:block ml-1 w-3.5 h-3.5 text-zinc-600 transition-transform duration-300", showUserMenu && "rotate-180")} />
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute top-full mt-3 right-0 w-56 bg-bg-section border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50 backdrop-blur-xl">
              <div className="p-2 space-y-1">
                <Link
                  href="/configuracoes"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold"
                >
                  <Settings className="w-4 h-4" />
                  Configurações
                </Link>
                <div className="h-px bg-white/5 mx-2" />
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  Sair do Sistema
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
