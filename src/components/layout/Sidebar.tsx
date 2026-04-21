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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { signOut } from '@/lib/auth';

const navigation = [
  { name: 'Kanban', href: '/kanban', icon: LayoutGrid },
  { name: 'Timeline', href: '/timeline', icon: TrendingUp },
  { name: 'Sprints', href: '/sprints', icon: RefreshCw },
  { name: 'Assessores', href: '/assessores', icon: Users },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { openNovaDemanda } = useUIStore();
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
    <aside className="fixed left-0 top-0 bottom-0 w-[200px] bg-[#0f0f0f] border-r border-white/[0.06] flex flex-col z-50">
      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 relative">
          <Image
            src="/logo-energy.svg"
            alt="Energy Júnior"
            fill
            className="object-contain"
          />
        </div>
        <h1 className="text-white font-bold text-sm leading-tight">Energy Júnior</h1>
      </div>

      {/* Nova Demanda Button */}
      <div className="px-3 pt-4">
        <button
          onClick={openNovaDemanda}
          className="w-full h-11 flex items-center justify-center gap-2 px-3 rounded-xl bg-secondary hover:bg-secondary/90 text-white text-[13px] font-bold transition-all shadow-lg shadow-secondary/20 active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" />
          Nova Demanda
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
              )}
            >
              <item.icon
                className={cn(
                  'w-[18px] h-[18px]',
                  isActive ? 'text-secondary' : 'text-zinc-600 group-hover:text-zinc-400'
                )}
              />
              {item.name}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/[0.06] space-y-0.5">
        <Link
          href="/configuracoes"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group",
            pathname === '/configuracoes'
              ? 'bg-secondary/15 text-secondary'
              : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
          )}
        >
          <Settings className={cn(
            "w-[18px] h-[18px]",
            pathname === '/configuracoes' ? 'text-secondary' : 'text-zinc-600 group-hover:text-zinc-400'
          )} />
          Configurações
          {pathname === '/configuracoes' && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary" />
          )}
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all group"
        >
          <LogOut className="w-[18px] h-[18px] text-zinc-600 group-hover:text-red-400" />
          Sair
        </button>
      </div>
    </aside>
  );
};
