import { useCallback, useState } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import type { Variable } from "@/types/Variable";

export type HighlightedVariable = {
    tempId: string;
    source: 'available' | 'test1' | 'test2';
    rowIndex?: number;
};

export const useVariableSelection = () => {
    const variables = useVariableStore((state) => state.variables);
    const [availableVariables, setAvailableVariables] = useState<Variable[]>(
        variables.filter(v => v.name !== "")
    );
    const [testVariables1, setTestVariables1] = useState<Variable[]>([]);
    const [testVariables2, setTestVariables2] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<HighlightedVariable | null>(null);
    const [highlightedPair, setHighlightedPair] = useState<{ id: number } | null>(null);

    // Move a variable to test variables (either list1 or list2)
    const moveToTestVariables = useCallback((variable: Variable, targetList?: 'test1' | 'test2') => {
        // Auto-determine which list needs a variable if targetList not specified
        const targetListToUse = targetList || (testVariables1.length <= testVariables2.length ? 'test1' : 'test2');
        
        if (targetListToUse === 'test1') {
            // Check if variable already exists in list2 at same index
            if (testVariables2.length > testVariables1.length) {
                const matchingIndex = testVariables1.length;
                const potentialMatch = testVariables2[matchingIndex];
                
                if (potentialMatch && potentialMatch.columnIndex === variable.columnIndex) {
                    console.warn("Cannot add the same variable to both sides of a pair");
                    return;
                }
            }
            
            setTestVariables1(prev => [...prev, variable]);
        } else {
            // Check if variable already exists in list1 at same index
            if (testVariables2.length < testVariables1.length) {
                const matchingIndex = testVariables2.length;
                const potentialMatch = testVariables1[matchingIndex];
                
                if (potentialMatch && potentialMatch.columnIndex === variable.columnIndex) {
                    console.warn("Cannot add the same variable to both sides of a pair");
                    return;
                }
            }
            
            setTestVariables2(prev => [...prev, variable]);
        }
        
        setHighlightedVariable(null);
    }, [testVariables1, testVariables2]);

    // Remove a variable from a test list
    const removeVariable = useCallback((sourceList: 'test1' | 'test2', rowIndex: number) => {
        if (sourceList === 'test1') {
            const otherVariable = testVariables2[rowIndex];
            
            // Check if slot in variable2 is empty
            if (!otherVariable) {
                // Remove the entire row - pairs below will move up
                setTestVariables1(prev => {
                    const newArray = [...prev];
                    newArray.splice(rowIndex, 1);
                    return newArray;
                });
                setTestVariables2(prev => {
                    const newArray = [...prev];
                    newArray.splice(rowIndex, 1);
                    return newArray;
                });
            } else {
                // If variable2 is not empty, just empty this slot
                setTestVariables1(prev => {
                    const newArray = [...prev];
                    newArray[rowIndex] = undefined as any;
                    return newArray;
                });
            }
        } else { // sourceList === 'test2'
            const otherVariable = testVariables1[rowIndex];
            
            // Check if slot in variable1 is empty
            if (!otherVariable) {
                // Remove the entire row - pairs below will move up
                setTestVariables1(prev => {
                    const newArray = [...prev];
                    newArray.splice(rowIndex, 1);
                    return newArray;
                });
                setTestVariables2(prev => {
                    const newArray = [...prev];
                    newArray.splice(rowIndex, 1);
                    return newArray;
                });
            } else {
                // If variable1 is not empty, just empty this slot
                setTestVariables2(prev => {
                    const newArray = [...prev];
                    newArray[rowIndex] = undefined as any;
                    return newArray;
                });
            }
        }
        
        setHighlightedVariable(null);
    }, [testVariables1, testVariables2]);

    // Move variable between lists (swap variable1 and variable2)
    const moveVariableBetweenLists = useCallback((index: number) => {
        // Move variable from list1 to list2 or vice versa
        const temp = testVariables1[index];
        setTestVariables1(prev => {
            const newArray = [...prev];
            newArray[index] = testVariables2[index];
            return newArray;
        });
        setTestVariables2(prev => {
            const newArray = [...prev];
            newArray[index] = temp;
            return newArray;
        });
    }, [testVariables1, testVariables2]);

    // Move a pair up in the list
    const moveUpPair = useCallback((index: number) => {
        if (index > 0) {
            setTestVariables1(prev => {
                const newArray = [...prev];
                [newArray[index], newArray[index - 1]] = [newArray[index - 1], newArray[index]];
                return newArray;
            });
            
            setTestVariables2(prev => {
                const newArray = [...prev];
                [newArray[index], newArray[index - 1]] = [newArray[index - 1], newArray[index]];
                return newArray;
            });
            
            setHighlightedPair({ id: index - 1 });
        }
    }, []);

    // Move a pair down in the list
    const moveDownPair = useCallback((index: number) => {
        if (index < testVariables1.length - 1) {
            setTestVariables1(prev => {
                const newArray = [...prev];
                [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
                return newArray;
            });
            
            setTestVariables2(prev => {
                const newArray = [...prev];
                [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
                return newArray;
            });
            
            setHighlightedPair({ id: index + 1 });
        }
    }, [testVariables1.length]);

    // Remove a pair
    const removePair = useCallback((index: number) => {
        setTestVariables1(prev => prev.filter((_, i) => i !== index));
        setTestVariables2(prev => prev.filter((_, i) => i !== index));
        setHighlightedPair(null);
    }, []);

    // Reorder pairs based on a new array of pairs
    const reorderPairs = useCallback((pairs: [Variable, Variable][]) => {
        const newVariables1: Variable[] = [];
        const newVariables2: Variable[] = [];
        
        pairs.forEach(pair => {
            newVariables1.push(pair[0]);
            newVariables2.push(pair[1]);
        });
        
        setTestVariables1(newVariables1);
        setTestVariables2(newVariables2);
    }, []);

    // Check if a pair is valid
    const isPairValid = useCallback((index: number): boolean => {
        // Ensure both variables in pair exist and are different
        if (!testVariables1[index] || !testVariables2[index]) {
            return false;
        }
        
        // Check if variables are different (based on columnIndex)
        return testVariables1[index].columnIndex !== testVariables2[index].columnIndex;
    }, [testVariables1, testVariables2]);

    // Check if all pairs are valid
    const areAllPairsValid = useCallback((): boolean => {
        if (testVariables1.length === 0 || testVariables2.length === 0) {
            return false;
        }
        
        if (testVariables1.length !== testVariables2.length) {
            return false;
        }
        
        // Check all pairs for validity
        for (let i = 0; i < testVariables1.length; i++) {
            if (!isPairValid(i)) {
                return false;
            }
        }
        
        return true;
    }, [testVariables1, testVariables2, isPairValid]);

    // Check for duplicate pairs
    const hasDuplicatePairs = useCallback((): boolean => {
        const pairSignatures = new Set<string>();
        
        for (let i = 0; i < testVariables1.length; i++) {
            if (testVariables1[i] && testVariables2[i]) {
                // Create unique signature for each pair
                const var1Id = testVariables1[i].columnIndex;
                const var2Id = testVariables2[i].columnIndex;
                const pairSignature = `${var1Id}-${var2Id}`;
                
                // Check if signature already exists
                if (pairSignatures.has(pairSignature)) {
                    return true; // Found a duplicate
                }
                
                pairSignatures.add(pairSignature);
            }
        }
        
        return false;
    }, [testVariables1, testVariables2]);

    // Reset variable selection
    const resetVariableSelection = useCallback(() => {
        setAvailableVariables(variables.filter(v => v.name !== ""));
        setTestVariables1([]);
        setTestVariables2([]);
        setHighlightedVariable(null);
        setHighlightedPair(null);
    }, [variables]);

    return {
        availableVariables,
        testVariables1,
        testVariables2,
        highlightedVariable,
        setHighlightedVariable,
        highlightedPair,
        setHighlightedPair,
        moveToTestVariables,
        removeVariable,
        moveVariableBetweenLists,
        moveUpPair,
        moveDownPair,
        removePair,
        isPairValid,
        areAllPairsValid,
        hasDuplicatePairs,
        reorderPairs,
        resetVariableSelection
    };
}; 