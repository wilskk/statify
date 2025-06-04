import { BaseModalProps } from "@/types/modalTypes";

export enum GoToMode {
    CASE = "case",
    VARIABLE = "variable",
}

export interface GoToModalProps extends BaseModalProps {
    defaultMode?: GoToMode;
    // variables?: string[]; // Will be fetched from useVariableStore via the hook
    // totalCases?: number; // Will be fetched from useDataStore via the hook
} 