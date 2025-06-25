import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { variableService } from "@/services/data";
import { Variable } from "@/types/Variable";
import { v4 as uuidv4 } from 'uuid';
import { transformVariablesToTableData } from '@/components/pages/dashboard/variableTable/utils';
import { useDataStore } from '@/stores/useDataStore';

export type VariableStoreError = {
    message: string;
    source: string;
    originalError?: any;
};

const inferDefaultValues = (type: Variable['type']): Partial<Variable> => {
    const numericTypes: Variable['type'][] = ["NUMERIC", "DOT", "COMMA", "SCIENTIFIC"];
    return {
        decimals: numericTypes.includes(type) ? 2 : 0,
        align: type === "STRING" ? "left" : "right",
        measure: "unknown",
        role: "input"
    };
};

// SPSS reserved keywords (cannot be used as variable names)
const RESERVED_KEYWORDS = new Set(["ALL","AND","BY","EQ","GE","GT","LE","LT","NE","NOT","OR","TO","WITH"]);

const processVariableName = (name: string, existingVariables: Variable[]): {
    isValid: boolean;
    message?: string;
    processedName?: string;
} => {
    if (!name) return { isValid: false, message: "Variable name cannot be empty" };
    // Trim and replace spaces
    let processedName = name.trim().replace(/\s+/g, '_');
    // Keep only allowed chars: letters, digits, dot, underscore, @, #, $
    processedName = processedName.replace(/[^A-Za-z0-9._@#$]/g, '_');
    // Must start with letter or @,#,$
    if (!/^[A-Za-z@#$]/.test(processedName)) processedName = 'VAR_' + processedName;
    // Remove trailing dots or underscores
    processedName = processedName.replace(/[._]+$/g, '');
    // Enforce max length 64
    if (processedName.length > 64) processedName = processedName.slice(0, 64);
    // Avoid reserved keywords (case-insensitive)
    if (RESERVED_KEYWORDS.has(processedName.toUpperCase())) processedName = 'VAR_' + processedName;
    // Ensure uniqueness (case-insensitive)
    const existingNames = existingVariables.map(v => v.name.toLowerCase());
    if (existingNames.includes(processedName.toLowerCase())) {
        let counter = 1;
        const base = processedName.slice(0, 60);
        let uniqueName = processedName;
        while (existingNames.includes(uniqueName.toLowerCase())) {
            uniqueName = `${base}_${counter}`;
            counter++;
        }
        processedName = uniqueName;
    }
    return { isValid: true, processedName };
};

const createDefaultVariable = (index: number, existingVariables: Variable[] = []): Variable => {
    // Match existing default names case-insensitively
    const regex = /^var(\d+)$/i;
    let maxNum = 0;
    existingVariables.forEach(v => {
        const match = v.name.match(regex);
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
        }
    });
    // Use uppercase prefix for default variable names
    const baseName = `VAR${maxNum + 1}`;
    const nameResult = processVariableName(baseName, existingVariables);
    return {
        tempId: uuidv4(),
        columnIndex: index, name: nameResult.processedName || baseName, type: "NUMERIC", width: 8, decimals: 2,
        label: "", values: [], missing: null, columns: 64, align: "right", measure: "unknown", role: "input"
    };
};

// Helper function to validate a variable object
const isValidVariable = (variable: any): variable is Variable => {
    return variable &&
           typeof variable.columnIndex === 'number' &&
           typeof variable.name === 'string' &&
           variable.name !== "" &&
           typeof variable.type === 'string' &&
           variable.type !== "" &&
           typeof variable.width === 'number' &&
           typeof variable.decimals === 'number' &&
           Array.isArray(variable.values) &&
           (variable.missing === null || typeof variable.missing === 'object') &&
           typeof variable.columns === 'number' &&
           typeof variable.align === 'string' &&
           typeof variable.measure === 'string' &&
           typeof variable.role === 'string';
};

// Helper function to omit tempId
const omitTempId = <T extends { tempId?: string }>(obj: T): Omit<T, 'tempId'> => {
    const { tempId, ...rest } = obj;
    return rest;
};

// Helper function for finding variable index by identifier (number or string)
const findVariableIndexByIdentifier = (variables: Variable[], identifier: number | string): number => {
    if (typeof identifier === 'number') {
        return variables.findIndex(v => v.columnIndex === identifier);
    }
    const key = String(identifier).toLowerCase();
    return variables.findIndex(v => v.name.toLowerCase() === key);
};

// Helper function for updating state after successful operation
const updateStateAfterSuccess = (set: any, variables: Variable[]) => {
    set((draft: any) => {
        draft.variables = variables
            .filter(isValidVariable)
            .map(v => ({ ...v, tempId: v.tempId || uuidv4() }))
            .sort((a, b) => a.columnIndex - b.columnIndex);
        draft.lastUpdated = new Date();
        draft.error = null;
        draft.isLoading = false;
    });
};

// Unified error handler for store actions
const handleError = (set: any, source: string) => (error: any) => {
    console.error(`Error in ${source}:`, error);
    set((draft: any) => {
        draft.error = { message: error.message || `Error in ${source}`, source, originalError: error };
        draft.isLoading = false;
    });
};

interface VariableStoreState {
    // State
    variables: Variable[];
    isLoading: boolean;
    error: VariableStoreError | null;
    lastUpdated: Date | null;

    // Initialization & state management
    loadVariables: () => Promise<void>;
    resetVariables: () => Promise<void>;
    setVariables: (variables: Variable[]) => void;

    // Accessors
    getVariableByColumnIndex: (columnIndex: number) => Variable | undefined;
    // Table data for UI
    getTableData: () => (string | number)[][];
    // Unified insert/remove helpers
    insertVariableAt: (columnIndex: number) => Promise<void>;
    removeVariableAt: (columnIndex: number) => Promise<void>;

    // Single-item operations
    addVariable: (variableData?: Partial<Variable>) => Promise<void>;
    updateVariable: <K extends keyof Variable>(identifier: number | string, field: K, value: Variable[K]) => Promise<void>;
    updateMultipleFields: (identifier: number | string, changes: Partial<Variable>) => Promise<void>;
    deleteVariable: (columnIndex: number) => Promise<void>;

    // Batch operations
    addMultipleVariables: (variablesData: Partial<Variable>[]) => Promise<void>;
    updateMultipleVariables: (batch: { identifier: number | string; changes: Partial<Variable> }[]) => Promise<void>;
    overwriteVariables: (variables: Variable[]) => Promise<void>;
    ensureCompleteVariables: (targetMaxColumnIndex?: number) => Promise<void>;
    sortVariables: (direction: 'asc' | 'desc', columnIndex: number) => Promise<void>;
    saveVariables: () => Promise<void>;

    // Internal helper
    syncFull: (full: Variable[]) => Promise<void>;
}

// Helper to enforce measure constraint
const enforceMeasureConstraint = (changes: Partial<Variable>, existingVariable?: Variable | null): Partial<Variable> => {
    const finalChanges = { ...changes };
    const currentType = existingVariable?.type;
    const currentMeasure = existingVariable?.measure;

    const finalType = finalChanges.type ?? currentType;
    let finalMeasure = finalChanges.measure ?? currentMeasure;

    if (finalType === 'STRING' && finalMeasure === 'scale') {
        // If type is or becomes STRING, measure cannot be scale. Force to nominal.
        finalMeasure = 'nominal';
        finalChanges.measure = 'nominal'; // Ensure the change is reflected in the output object
        console.warn(`Constraint Applied: Variable type is STRING, measure cannot be 'scale'. Setting measure to 'nominal'.`);
    } else if (finalMeasure === 'scale' && finalType === 'STRING'){
         // This case is covered by the above, but added for clarity
         // If measure tries to become 'scale' while type is already STRING
         finalMeasure = 'nominal';
         finalChanges.measure = 'nominal';
         console.warn(`Constraint Applied: Variable type is STRING, measure cannot be set to 'scale'. Setting measure to 'nominal'.`);
    }

    // Return the potentially modified changes object
    return finalChanges;
};

// Static mapping for field names by column index
const FIELD_NAME_MAPPING = [
  "name", "type", "width", "decimals", "label", "values", "missing",
  "columns", "align", "measure", "role"
] as const;

export const useVariableStore = create<VariableStoreState>()(
    devtools(
        immer((set, get) => ({
            variables: [] as Variable[],
            isLoading: false,
            error: null,
            lastUpdated: null,

            setVariables: (variables) => {
                set((draft) => {
                    draft.variables = variables
                        .filter(isValidVariable)
                        .map(v => ({ ...v, tempId: v.tempId || uuidv4() }))
                        .sort((a, b) => a.columnIndex - b.columnIndex);
                    draft.lastUpdated = new Date();
                });
            },

            // helper: import & sync variables in batch (refresh IDs from DB)
            syncFull: async (full: Variable[]) => {
                set(draft => { draft.isLoading = true; draft.error = null; });
                await variableService.importVariables(full);
                // Reload with IDs and unique indexes
                const refreshed = await variableService.getAllVariables();
                updateStateAfterSuccess(set, refreshed);
            },

            ensureCompleteVariables: async (targetMaxColumnIndex?) => {
                try {
                    const existing = [...get().variables];
                    const maxIdx = existing.length > 0 ? Math.max(...existing.map(v => v.columnIndex)) : -1;
                    const limit = targetMaxColumnIndex !== undefined && targetMaxColumnIndex > maxIdx
                        ? targetMaxColumnIndex : maxIdx;
                    if (limit === -1) return;
                    const newVars: Variable[] = [];
                    const used = new Set(existing.map(v => v.columnIndex));
                    for (let i = 0; i <= limit; i++) {
                        if (!used.has(i)) newVars.push(createDefaultVariable(i, [...existing, ...newVars]));
                    }
                    if (newVars.length) {
                        await get().syncFull([...existing, ...newVars]);
                    }
                } catch (error: any) { handleError(set, 'ensureCompleteVariables')(error); }
            },

            updateVariable: async <K extends keyof Variable>(
                identifier: number | string,
                field: K,
                value: Variable[K]
            ) => {
                // Simply delegate to updateMultipleFields with a single field update
                return get().updateMultipleFields(identifier, { [field]: value } as Partial<Variable>);
            },

            updateMultipleFields: async (identifier, changes) => {
                set(draft => { draft.isLoading = true; draft.error = null; });
                let variableIndexInState: number = -1;
                let originalVariable: Variable | null = null;

                try {
                    // 1. Find variable in state
                    variableIndexInState = findVariableIndexByIdentifier(get().variables, identifier);
                    if (variableIndexInState === -1) throw new Error(`Variable "${identifier}" not found in state.`);
                    originalVariable = { ...get().variables[variableIndexInState] }; // Get a copy

                    // 2. Prepare changes (name validation, type inference)
                    let processedChanges = { ...changes };
                    let inferred: Partial<Variable> = {};
                    if ('name' in processedChanges && typeof processedChanges.name === 'string') {
                        const otherVariables = get().variables.filter((_, i) => i !== variableIndexInState);
                        const nameResult = processVariableName(processedChanges.name, otherVariables);
                        if (!nameResult.isValid) throw new Error(nameResult.message || "Invalid variable name");
                        processedChanges.name = nameResult.processedName;
                    }
                    if ('type' in processedChanges && processedChanges.type !== originalVariable.type) {
                        inferred = inferDefaultValues(processedChanges.type as Variable['type']);
                        for (const key in inferred) {
                            if (key in processedChanges) delete inferred[key as keyof Partial<Variable>];
                        }
                    }

                    // 3. Combine changes and enforce constraints
                    let changesToApply = { ...inferred, ...processedChanges };
                    changesToApply = enforceMeasureConstraint(changesToApply, originalVariable);

                    // Save changes via variableService
                    const updatedVariable = { ...originalVariable, ...changesToApply };
                    await variableService.saveVariable(updatedVariable);

                    // 5. Update State
                    set((draft) => {
                        if (variableIndexInState !== -1) {
                            Object.assign(draft.variables[variableIndexInState], changesToApply);
                        }
                        draft.lastUpdated = new Date();
                        draft.error = null;
                        draft.isLoading = false;
                    });
                } catch (error: any) { handleError(set, 'updateMultipleFields')(error); }
            },

            // Batch-update multiple variables atomically
            updateMultipleVariables: async (batch: { identifier: number | string; changes: Partial<Variable> }[]) => {
                set(draft => { draft.isLoading = true; draft.error = null; });
                try {
                    const current = [...get().variables];
                    const updated = current.map(v => {
                        const found = batch.find(item => typeof item.identifier === 'number'
                            ? v.columnIndex === item.identifier
                            : v.name.toLowerCase() === String(item.identifier).toLowerCase());
                        return found ? { ...v, ...found.changes } : v;
                    });
                    await get().syncFull(updated);
                } catch (error: any) { handleError(set, 'updateMultipleVariables')(error); }
            },

            addVariable: async (variableData?) => {
                try {
                    // SPSS contiguous: fill any gaps before new index
                    const initial = [...get().variables];
                    const maxInitial = initial.length > 0 ? Math.max(...initial.map(v => v.columnIndex)) : -1;
                    const idx = variableData?.columnIndex ?? (maxInitial + 1);
                    await get().ensureCompleteVariables(idx - 1);
                    const existing = [...get().variables];
                    const defaultVar = createDefaultVariable(idx, existing);
                    const inferred = variableData?.type ? inferDefaultValues(variableData.type) : {};
                    const baseVar: Variable = { ...defaultVar, ...inferred, ...variableData, columnIndex: idx, tempId: variableData?.tempId ?? defaultVar.tempId };
                    const nameRes = processVariableName(baseVar.name, existing);
                    const finalName = nameRes.processedName ?? baseVar.name;
                    const constraintChanges = enforceMeasureConstraint({ ...baseVar, name: finalName }, null as any);
                    const newVar: Variable = { ...baseVar, name: finalName, ...constraintChanges };
                    const shifted = existing.map(v => v.columnIndex >= idx ? { ...v, columnIndex: v.columnIndex + 1 } : v);
                    const full = [...shifted, newVar].sort((a, b) => a.columnIndex - b.columnIndex);
                    await get().syncFull(full);
                } catch (error: any) { handleError(set, 'addVariable')(error); }
            },

            addMultipleVariables: async (variablesData) => {
                try {
                    const existing = [...get().variables];
                    // Fill missing default variables before batch add
                    const maxIndexToAdd = variablesData.length > 0
                        ? Math.max(...variablesData.map(d => d.columnIndex ?? 0))
                        : -1;
                    if (maxIndexToAdd > 0) await get().ensureCompleteVariables(maxIndexToAdd - 1);
                    let counter = 1;
                    const toAdd: Variable[] = [];
                    for (const data of variablesData) {
                        const maxCur = [...existing, ...toAdd].reduce((m,v) => Math.max(m, v.columnIndex), -1);
                        const idx = data.columnIndex ?? (maxCur + counter++);
                        if ([...existing, ...toAdd].some(v => v.columnIndex === idx)) throw new Error(`Column index ${idx} collision`);
                        const def = createDefaultVariable(idx, [...existing, ...toAdd]);
                        const inferred = data.type ? inferDefaultValues(data.type) : {};
                        const base: Variable = { ...def, ...inferred, ...data, columnIndex: idx, tempId: data.tempId ?? def.tempId };
                        const nameResult = processVariableName(base.name, [...existing, ...toAdd]);
                        const processedName = nameResult.processedName ?? base.name;
                        const constraint = enforceMeasureConstraint({ ...base, name: processedName }, null as any);
                        const final: Variable = { ...base, name: processedName, ...constraint };
                        toAdd.push(final);
                    }
                    if (toAdd.length) {
                        await get().syncFull([...existing, ...toAdd]);
                    }
                } catch (error: any) { handleError(set, 'addMultipleVariables')(error); }
            },

            loadVariables: async () => {
                set((draft) => { draft.isLoading = true; draft.error = null; });
                try {
                    const variablesFromService = await variableService.getAllVariables();
                    updateStateAfterSuccess(set, variablesFromService);
                } catch (error: any) { handleError(set, 'loadVariables')(error); }
            },

            resetVariables: async () => {
                try {
                    await variableService.clearAllVariables();
                    updateStateAfterSuccess(set, []);
                } catch (error: any) { handleError(set, 'resetVariables')(error); }
            },

            deleteVariable: async (columnIndex: number) => {
                set(draft => { draft.isLoading = true; draft.error = null; });
                try {
                    const toDel = get().variables.find(v => v.columnIndex === columnIndex);
                    if (!toDel?.id) {
                        console.warn(`No variable at index ${columnIndex}`);
                        // Reset loading state when no ID to delete
                        set(draft => { draft.isLoading = false; });
                        return;
                    }
                    await variableService.deleteVariable(toDel.id);
                    const rem = get().variables.filter(v => v.columnIndex !== columnIndex)
                        .sort((a,b) => a.columnIndex - b.columnIndex)
                        .map((v,i) => ({ ...v, columnIndex: i }));
                    if (rem.length) {
                        await get().syncFull(rem);
                    } else {
                        updateStateAfterSuccess(set, []);
                    }
                } catch (error: any) { handleError(set, 'deleteVariable')(error); }
            },

            overwriteVariables: async (newVariables) => {
                set(draft => { draft.isLoading = true; draft.error = null; });
                try {
                    const valid = newVariables.filter(isValidVariable).map(omitTempId);
                    await get().syncFull(valid);
                } catch (error: any) { handleError(set, 'overwriteVariables')(error); }
            },

            sortVariables: async (direction, columnIndex) => {
                set(draft => { draft.isLoading = true; draft.error = null; });
                try {
                    // Get field to sort by based on columnIndex
                    const field = FIELD_NAME_MAPPING[columnIndex] ?? null;
                    if (!field) {
                        console.warn(`Invalid column index ${columnIndex} for sorting.`);
                        return;
                    }
                    
                    // Sort variables
                    const variablesToSort = [...get().variables];
                    variablesToSort.sort((a, b) => {
                        const aValue = a[field as keyof Variable]; 
                        const bValue = b[field as keyof Variable];
                        
                        if (aValue == null && bValue == null) return 0;
                        if (aValue == null) return direction === 'asc' ? -1 : 1;
                        if (bValue == null) return direction === 'asc' ? 1 : -1;
                        
                        if (typeof aValue === 'number' && typeof bValue === 'number') {
                            return direction === 'asc' ? aValue - bValue : bValue - aValue;
                        }
                        
                        if (typeof aValue === 'string' && typeof bValue === 'string') {
                            return direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                        }
                        
                        const aStr = String(aValue).toLowerCase();
                        const bStr = String(bValue).toLowerCase();
                        return direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
                    });
                    
                    // Reindex variables
                    const updatedVariables = variablesToSort.map((variable, index) => ({
                        ...variable,
                        columnIndex: index
                    }));
                    
                    // Use variableService to update all variables
                    await get().syncFull(updatedVariables);
                } catch (error: any) { handleError(set, 'sortVariables')(error); }
            },

            saveVariables: async () => {
                const full = get().variables;
                await get().syncFull(full);
            },

            getVariableByColumnIndex: (columnIndex: number) => {
                return get().variables.find(v => v.columnIndex === columnIndex);
            },
            getTableData: () => transformVariablesToTableData(get().variables),

            // Unified insert/remove helpers
            insertVariableAt: async (columnIndex: number) => {
                set(draft => { draft.isLoading = true; draft.error = null; });
                try {
                    await get().ensureCompleteVariables(columnIndex - 1);
                    await get().addVariable({ columnIndex });
                    await useDataStore.getState().addColumns([columnIndex]);
                } catch (error: any) { handleError(set, 'insertVariableAt')(error); }
            },
            removeVariableAt: async (columnIndex: number) => {
                set(draft => { draft.isLoading = true; draft.error = null; });
                try {
                    await get().deleteVariable(columnIndex);
                    await useDataStore.getState().deleteColumn(columnIndex);
                } catch (error: any) { handleError(set, 'removeVariableAt')(error); }
            },
        }))
    )
);

function getFieldNameByColumnIndex(columnIndex: number): string | null {
    return FIELD_NAME_MAPPING[columnIndex] ?? null;
}