import { create } from "zustand";
import React from "react";

export interface TableRefState {
    viewMode: 'numeric' | 'label';
    setViewMode: (mode: 'numeric' | 'label') => void;
    toggleViewMode: () => void;
    dataTableRef: React.RefObject<any> | null;
    variableTableRef: React.RefObject<any> | null;
    setDataTableRef: (ref: React.RefObject<any>) => void;
    setVariableTableRef: (ref: React.RefObject<any>) => void;
}

export const useTableRefStore = create<TableRefState>((set) => ({
    viewMode: 'numeric',
    setViewMode: (mode) => set({ viewMode: mode }),
    toggleViewMode: () => set((state) => ({ viewMode: state.viewMode === 'numeric' ? 'label' : 'numeric' })),
    dataTableRef: null,
    variableTableRef: null,
    setDataTableRef: (ref) => set({ dataTableRef: ref }),
    setVariableTableRef: (ref) => set({ variableTableRef: ref }),
}));