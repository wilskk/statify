import { Variable } from "@/types/Variable";
import { useSortCases } from "./hooks/useSortCases";

export interface SortVariableConfig {
    variable: Variable;
    direction: 'asc' | 'desc';
}

export interface SortCasesModalProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

export type SortCasesUIProps = ReturnType<typeof useSortCases> & SortCasesModalProps; 