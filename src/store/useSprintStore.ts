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
  removeSprint: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useSprintStore = create<SprintState>((set) => ({
  sprints: [],
  activeSprint: null,
  loading: false,
  setSprints: (sprints) => set({ sprints, loading: false }),
  setActiveSprint: (activeSprint) => set({ activeSprint }),
  addSprint: (sprint) => set((state) => ({ sprints: [sprint, ...state.sprints] })),
  getActiveSprint: () => {
    const state = useSprintStore.getState();
    return state.sprints.find((s) => s.status === 'active') ?? null;
  },
  updateSprint: (id, data) =>
    set((state) => ({
      sprints: state.sprints.map((s) => (s.id === id ? { ...s, ...data } : s)),
    })),
  removeSprint: (id) =>
    set((state) => ({
      sprints: state.sprints.filter((s) => s.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
}));
