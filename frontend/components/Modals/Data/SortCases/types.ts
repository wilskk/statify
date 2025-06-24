import { Variable } from "@/types/Variable";

export interface SortVariableConfig {
    variable: Variable;
    direction: 'asc' | 'desc';
}

export interface SortCasesModalProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
} 