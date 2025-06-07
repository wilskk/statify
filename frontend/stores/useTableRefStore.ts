import { create } from "zustand";

export interface TableRefState {
    viewMode: 'numeric' | 'label';
    setViewMode: (mode: 'numeric' | 'label') => void;
    toggleViewMode: () => void;
}

export const useTableRefStore = create<TableRefState>()((set) => ({
    viewMode: 'numeric',
    setViewMode: (mode) => set({ viewMode: mode }),
    toggleViewMode: () => set((state) => ({ viewMode: state.viewMode === 'numeric' ? 'label' : 'numeric' })),
}));