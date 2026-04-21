import { create } from 'zustand';
import { DemandStatus } from '@/types';

interface UIState {
  novaDemandaOpen: boolean;
  novaDemandaInitialStatus: DemandStatus;
  novaSprintOpen: boolean;
  sprintDetalhesOpen: boolean;
  selectedSprintId: string | null;
  sidebarCollapsed: boolean;
  openNovaDemanda: (status?: DemandStatus) => void;
  closeNovaDemanda: () => void;
  openNovaSprint: () => void;
  closeNovaSprint: () => void;
  openSprintDetalhes: (id: string) => void;
  closeSprintDetalhes: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  novaDemandaOpen: false,
  novaDemandaInitialStatus: 'backlog',
  novaSprintOpen: false,
  sprintDetalhesOpen: false,
  selectedSprintId: null,
  sidebarCollapsed: false,
  openNovaDemanda: (status) => set({ 
    novaDemandaOpen: true, 
    novaDemandaInitialStatus: status || 'backlog' 
  }),
  closeNovaDemanda: () => set({ novaDemandaOpen: false }),
  openNovaSprint: () => set({ novaSprintOpen: true }),
  closeNovaSprint: () => set({ novaSprintOpen: false }),
  openSprintDetalhes: (id) => set({ sprintDetalhesOpen: true, selectedSprintId: id }),
  closeSprintDetalhes: () => set({ sprintDetalhesOpen: false, selectedSprintId: null }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
