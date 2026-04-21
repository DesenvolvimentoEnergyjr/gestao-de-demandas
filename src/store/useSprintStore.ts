import { create } from 'zustand';
import { Sprint } from '@/types';

interface SprintState {
  sprints: Sprint[];
  activeSprint: Sprint | null;
  loading: boolean;
  setSprints: (sprints: Sprint[]) => void;
  setActiveSprint: (sprint: Sprint | null) => void;
  addSprint: (sprint: Sprint) => void;
  updateSprint: (id: string, data: Partial<Sprint>) => void;
  setLoading: (loading: boolean) => void;
}

export const useSprintStore = create<SprintState>((set) => ({
  sprints: [],
  activeSprint: null,
  loading: false,
  setSprints: (sprints) => set({ sprints, loading: false }),
  setActiveSprint: (activeSprint) => set({ activeSprint }),
  addSprint: (sprint) => set((state) => ({ sprints: [sprint, ...state.sprints] })),
  updateSprint: (id, data) =>
    set((state) => ({
      sprints: state.sprints.map((s) => (s.id === id ? { ...s, ...data } : s)),
    })),
  setLoading: (loading) => set({ loading }),
}));
