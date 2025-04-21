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
                        const existingVariables = [...get().variables];
                        const targetIndex = variableData?.columnIndex !== undefined
                            ? variableData.columnIndex
                            : existingVariables.reduce((max, v) => Math.max(max, v.columnIndex), -1) + 1;

                        const variablesToShift = existingVariables
                            .filter(variable => variable.columnIndex >= targetIndex)
                            .map(variable => ({ ...variable, columnIndex: variable.columnIndex + 1 }));

                        if (variablesToShift.length > 0) {
                            await db.variables.bulkPut(variablesToShift);
                        }

                        const defaultVar = createDefaultVariable(targetIndex, existingVariables);
                        const inferredValues = variableData?.type ? inferDefaultValues(variableData.type) : {};

                        const newVariable: Variable = {
                            ...defaultVar,
                            ...inferredValues,
                            ...variableData,
                            columnIndex: targetIndex
                        };

                        if (variableData?.name) {
                            const currentVariableNames = get().variables.map(v => v.name);
                            const nameResult = processVariableName(variableData.name, get().variables);
                            if (nameResult.isValid && nameResult.processedName) {
                                newVariable.name = nameResult.processedName;
                            }
                        }

                        const id = await db.variables.add(newVariable);

                        set((draft) => {
                            const shiftedIndices = new Set(variablesToShift.map(v => v.id));
                            draft.variables = draft.variables.filter(v => !shiftedIndices.has(v.id) || v.columnIndex < targetIndex);
                            draft.variables.push(...variablesToShift);
                            draft.variables.push({ ...newVariable, id });
                            draft.variables.sort((a, b) => a.columnIndex - b.columnIndex);
                            draft.lastUpdated = new Date();
                        });
                    });
                    await get().ensureCompleteVariables();
                } catch (error: any) {
                    console.error("Error in addVariable:", error);
                    set((draft) => { draft.error = { message: error.message || "Error adding variable", source: "addVariable", originalError: error }; });
                    await get().loadVariables();
                }
            },

            addMultipleVariables: async (variablesData) => {
                try {
                    await db.transaction('rw', db.variables, async () => {
                        const existingVariables = [...get().variables];
                        const newVariablesInput = [...variablesData];
                        const addedVariables: Variable[] = [];

                        newVariablesInput.sort((a, b) => (a.columnIndex ?? Infinity) - (b.columnIndex ?? Infinity));

                        let currentIndex = existingVariables.reduce((max, v) => Math.max(max, v.columnIndex), -1) + 1;
                        const variablesToShift: Variable[] = [];
                        const variablesToAdd: Variable[] = [];

                        for (const variableData of newVariablesInput) {
                            const targetIndex = variableData.columnIndex ?? currentIndex;

                            existingVariables.forEach(existingVar => {
                                if (existingVar.columnIndex >= targetIndex && !variablesToShift.find(v => v.id === existingVar.id)) {
                                    variablesToShift.push({ ...existingVar });
                                }
                            });

                            const allKnownVars = [...existingVariables, ...addedVariables];
                            const defaultVar = createDefaultVariable(targetIndex, allKnownVars);
                            const inferredValues = variableData.type ? inferDefaultValues(variableData.type) : {};
                            const newVariable: Variable = { ...defaultVar, ...inferredValues, ...variableData, columnIndex: targetIndex };

                            if (variableData.name) {
                                const nameResult = processVariableName(variableData.name, allKnownVars);
                                if (nameResult.isValid && nameResult.processedName) newVariable.name = nameResult.processedName;
                            }
                            variablesToAdd.push(newVariable);
                            addedVariables.push(newVariable);

                            if (variableData.columnIndex === undefined) {
                                currentIndex++;
                            }
                        }

                        const finalShiftedVariables = variablesToShift.map(v => ({ ...v, columnIndex: v.columnIndex + variablesToAdd.length }));

                        if (finalShiftedVariables.length > 0) {
                            await db.variables.bulkPut(finalShiftedVariables);
                        }
                        const ids = await db.variables.bulkAdd(variablesToAdd, { allKeys: true });

                        set(draft => {
                            const shiftedIds = new Set(finalShiftedVariables.map(v => v.id));
                            draft.variables = draft.variables.filter(v => !shiftedIds.has(v.id));
                            draft.variables.push(...finalShiftedVariables);
                            draft.variables.push(...variablesToAdd.map((v, i) => ({ ...v, id: ids[i] })));
                            draft.variables.sort((a, b) => a.columnIndex - b.columnIndex);
                            draft.lastUpdated = new Date();
                        });
                    });
                    await get().ensureCompleteVariables();
                } catch (error: any) {
                    console.error("Error adding multiple variables:", error);
                    set((draft) => { draft.error = { message: error.message || "Error adding multiple variables", source: "addMultipleVariables", originalError: error }; });
                    await get().loadVariables();
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
                        const variableToDelete = await db.variables.where('columnIndex').equals(columnIndex).first();
                        if (!variableToDelete || variableToDelete.id === undefined) {
                            const stateIndex = get().variables.findIndex(v => v.columnIndex === columnIndex);
                            if (stateIndex === -1) {
                                console.warn(`Variable with column index ${columnIndex} not found in DB or state.`);
                                return;
                            }
                        } else {
                            await db.variables.delete(variableToDelete.id);
                        }

                        const variablesToShift = await db.variables.where('columnIndex').above(columnIndex).toArray();
                        const shiftedVariables = variablesToShift.map(variable => ({ ...variable, columnIndex: variable.columnIndex - 1 }));

                        if (shiftedVariables.length > 0) {
                            await db.variables.bulkPut(shiftedVariables);
                        }

                        set((draft) => {
                            const variableIndex = draft.variables.findIndex(v => v.columnIndex === columnIndex);
                            if (variableIndex !== -1) {
                                draft.variables.splice(variableIndex, 1);
                                draft.variables.forEach(v => {
                                    if(v.columnIndex > columnIndex) {
                                        v.columnIndex -= 1;
                                    }
                                });
                                draft.variables.sort((a, b) => a.columnIndex - b.columnIndex);
                                draft.lastUpdated = new Date();
                            }
                        });
                    });
                    await get().ensureCompleteVariables();
                } catch (error: any) {
                    console.error("Error deleting variable:", error);
                    set((draft) => { draft.error = { message: error.message || "Error deleting variable", source: "deleteVariable", originalError: error }; });
                    await get().loadVariables();
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