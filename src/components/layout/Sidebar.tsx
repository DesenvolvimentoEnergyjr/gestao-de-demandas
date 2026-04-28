'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  TrendingUp,
  RefreshCw,
  Users,
  Settings,
  LogOut,
  Plus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { signOut } from '@/lib/auth';
import { motion } from 'framer-motion';

const navigation = [
  { name: 'Kanban', href: '/kanban', icon: LayoutGrid },
  { name: 'Timeline', href: '/timeline', icon: TrendingUp },
  { name: 'Sprints', href: '/sprints', icon: RefreshCw },
  { name: 'Membros', href: '/membros', icon: Users },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { openNovaDemanda, setSidebarOpen } = useUIStore();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await signOut();
      logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside className="h-full w-[280px] max-w-[calc(100vw-48px)] bg-bg-section border-r border-white/5 flex flex-col z-50">
      {/* Brand */}
      <div className="px-6 py-8 flex flex-col gap-4 relative">
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-6 right-4 p-2 text-zinc-500 hover:text-white xl:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 relative">
          <Image
            src="/logo-energy.svg"
            alt="Energy Júnior"
            fill
            sizes="48px"
            className="object-contain"
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-white font-black text-xl leading-none tracking-tight">Energy Júnior</h1>
          <p className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mt-2">Gestão de Demandas</p>
        </div>
      </div>

      {/* Nova Demanda Button */}
      <div className="px-4 pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            openNovaDemanda();
            setSidebarOpen(false);
          }}
          className="w-full h-12 flex items-center justify-center gap-2 px-4 rounded-xl bg-gradient-to-r from-secondary to-secondary-dark text-white text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-secondary/20"
        >
          <Plus className="w-4 h-4" />
          Nova Demanda
        </motion.button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 pt-8 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all group relative',
                isActive
                  ? 'text-secondary'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-secondary/10 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon
                className={cn(
                  'w-[18px] h-[18px] relative z-10',
                  isActive ? 'text-secondary' : 'text-zinc-600 group-hover:text-zinc-400'
                )}
              />
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-white/[0.06] space-y-1">
        <Link
          href="/configuracoes"
          onClick={() => setSidebarOpen(false)}
          className={cn(
            "flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all group relative",
            pathname === '/configuracoes'
              ? 'text-secondary'
              : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          {pathname === '/configuracoes' && (
            <motion.div
              layoutId="activeNav"
              className="absolute inset-0 bg-secondary/10 rounded-xl"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Settings className={cn(
            "w-[18px] h-[18px] relative z-10",
            pathname === '/configuracoes' ? 'text-secondary' : 'text-zinc-600 group-hover:text-zinc-400'
          )} />
          <span className="relative z-10">Configurações</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-[0.1em] text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all group"
        >
          <LogOut className="w-[18px] h-[18px] text-zinc-600 group-hover:text-red-400" />
          Sair
        </button>
      </div>
    </aside>
  );
};
