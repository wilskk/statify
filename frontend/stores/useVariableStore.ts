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
    updateVariable: <K extends keyof Variable>(
        identifier: number | string, // columnIndex or name
        field: K,
        value: Variable[K]
    ) => Promise<void>;
    updateMultipleFields: (
        identifier: number | string, // columnIndex or name
        changes: Partial<Variable>
    ) => Promise<void>;
    addVariable: (variableData?: Partial<Variable>) => Promise<void>;
    getVariableByColumnIndex: (columnIndex: number) => Variable | undefined;
    getVariableByName: (name: string) => Variable | undefined;
    loadVariables: () => Promise<void>;
    resetVariables: () => Promise<void>;
    deleteVariable: (columnIndex: number) => Promise<void>;
    overwriteVariables: (variables: Variable[]) => Promise<void>;
    addMultipleVariables: (variablesData: Partial<Variable>[]) => Promise<void>;
    sortVariables: (direction: 'asc' | 'desc', columnIndex: number) => Promise<void>;
    ensureCompleteVariables: (targetMaxColumnIndex?: number) => Promise<void>;
    saveVariables: () => Promise<void>;
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

            ensureCompleteVariables: async (targetMaxColumnIndex?: number) => {
                try {
                    await db.transaction('rw', db.variables, async () => {
                        const existingVariables = [...get().variables];
                        
                        // Determine the maximum index to check against
                        const maxExistingIndex = existingVariables.length > 0
                            ? Math.max(...existingVariables.map(v => v.columnIndex))
                            : -1;
                        
                        // Use targetMaxColumnIndex if provided and it's greater than maxExistingIndex
                        const maxIndexToCheck = targetMaxColumnIndex !== undefined && targetMaxColumnIndex > maxExistingIndex
                            ? targetMaxColumnIndex
                            : maxExistingIndex;

                        // If no variables exist and no target is provided, nothing to do
                        if (maxIndexToCheck === -1) return;

                        const targetLength = maxIndexToCheck + 1; // We need indices from 0 to maxIndexToCheck
                        const newVariablesToCreate: Variable[] = [];
                        const existingIndices = new Set(existingVariables.map(v => v.columnIndex));

                        // Check indices from 0 up to the determined maximum
                        for (let i = 0; i < targetLength; i++) {
                            if (!existingIndices.has(i)) {
                                const defaultVar = createDefaultVariable(i, [...existingVariables, ...newVariablesToCreate]);
                                newVariablesToCreate.push(defaultVar);
                            }
                        }

                        if (newVariablesToCreate.length > 0) {
                            console.log(`[ensureCompleteVariables] Adding ${newVariablesToCreate.length} default variables up to index ${maxIndexToCheck}.`);
                            await db.variables.bulkAdd(newVariablesToCreate);
                            set((draft) => {
                                draft.variables = [...draft.variables, ...newVariablesToCreate]
                                    .sort((a, b) => a.columnIndex - b.columnIndex);
                                draft.lastUpdated = new Date();
                            });
                        }
                    });
                } catch (error: any) {
                    console.error("Error in ensureCompleteVariables:", error);
                    set((draft) => { draft.error = { message: error.message || "Error ensuring complete variables", source: "ensureCompleteVariables", originalError: error }; });
                }
            },

            updateVariable: async <K extends keyof Variable>(
                identifier: number | string,
                field: K,
                value: Variable[K]
            ) => {
                let variableIndexInState: number = -1;
                let originalVariable: Variable | null = null;

                try {
                    // 1. Find variable in state
                    if (typeof identifier === 'number') {
                        variableIndexInState = get().variables.findIndex(v => v.columnIndex === identifier);
                    } else {
                        variableIndexInState = get().variables.findIndex(v => v.name.toLowerCase() === identifier.toLowerCase());
                    }
                    if (variableIndexInState === -1) throw new Error(`Variable "${identifier}" not found in state.`);
                    originalVariable = { ...get().variables[variableIndexInState] }; // Get a copy

                    // 2. Prepare initial changes & inferred values
                    let updatedFields: Partial<Variable> = { [field]: value };
                    let inferred: Partial<Variable> = {};
                    if (field === 'name' && typeof value === 'string') {
                        const otherVariables = get().variables.filter((_, i) => i !== variableIndexInState);
                        const nameResult = processVariableName(value, otherVariables);
                        if (!nameResult.isValid) throw new Error(nameResult.message || "Invalid variable name");
                        updatedFields.name = nameResult.processedName;
                    } else if (field === 'type' && value !== originalVariable.type) {
                        inferred = inferDefaultValues(value as Variable['type']);
                    }

                    // 3. Combine changes and enforce constraints
                    let changesToApply = { ...inferred, ...updatedFields };
                    changesToApply = enforceMeasureConstraint(changesToApply, originalVariable);

                    // 4. Update Database
                    await db.transaction('rw', db.variables, async () => {
                        let updateCount = 0;
                        const whereClause = typeof identifier === 'number'
                            ? db.variables.where('columnIndex').equals(identifier)
                            : db.variables.where('name').equalsIgnoreCase(identifier);
                        updateCount = await whereClause.modify(changesToApply);
                        if (updateCount === 0) throw new Error(`Variable "${identifier}" not found in DB for update.`);
                    });

                    // 5. Update State
                    set((draft) => {
                        if (variableIndexInState !== -1) {
                            Object.assign(draft.variables[variableIndexInState], changesToApply);
                        }
                        draft.lastUpdated = new Date();
                        draft.error = null;
                    });
                } catch (error: any) {
                    console.error("Error in updateVariable:", error);
                    set((draft) => { draft.error = { message: error.message || "Error updating variable", source: "updateVariable", originalError: error }; });
                }
            },

            updateMultipleFields: async (identifier, changes) => {
                let variableIndexInState: number = -1;
                let originalVariable: Variable | null = null;

                try {
                    // 1. Find variable in state
                    if (typeof identifier === 'number') {
                        variableIndexInState = get().variables.findIndex(v => v.columnIndex === identifier);
                    } else {
                        variableIndexInState = get().variables.findIndex(v => v.name.toLowerCase() === identifier.toLowerCase());
                    }
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

                    // 4. Update Database
                    await db.transaction('rw', db.variables, async () => {
                        let updateCount = 0;
                        const whereClause = typeof identifier === 'number'
                            ? db.variables.where('columnIndex').equals(identifier)
                            : db.variables.where('name').equalsIgnoreCase(identifier);
                         updateCount = await whereClause.modify(changesToApply);
                        if (updateCount === 0) throw new Error(`Variable "${identifier}" not found in DB for multi-update.`);
                    });

                    // 5. Update State
                    set((draft) => {
                        if (variableIndexInState !== -1) {
                            Object.assign(draft.variables[variableIndexInState], changesToApply);
                        }
                        draft.lastUpdated = new Date();
                        draft.error = null;
                    });
                } catch (error: any) {
                    console.error("Error in updateMultipleFields:", error);
                    set((draft) => { draft.error = { message: error.message || "Error updating multiple fields", source: "updateMultipleFields", originalError: error }; });
                }
            },

            addVariable: async (variableData?: Partial<Variable>) => {
                try {
                    await db.transaction('rw', db.variables, async () => {
                        const allCurrentVariables = await db.variables.orderBy('columnIndex').toArray();
                        const maxExistingIndex = allCurrentVariables.length > 0 ? allCurrentVariables[allCurrentVariables.length - 1].columnIndex : -1;
                        const intendedIndex = variableData?.columnIndex ?? (maxExistingIndex + 1);

                        const variableExistsAtIndex = allCurrentVariables.some(v => v.columnIndex === intendedIndex);

                        // Create the base new variable details first
                        const defaultVar = createDefaultVariable(intendedIndex, allCurrentVariables);
                        const inferredValues = variableData?.type ? inferDefaultValues(variableData.type) : {};
                        const newVariableBase: Variable = { ...defaultVar, ...inferredValues, ...variableData, columnIndex: intendedIndex }; // Set index early
                        const nameResult = processVariableName(newVariableBase.name, allCurrentVariables);
                        const finalName = (nameResult.isValid && nameResult.processedName) ? nameResult.processedName : newVariableBase.name;
                        let finalNewVariable = { ...newVariableBase, name: finalName };
                        finalNewVariable = { ...finalNewVariable, ...enforceMeasureConstraint(finalNewVariable, null) };

                        if (variableExistsAtIndex) {
                            // --- Insertion Logic --- 
                            console.log(`[addVariable] Insertion case detected for index: ${intendedIndex}`);
                            
                            // 1. Filter variables before, at, and after the insertion point
                            const varsBefore = allCurrentVariables.filter(v => v.columnIndex < intendedIndex);
                            const varsToShift = allCurrentVariables.filter(v => v.columnIndex >= intendedIndex);

                            // 2. Increment columnIndex for shifted variables
                            const shiftedVars = varsToShift.map(v => ({ ...v, columnIndex: v.columnIndex + 1 }));

                            // 3. Combine all parts: before + new + shifted
                            const finalVariableList = [...varsBefore, finalNewVariable, ...shiftedVars];

                            // 4. Overwrite DB with the new complete list
                            await db.variables.clear();
                            await db.variables.bulkPut(finalVariableList);

                            // 5. Update state
                            set((draft) => {
                                draft.variables = finalVariableList;
                                draft.lastUpdated = new Date();
                                draft.error = null;
                            });

                        } else {
                            // --- Append / Gap Fill Logic --- 
                            console.log(`[addVariable] Append/GapFill case for index: ${intendedIndex}`);
                            
                            // 1. Add the single new variable to the database
                            await db.variables.add(finalNewVariable);

                            // 2. Update state: add the new variable and sort 
                            set((draft) => {
                                draft.variables.push(finalNewVariable);
                                draft.variables.sort((a, b) => a.columnIndex - b.columnIndex);
                                draft.lastUpdated = new Date();
                                draft.error = null;
                            });
                            // ensureCompleteVariables will be called after transaction
                        }
                    });

                    // Call ensureCompleteVariables *after* the transaction only if it wasn't an insertion
                    // Insertions rebuild the whole index, so gaps shouldn't exist.
                    const variableExistsAtIndexAfterTx = get().variables.some(v => v.columnIndex === variableData?.columnIndex);
                    if (variableData?.columnIndex === undefined || !variableExistsAtIndexAfterTx) {
                        // Likely an append or gap fill, run ensure
                        await get().ensureCompleteVariables();
                    }

                } catch (error: any) {
                    console.error("Error in addVariable:", error);
                    set((draft) => { draft.error = { message: error.message || "Error adding variable", source: "addVariable", originalError: error }; });
                }
            },

            addMultipleVariables: async (variablesData) => {
                 // This one is trickier to handle insertions robustly with shifting.
                 // For now, let's assume addMultipleVariables is primarily for appending or initial setup.
                 // If insertion is needed here, it would require more complex logic similar to the single addVariable.
                 // Current logic adds all then calls ensureCompleteVariables.
                const addedVariables: Variable[] = [];
                try {
                    await db.transaction('rw', db.variables, async () => {
                         const allCurrentVariables = await db.variables.orderBy('columnIndex').toArray();
                         let tempIndexCounter = 1;
                         const variablesToAdd: Variable[] = [];

                         for (const data of variablesData) {
                             // Simplified logic: Assume append or explicit non-colliding index for now
                             const maxCurrentIndex = [...allCurrentVariables, ...variablesToAdd].reduce((max, v) => Math.max(max, v.columnIndex), -1);
                             const intendedIndex = data.columnIndex ?? (maxCurrentIndex + tempIndexCounter++);

                             const collision = [...allCurrentVariables, ...variablesToAdd].some(v => v.columnIndex === intendedIndex);
                             if (collision) {
                                 // Simple error handling for now
                                  throw new Error(`Cannot add multiple variables: Column index ${intendedIndex} collision detected.`);
                             }

                             const currentAndPrepared = [...allCurrentVariables, ...variablesToAdd];
                             const defaultVar = createDefaultVariable(intendedIndex, currentAndPrepared);
                             const inferredValues = data.type ? inferDefaultValues(data.type) : {};
                             const newVariableBase: Variable = { ...defaultVar, ...inferredValues, ...data, columnIndex: intendedIndex };
                             const nameResult = processVariableName(newVariableBase.name, currentAndPrepared);
                             const finalName = (nameResult.isValid && nameResult.processedName) ? nameResult.processedName : newVariableBase.name;
                             let finalVariable = { ...newVariableBase, name: finalName };
                             finalVariable = { ...finalVariable, ...enforceMeasureConstraint(finalVariable, null) };
                             variablesToAdd.push(finalVariable);
                             addedVariables.push(finalVariable);
                         }

                         await db.variables.bulkAdd(variablesToAdd);

                         set(draft => {
                             draft.variables = [...allCurrentVariables, ...variablesToAdd]
                                 .sort((a, b) => a.columnIndex - b.columnIndex);
                             draft.lastUpdated = new Date();
                             draft.error = null;
                         });
                     });
                    if (addedVariables.length > 0) {
                         await get().ensureCompleteVariables();
                     }
                 } catch (error: any) {
                     console.error("Error adding multiple variables:", error);
                     set((draft) => { draft.error = { message: error.message || "Error adding multiple variables", source: "addMultipleVariables", originalError: error }; });
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
                }
            },

            deleteVariable: async (columnIndex: number) => {
                try {
                    await db.transaction('rw', db.variables, async () => {
                        const deletedCount = await db.variables.where('columnIndex').equals(columnIndex).delete();
                        if (deletedCount === 0) {
                            console.warn(`Variable with column index ${columnIndex} not found in DB for deletion.`);
                            return;
                        }
                        const remainingVariables = await db.variables.orderBy('columnIndex').toArray();
                        const finalVariables = remainingVariables.map((variable, index) => ({
                            ...variable,
                            columnIndex: index
                        }));
                        await db.variables.clear();
                        if (finalVariables.length > 0) await db.variables.bulkPut(finalVariables);
                        set((draft) => {
                            draft.variables = finalVariables;
                            draft.lastUpdated = new Date();
                            draft.error = null;
                        });
                    });
                } catch (error: any) {
                    console.error("Error deleting variable:", error);
                    set((draft) => { draft.error = { message: error.message || "Error deleting variable", source: "deleteVariable", originalError: error }; });
                }
            },

            overwriteVariables: async (variables) => {
                try {
                    await db.transaction('rw', db.variables, async () => {
                        const normalizedVariables = variables
                            .sort((a, b) => (a.columnIndex ?? Infinity) - (b.columnIndex ?? Infinity))
                            .map((variable, index) => {
                                const constrainedChanges = enforceMeasureConstraint(variable, null);
                                return { ...variable, ...constrainedChanges, columnIndex: index };
                            });

                        await db.variables.clear();
                        await db.variables.bulkPut(normalizedVariables);
                        set((draft) => {
                            draft.variables = normalizedVariables;
                            draft.lastUpdated = new Date();
                            draft.error = null;
                        });
                    });
                } catch (error: any) {
                    console.error("Error overwriting variables:", error);
                    set((draft) => { draft.error = { message: error.message || "Error overwriting variables", source: "overwriteVariables", originalError: error }; });
                }
            },

            sortVariables: async (direction, columnIndex) => {
                try {
                    await db.transaction('rw', db.variables, async () => {
                        const variablesToSort = [...get().variables];
                        const field = getFieldNameByColumnIndex(columnIndex);
                        if (!field) {
                            console.warn(`Invalid column index ${columnIndex} for sorting.`);
                            return;
                        }
                        variablesToSort.sort((a, b) => {
                            const aValue = a[field as keyof Variable]; const bValue = b[field as keyof Variable];
                            if (aValue == null && bValue == null) return 0;
                            if (aValue == null) return direction === 'asc' ? -1 : 1;
                            if (bValue == null) return direction === 'asc' ? 1 : -1;
                            if (typeof aValue === 'number' && typeof bValue === 'number') return direction === 'asc' ? aValue - bValue : bValue - aValue;
                            if (typeof aValue === 'string' && typeof bValue === 'string') return direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                            const aStr = String(aValue).toLowerCase(); const bStr = String(bValue).toLowerCase();
                            return direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
                        });
                        const updatedVariables = variablesToSort.map((variable, index) => ({ ...variable, columnIndex: index }));
                        await db.variables.clear();
                        await db.variables.bulkPut(updatedVariables);
                        set((draft) => {
                            draft.variables = updatedVariables;
                            draft.lastUpdated = new Date();
                        });
                    });
                } catch (error: any) {
                    console.error("Error sorting variables:", error);
                    set((draft) => { draft.error = { message: error.message || "Error sorting variables", source: "sortVariables", originalError: error }; });
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
                        draft.error = { message: error.message || "Failed to save variables during explicit save", source: "saveVariables", originalError: error };
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