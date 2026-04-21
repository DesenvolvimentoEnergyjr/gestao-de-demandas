'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useDemandStore } from '@/store/useDemandStore';
import { Avatar } from '@/components/ui/Avatar';
import { Bell, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Kanban',     href: '/kanban' },
  { name: 'Timeline',   href: '/timeline' },
  { name: 'Sprints',    href: '/sprints' },
  { name: 'Assessores', href: '/assessores' },
];

export const Header = () => {
  const { user } = useAuthStore();
  const { searchQuery, setSearchQuery } = useDemandStore();
  const pathname = usePathname();

  return (
    <header className="h-14 border-b border-zinc-800 bg-[#0f0f0f]/80 backdrop-blur-sm flex items-center px-6 sticky top-0 z-40">
      {/* Left: Page title + tabs */}
      <div className="flex items-center gap-8 flex-1 min-w-0">
        <h2 className="text-sm font-bold text-white whitespace-nowrap flex-shrink-0">
          Gestão de Demandas
        </h2>

        {/* Tab navigation */}
        <nav className="flex items-center h-14">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'px-4 h-full flex items-center text-sm font-medium transition-all relative',
                  isActive
                    ? 'text-secondary'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                {tab.name}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: search + bell + avatar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-focus-within:text-secondary transition-colors" />
          <input
            type="text"
            placeholder="Buscar demanda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 bg-[#1a1a1a] border border-white/[0.06] rounded-lg py-1.5 pl-8 pr-3 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-secondary/50 transition-all"
          />
        </div>

        {/* Bell */}
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-secondary rounded-full" />
        </button>

        {/* Avatar */}
        <Avatar
          src={user?.photoURL}
          alt={user?.name}
          fallback={user?.name?.substring(0, 1)}
          size="sm"
          className="border-2 border-secondary/20 cursor-pointer hover:border-secondary/40 transition-colors"
        />
      </div>
    </header>
  );
};
