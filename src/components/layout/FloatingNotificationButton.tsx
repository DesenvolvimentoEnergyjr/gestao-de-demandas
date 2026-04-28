'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useNotificationStore } from '@/store/useNotificationStore';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/firestore';
import { useAuthStore } from '@/store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

export const FloatingNotificationButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { notifications, unreadCount, loading } = useNotificationStore();
  const { user } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (id: string) => {
    await markNotificationAsRead(id);
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    if (user) {
      await markAllNotificationsAsRead(user.uid);
    }
  };

  if (!mounted) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100]" 
      ref={containerRef}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute bottom-16 right-0 w-[calc(100vw-48px)] sm:w-80 bg-bg-section/90 border border-white/[0.08] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl mb-4"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-secondary" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Notificações</h3>
              </div>
              {unreadCount > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 hover:text-secondary uppercase tracking-widest transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  Ler todas
                </motion.button>
              )}
            </div>

            <div className="max-h-[350px] overflow-y-auto no-scrollbar">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 bg-white/5 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-2 bg-white/10 rounded w-1/2" />
                        <div className="h-2 bg-white/5 rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-white/[0.03]">
                  {notifications.map((notif, i) => (
                    <motion.button
                      key={notif.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleNotificationClick(notif.id)}
                      className={cn(
                        "w-full text-left p-4 hover:bg-white/[0.02] transition-all flex items-start gap-3 group relative",
                        !notif.read && "bg-secondary/[0.02]"
                      )}
                    >
                      {!notif.read && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-secondary rounded-full" />
                      )}
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all",
                        notif.read
                          ? "bg-zinc-900 border-white/5 text-zinc-600"
                          : "bg-secondary/10 border-secondary/20 text-secondary"
                      )}>
                        <Inbox className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <p className={cn(
                            "text-xs font-bold truncate",
                            notif.read ? "text-zinc-400" : "text-white"
                          )}>
                            {notif.title}
                          </p>
                          <span className="text-[9px] font-bold text-zinc-600 whitespace-nowrap mt-0.5">
                            {mounted && formatRelativeTime(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 flex flex-col items-center justify-center text-center px-6"
                >
                  <Inbox className="w-8 h-8 text-zinc-700 mb-3" />
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Tudo limpo por aqui</p>
                </motion.div>
              )}
            </div>

            <div className="p-3 border-t border-white/5 bg-zinc-950/50 flex justify-center">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">Notificações serão apagadas em 28 dias</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all group relative",
          "bg-gradient-to-br from-secondary via-secondary to-secondary-dark"
        )}
      >
        <Bell className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />
        )}
      </motion.button>
    </motion.div>
  );
};
