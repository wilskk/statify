import { create } from "zustand";
import { immer } from "zustand/middleware/immer"; // Menggunakan immer jika konsisten dengan store lain
import { RefObject } from "react";
import Handsontable from "handsontable";

interface HotTableComponent {
    hotInstance: Handsontable;
}

export interface TableRefState {
    dataTableRef: RefObject<HotTableComponent> | null;
    variableTableRef: RefObject<HotTableComponent> | null;
    setDataTableRef: (ref: RefObject<HotTableComponent> | null) => void;
    setVariableTableRef: (ref: RefObject<HotTableComponent> | null) => void;
}

export const useTableRefStore = create<TableRefState>()(
    immer((set) => ({
        dataTableRef: null,
        variableTableRef: null,

        setDataTableRef: (ref) => {
            set({ dataTableRef: ref });
        },

        setVariableTableRef: (ref) => {
            set({ variableTableRef: ref });
        },
    }))
);