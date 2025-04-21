import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import db from "@/lib/db";
import { Variable, ValueLabel } from "@/types/Variable";

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

const processVariableName = (name: string, existingVariables: Variable[]): {
    isValid: boolean;
    message?: string;
    processedName?: string;
} => {
    if (!name) return { isValid: false, message: "Variable name cannot be empty" };
    let processedName = name;
    if (!/^[a-zA-Z@#$]/.test(processedName)) processedName = 'var_' + processedName;
    processedName = processedName.replace(/[^a-zA-Z0-9@#$_.]/g, '_').replace(/\s+/g, '_').replace(/\.$/, '_');
    if (processedName.length > 64) processedName = processedName.substring(0, 64);
    const existingNames = existingVariables.map(v => v.name.toLowerCase());
    if (existingNames.includes(processedName.toLowerCase())) {
        let counter = 1;
        let uniqueName = processedName;
        while (existingNames.includes(uniqueName.toLowerCase())) {
            uniqueName = `${processedName.substring(0, 60)}_${counter}`;
            counter++;
        }
        processedName = uniqueName;
    }
    return { isValid: true, processedName };
};

const createDefaultVariable = (index: number, existingVariables: Variable[] = []): Variable => {
    const regex = /^var(\d+)$/;
    let maxNum = 0;
    existingVariables.forEach(v => {
        const match = v.name.match(regex);
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
        }
    });
    const baseName = `var${maxNum + 1}`;
    const nameResult = processVariableName(baseName, existingVariables);
    return {
        columnIndex: index, name: nameResult.processedName || baseName, type: "NUMERIC", width: 8, decimals: 2,
        label: "", values: [], missing: null, columns: 64, align: "right", measure: "unknown", role: "input"
    };
};

interface VariableStoreState {
    variables: Variable[];
    isLoading: boolean;
    error: VariableStoreError | null;
    lastUpdated: Date | null;

    setVariables: (variables: Variable[]) => void;
    updateVariable: <K extends keyof Variable>(identifier: number | string, field: K, value: Variable[K]) => Promise<void>;
    updateMultipleFields: (identifier: number | string, changes: Partial<Variable>) => Promise<void>;
    addVariable: (variableData?: Partial<Variable>) => Promise<void>;
    getVariableByColumnIndex: (columnIndex: number) => Variable | undefined;
    getVariableByName: (name: string) => Variable | undefined;
    loadVariables: () => Promise<void>;
    resetVariables: () => Promise<void>;
    deleteVariable: (columnIndex: number) => Promise<void>;
    overwriteVariables: (variables: Variable[]) => Promise<void>;
    addMultipleVariables: (variablesData: Partial<Variable>[]) => Promise<void>;
    sortVariables: (direction: 'asc' | 'desc', columnIndex: number) => Promise<void>;
    ensureCompleteVariables: () => Promise<void>;
    saveVariables: () => Promise<void>;
}

export const useVariableStore = create<VariableStoreState>()(
    devtools(
        immer((set, get) => ({
            variables: [],
            isLoading: false,
            error: null,
            lastUpdated: null,

            setVariables: (variables) => {
                set((draft) => {
                    draft.variables = variables;
                    draft.lastUpdated = new Date();
                });
            },

            ensureCompleteVariables: async () => {
                try {
                    await db.transaction('rw', db.variables, async () => {
                        const existingVariables = [...get().variables];
                        const maxIndex = existingVariables.length > 0 ? Math.max(...existingVariables.map(v => v.columnIndex)) : -1;
                        if (maxIndex === -1) return;
                        const targetLength = maxIndex + 1;

                        const newVariables: Variable[] = [];
                        const existingIndices = new Set(existingVariables.map(v => v.columnIndex));

                        for (let i = 0; i <= maxIndex; i++) {
                            if (!existingIndices.has(i)) {
                                const defaultVar = createDefaultVariable(i, [...existingVariables, ...newVariables]);
                                newVariables.push(defaultVar);
                            }
                        }

                        if (newVariables.length > 0) {
                            const ids = await db.variables.bulkAdd(newVariables, { allKeys: true });
                            set((draft) => {
                                const variablesWithIds = newVariables.map((v, idx) => ({ ...v, id: ids[idx] }));
                                draft.variables.push(...variablesWithIds);
                                draft.variables.sort((a, b) => a.columnIndex - b.columnIndex);
                                draft.lastUpdated = new Date();
                            });
                        }
                    });
                } catch (error: any) {
                    console.error("Error in ensureCompleteVariables:", error);
                    set((draft) => { draft.error = { message: error.message || "Error ensuring complete variables", source: "ensureCompleteVariables", originalError: error }; });
                    await get().loadVariables();
                }
            },

            updateVariable: async <K extends keyof Variable>(identifier: number | string, field: K, value: Variable[K]) => {
                let variableToUpdate: Variable | undefined;
                let variableIndex: number = -1;
                try {
                    await db.transaction('rw', db.variables, async () => {
                        if (typeof identifier === 'number') {
                            variableToUpdate = await db.variables.where('columnIndex').equals(identifier).first();
                            variableIndex = get().variables.findIndex(v => v.columnIndex === identifier);
                        } else {
                            variableToUpdate = await db.variables.where('name').equals(identifier).first();
                            variableIndex = get().variables.findIndex(v => v.name.toLowerCase() === identifier.toLowerCase());
                        }
                        if (!variableToUpdate) throw new Error(`Variable with identifier "${identifier}" not found for update`);

                        if (field === 'name' && typeof value === 'string') {
                            const otherVariables = get().variables.filter((_, i) => i !== variableIndex);
                            const nameResult = processVariableName(value as string, otherVariables);
                            if (!nameResult.isValid) throw new Error(nameResult.message || "Invalid variable name");
                            variableToUpdate[field] = nameResult.processedName as Variable[K];
                        } else {
                            let inferred: Partial<Variable> = {};
                            if (field === 'type' && value !== variableToUpdate.type) {
                                inferred = inferDefaultValues(value as Variable['type']);
                                Object.assign(variableToUpdate, inferred);
                            }
                            variableToUpdate[field] = value;
                        }

                        await db.variables.put(variableToUpdate);
                        set((draft) => {
                            if (variableIndex !== -1) {
                                draft.variables[variableIndex] = { ...variableToUpdate! };
                            }
                            draft.lastUpdated = new Date();
                        });
                    });
                    await get().ensureCompleteVariables();
                } catch (error: any) {
                    console.error("Error in updateVariable:", error);
                    set((draft) => { draft.error = { message: error.message || "Error updating variable", source: "updateVariable", originalError: error }; });
                    await get().loadVariables();
                }
            },

            updateMultipleFields: async (identifier, changes) => {
                let variableToUpdate: Variable | undefined;
                let variableIndex: number = -1;
                try {
                    await db.transaction('rw', db.variables, async () => {
                        if (typeof identifier === 'number') {
                            variableToUpdate = await db.variables.where('columnIndex').equals(identifier).first();
                            variableIndex = get().variables.findIndex(v => v.columnIndex === identifier);
                        } else {
                            variableToUpdate = await db.variables.where('name').equals(identifier).first();
                            variableIndex = get().variables.findIndex(v => v.name.toLowerCase() === identifier.toLowerCase());
                        }
                        if (!variableToUpdate) throw new Error(`Variable with identifier "${identifier}" not found for multi-update`);

                        let processedChanges = { ...changes };

                        if ('name' in processedChanges && typeof processedChanges.name === 'string') {
                            const otherVariables = get().variables.filter((_, i) => i !== variableIndex);
                            const nameResult = processVariableName(processedChanges.name, otherVariables);
                            if (!nameResult.isValid) throw new Error(nameResult.message || "Invalid variable name");
                            processedChanges.name = nameResult.processedName;
                        }

                        let inferred: Partial<Variable> = {};
                        if ('type' in processedChanges && processedChanges.type !== variableToUpdate.type) {
                            inferred = inferDefaultValues(processedChanges.type as Variable['type']);
                            for (const key in inferred) {
                                if (key in processedChanges) {
                                    delete inferred[key as keyof Partial<Variable>];
                                }
                            }
                        }

                        const updatedVariable = { ...variableToUpdate, ...inferred, ...processedChanges };

                        await db.variables.put(updatedVariable);

                        set((draft) => {
                            if (variableIndex !== -1) {
                                draft.variables[variableIndex] = { ...updatedVariable };
                            }
                            draft.lastUpdated = new Date();
                        });
                    });
                    await get().ensureCompleteVariables();
                } catch (error: any) {
                    console.error("Error in updateMultipleFields:", error);
                    set((draft) => { draft.error = { message: error.message || "Error updating multiple fields", source: "updateMultipleFields", originalError: error }; });
                    await get().loadVariables();
                }
            },

            addVariable: async (variableData?: Partial<Variable>) => {
                try {
                    await db.transaction('rw', db.variables, async () => {
                        // 1. Read ALL current variables within the transaction
                        const allCurrentVariables = await db.variables.orderBy('columnIndex').toArray();
                        let maxCurrentIndex = allCurrentVariables.length > 0 ? allCurrentVariables[allCurrentVariables.length - 1].columnIndex : -1;
            
                        // 2. Determine target index for the new variable
                        // If columnIndex is provided, use it for initial sorting placement,
                        // otherwise, place it at the end for sorting.
                        const intendedSortIndex = variableData?.columnIndex ?? (maxCurrentIndex + 1);
            
                        // 3. Prepare the new variable
                        const defaultVar = createDefaultVariable(intendedSortIndex, allCurrentVariables);
                        const inferredValues = variableData?.type ? inferDefaultValues(variableData.type) : {};
                        const newVariableBase: Variable = { ...defaultVar, ...inferredValues, ...variableData };
                        
                        // Ensure name is unique relative to existing vars
                        const nameResult = processVariableName(newVariableBase.name, allCurrentVariables);
                        const finalName = (nameResult.isValid && nameResult.processedName) ? nameResult.processedName : newVariableBase.name; // Fallback to original default if needed
            
                        const newVariable: Variable = { ...newVariableBase, name: finalName, columnIndex: intendedSortIndex };
            
                        // 4. Combine, sort by intended index, re-index sequentially
                        const combined = [...allCurrentVariables, newVariable];
                        // Sort primarily by intended columnIndex, secondarily maybe by ID or original position if needed?
                        // For now, simple columnIndex sort is enough as we re-index.
                        combined.sort((a, b) => a.columnIndex - b.columnIndex);
            
                        const finalVariables = combined.map((variable, index) => ({
                            ...variable,
                            columnIndex: index // Assign final sequential index
                        }));
            
                        // 5. Clear table and bulkPut final list
                        await db.variables.clear();
                        await db.variables.bulkPut(finalVariables);
            
                        // 6. Update Zustand state
                        set((draft) => {
                            draft.variables = finalVariables;
                            draft.lastUpdated = new Date();
                            draft.error = null;
                        });
                    });
                    // No need for ensureCompleteVariables as we rebuild the index
                } catch (error: any) {
                    console.error("Error in addVariable:", error);
                    set((draft) => { draft.error = { message: error.message || "Error adding variable", source: "addVariable", originalError: error }; });
                    await get().loadVariables(); // Reload on error
                }
            },

            addMultipleVariables: async (variablesData) => {
                try {
                    await db.transaction('rw', db.variables, async () => {
                        // 1. Read ALL current variables within the transaction
                        const allCurrentVariables = await db.variables.orderBy('columnIndex').toArray();
                        let maxCurrentIndex = allCurrentVariables.length > 0 ? allCurrentVariables[allCurrentVariables.length - 1].columnIndex : -1;
            
                        // 2. Prepare new variables
                        const newVariablesInput = [...variablesData];
                        const preparedNewVariables: Variable[] = [];
                        let tempIndexCounter = 1; // For assigning temporary sort indices if needed
            
                        for (const data of newVariablesInput) {
                            const intendedSortIndex = data.columnIndex ?? (maxCurrentIndex + tempIndexCounter++); // Place at end if no index
                            const currentAndPrepared = [...allCurrentVariables, ...preparedNewVariables]; // Check against existing + already prepared new ones
                            
                            const defaultVar = createDefaultVariable(intendedSortIndex, currentAndPrepared);
                            const inferredValues = data.type ? inferDefaultValues(data.type) : {};
                            const newVariableBase: Variable = { ...defaultVar, ...inferredValues, ...data };

                            // Ensure name is unique
                            const nameResult = processVariableName(newVariableBase.name, currentAndPrepared);
                            const finalName = (nameResult.isValid && nameResult.processedName) ? nameResult.processedName : newVariableBase.name;
                            
                            preparedNewVariables.push({ ...newVariableBase, name: finalName, columnIndex: intendedSortIndex });
                        }
            
                        // 3. Combine current and new, sort by intended final columnIndex
                        const combined = [...allCurrentVariables, ...preparedNewVariables];
                        combined.sort((a, b) => a.columnIndex - b.columnIndex);
            
                        // 4. Re-index the combined list sequentially from 0
                        const finalVariables = combined.map((variable, index) => ({
                             ...variable,
                             columnIndex: index // Assign final sequential index
                        }));
            
                        // 5. Clear the table and bulkPut the final, correctly indexed list
                        await db.variables.clear();
                        await db.variables.bulkPut(finalVariables);
            
                        // 6. Update Zustand state
                        set(draft => {
                            draft.variables = finalVariables;
                            draft.lastUpdated = new Date();
                            draft.error = null; // Clear previous errors on success
                        });
                    });
                    // No need for ensureCompleteVariables
                } catch (error: any) {
                    console.error("Error adding multiple variables:", error);
                    set((draft) => { draft.error = { message: error.message || "Error adding multiple variables", source: "addMultipleVariables", originalError: error }; });
                    await get().loadVariables(); // Reload on error
                }
            },

            getVariableByColumnIndex: (columnIndex) => {
                return get().variables.find((v) => v.columnIndex === columnIndex);
            },

            getVariableByName: (name) => {
                return get().variables.find(v => v.name.toLowerCase() === name.toLowerCase());
            },

            loadVariables: async () => {
                set((draft) => { draft.isLoading = true; draft.error = null; });
                try {
                    await db.transaction('r', db.variables, async () => {
                        const variablesFromDb = await db.variables.toArray();
                        const sortedVariables = variablesFromDb.sort((a, b) => a.columnIndex - b.columnIndex);
                        set((draft) => {
                            draft.variables = sortedVariables;
                            draft.lastUpdated = new Date();
                            draft.isLoading = false;
                        });
                    });
                    await get().ensureCompleteVariables();
                } catch (error: any) {
                    console.error("Error loading variables:", error);
                    set((draft) => {
                        draft.error = { message: error.message || "Error loading variables", source: "loadVariables", originalError: error };
                        draft.isLoading = false;
                    });
                }
            },

            resetVariables: async () => {
                try {
                    await db.transaction('rw', db.variables, async () => {
                        await db.variables.clear();
                        set((draft) => {
                            draft.variables = [];
                            draft.lastUpdated = new Date();
                            draft.error = null;
                            draft.isLoading = false;
                        });
                    });
                } catch (error: any) {
                    console.error("Error resetting variables:", error);
                    set((draft) => { draft.error = { message: error.message || "Error resetting variables", source: "resetVariables", originalError: error }; });
                    await get().loadVariables();
                }
            },

            deleteVariable: async (columnIndex: number) => {
                try {
                    await db.transaction('rw', db.variables, async () => {
                        // 1. Read all variables
                        const allCurrentVariables = await db.variables.orderBy('columnIndex').toArray();

                        // 2. Filter out the variable to delete
                        const variablesAfterDelete = allCurrentVariables.filter(v => v.columnIndex !== columnIndex);

                        // 3. Check if anything was actually deleted (important to avoid unnecessary writes)
                        if (variablesAfterDelete.length === allCurrentVariables.length) {
                            console.warn(`Variable with column index ${columnIndex} not found for deletion.`);
                            // Optionally set an error or just return if the variable didn't exist
                            // set((draft) => { draft.error = { message: `Variable index ${columnIndex} not found`, source: "deleteVariable" }; });
                            return; 
                        }

                        // 4. Re-index the remaining variables sequentially
                        const finalVariables = variablesAfterDelete.map((variable, index) => ({
                            ...variable,
                            columnIndex: index // Assign final sequential index
                        }));

                        // 5. Clear table and bulkPut the re-indexed list
                        await db.variables.clear();
                        if (finalVariables.length > 0) { // Only bulkPut if there are remaining variables
                            await db.variables.bulkPut(finalVariables);
                        }

                        // 6. Update Zustand state
                        set((draft) => {
                            draft.variables = finalVariables;
                            draft.lastUpdated = new Date();
                            draft.error = null; // Clear error on success
                        });
                    });
                    // No need for ensureCompleteVariables
                } catch (error: any) {
                    console.error("Error deleting variable:", error);
                    set((draft) => { draft.error = { message: error.message || "Error deleting variable", source: "deleteVariable", originalError: error }; });
                    await get().loadVariables(); // Reload on error
                }
            },

            overwriteVariables: async (variables) => {
                try {
                    await db.transaction('rw', db.variables, async () => {
                        const normalizedVariables = [...variables]
                            .sort((a, b) => (a.columnIndex ?? Infinity) - (b.columnIndex ?? Infinity))
                            .map((variable, index) => ({ ...variable, columnIndex: index }));

                        await db.variables.clear();
                        await db.variables.bulkPut(normalizedVariables);

                        set((draft) => {
                            draft.variables = normalizedVariables;
                            draft.lastUpdated = new Date();
                            draft.error = null;
                        });
                    });
                    await get().ensureCompleteVariables();
                } catch (error: any) {
                    console.error("Error overwriting variables:", error);
                    set((draft) => { draft.error = { message: error.message || "Error overwriting variables", source: "overwriteVariables", originalError: error }; });
                    await get().loadVariables();
                }
            },

            sortVariables: async (direction, columnIndex) => {
                try {
                    await db.transaction('rw', db.variables, async () => {
                        const variables = [...get().variables];
                        const field = getFieldNameByColumnIndex(columnIndex);
                        if (!field) {
                            console.warn(`Invalid column index ${columnIndex} for sorting.`);
                            return;
                        }

                        variables.sort((a, b) => {
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

                        const updatedVariables = variables.map((variable, index) => ({ ...variable, columnIndex: index }));

                        await db.variables.clear();
                        await db.variables.bulkPut(updatedVariables);

                        set((draft) => {
                            draft.variables = updatedVariables;
                            draft.lastUpdated = new Date();
                        });
                    });
                    await get().ensureCompleteVariables();
                } catch (error: any) {
                    console.error("Error sorting variables:", error);
                    set((draft) => { draft.error = { message: error.message || "Error sorting variables", source: "sortVariables", originalError: error }; });
                    await get().loadVariables();
                }
            },

            saveVariables: async () => {
                const currentVariables = get().variables;
                try {
                    await db.transaction('rw', db.variables, async () => {
                        await db.variables.clear();
                        if (currentVariables.length > 0) {
                            await db.variables.bulkPut(currentVariables);
                        }
                    });
                    set((draft) => { draft.error = null; draft.lastUpdated = new Date(); });
                } catch (error: any) {
                    console.error("Failed to explicitly save variables:", error);
                    set((draft) => {
                        draft.error = {
                            message: error.message || "Failed to save variables during explicit save",
                            source: "saveVariables",
                            originalError: error
                        };
                    });
                    throw error;
                }
            }
        }))
    )
);

function getFieldNameByColumnIndex(columnIndex: number): string | null {
    const fieldMapping = [
        "name", "type", "width", "decimals", "label", "values", "missing",
        "columns", "align", "measure", "role"
    ];
    return columnIndex >= 0 && columnIndex < fieldMapping.length ? fieldMapping[columnIndex] : null;
}