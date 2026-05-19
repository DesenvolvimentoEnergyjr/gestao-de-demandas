'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/useUIStore';

export const useKeyboardShortcuts = () => {
  const router = useRouter();
  const { closeAllModals } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'Escape') {
        closeAllModals();
        if (isInputing) {
          target.blur();
        }
        return;
      }

      if (isInputing) return;

      switch (e.key.toLowerCase()) {
        case 'k':
          e.preventDefault();
          router.push('/kanban');
          break;
        case 't':
          e.preventDefault();
          router.push('/timeline');
          break;
        case 's':
          e.preventDefault();
          router.push('/sprints');
          break;
        case 'm':
          e.preventDefault();
          router.push('/membros');
          break;
        case '/':
          e.preventDefault();
          const searchInput = document.getElementById('global-search');
          if (searchInput) {
            searchInput.focus();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, closeAllModals]);
};
