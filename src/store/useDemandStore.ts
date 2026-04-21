import { create } from 'zustand';
import { Demand } from '@/types';

interface DemandState {
  demands: Demand[];
  loading: boolean;
  selectedDemand: Demand | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setDemands: (demands: Demand[]) => void;
  addDemand: (demand: Demand) => void;
  updateDemand: (id: string, data: Partial<Demand>) => void;
  removeDemand: (id: string) => void;
  setSelectedDemand: (demand: Demand | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useDemandStore = create<DemandState>((set) => ({
  demands: [],
  loading: false,
  selectedDemand: null,
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setDemands: (demands) => set({ demands, loading: false }),
  addDemand: (demand) => set((state) => ({ demands: [demand, ...state.demands] })),
  updateDemand: (id, data) =>
    set((state) => ({
      demands: state.demands.map((d) => (d.id === id ? { ...d, ...data } : d)),
    })),
  removeDemand: (id) =>
    set((state) => ({
      demands: state.demands.filter((d) => d.id !== id),
    })),
  setSelectedDemand: (selectedDemand) => set({ selectedDemand }),
  setLoading: (loading) => set({ loading }),
}));
