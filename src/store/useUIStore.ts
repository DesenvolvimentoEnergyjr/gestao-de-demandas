import { create } from 'zustand';
import { DemandStatus } from '@/types';

interface UIState {
  novaDemandaOpen: boolean;
  novaDemandaInitialStatus: DemandStatus;
  novaSprintOpen: boolean;
  sprintDetalhesOpen: boolean;
  selectedSprintId: string | null;
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  selectedDemandId: string | null;
  demandModalMode: 'create' | 'view' | 'edit';
  openNovaDemanda: (status?: DemandStatus) => void;
  closeNovaDemanda: () => void;
  openNovaSprint: () => void;
  closeNovaSprint: () => void;
  openSprintDetalhes: (id: string) => void;
  closeSprintDetalhes: () => void;
  openDemanda: (id: string, mode?: 'view' | 'edit') => void;
  setDemandModalMode: (mode: 'create' | 'view' | 'edit') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  novaDemandaOpen: false,
  novaDemandaInitialStatus: 'backlog',
  novaSprintOpen: false,
  sprintDetalhesOpen: false,
  selectedSprintId: null,
  sidebarCollapsed: false,
  sidebarOpen: false,
  selectedDemandId: null,
  demandModalMode: 'create',
  openNovaDemanda: (status) => set({ 
    novaDemandaOpen: true, 
    novaDemandaInitialStatus: status || 'backlog',
    demandModalMode: 'create',
    selectedDemandId: null
  }),
  closeNovaDemanda: () => set({ novaDemandaOpen: false, selectedDemandId: null }),
  openNovaSprint: () => set({ novaSprintOpen: true }),
  closeNovaSprint: () => set({ novaSprintOpen: false }),
  openSprintDetalhes: (id) => set({ sprintDetalhesOpen: true, selectedSprintId: id }),
  closeSprintDetalhes: () => set({ sprintDetalhesOpen: false, selectedSprintId: null }),
  openDemanda: (id, mode) => set({ 
    novaDemandaOpen: true, 
    selectedDemandId: id, 
    demandModalMode: mode || 'view' 
  }),
  setDemandModalMode: (mode) => set({ demandModalMode: mode }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
}));
