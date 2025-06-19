import { useState, useEffect, useCallback } from 'react';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';
import { HighlightedVariable, VariableSelectionProps, VariableSelectionResult } from '../types';

export const useVariableSelection = (props?: VariableSelectionProps): VariableSelectionResult => {
    const { initialVariables } = props || {};
    const variables = useVariableStore(state => state.variables);
    
    // State for variable lists
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [testVariables, setTestVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<HighlightedVariable | null>(null);

    // Initialize available variables on component mount
    useEffect(() => {
        const validVars = initialVariables || variables.filter(v => v.name !== "");
        setAvailableVariables(validVars);
    }, [initialVariables, variables]);

    // Move a variable from available to test variables
    const moveToTestVariable = useCallback((variable: Variable, targetIndex?: number) => {
        setTestVariables(prev => {
            const newList = [...prev];
            // If targetIndex is provided, insert at that index, otherwise append
            if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variable);
            } else {
                newList.push(variable);
            }
            return newList;
        });
        
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    }, []);

    // Move a variable back to available variables
    const moveToAvailableVariables = useCallback((variable: Variable, source: 'selected', targetIndex?: number) => {
        if (source === 'selected') {
            setTestVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        }

        setAvailableVariables(prev => {
            const newList = [...prev];
            // If targetIndex is provided, insert at that index, otherwise append and sort
            if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variable);
            } else {
                newList.push(variable);
                newList.sort((a, b) => {
                    const indexA = variables.findIndex(v => v.columnIndex === a.columnIndex);
                    const indexB = variables.findIndex(v => v.columnIndex === b.columnIndex);
                    return indexA - indexB;
                });
            }
            return newList;
        });
        
        setHighlightedVariable(null);
    }, [variables]);

    // Reorder variables within a list
    const reorderVariables = useCallback((source: 'available' | 'selected', reorderedVariables: Variable[]) => {
        if (source === 'available') {
            setAvailableVariables(reorderedVariables);
        } else if (source === 'selected') {
            setTestVariables(reorderedVariables);
        }
    }, []);

    // Reset all selections
    const resetVariableSelection = useCallback(() => {
        const validVars = variables.filter(v => v.name !== "");
        setAvailableVariables(validVars);
        setTestVariables([]);
        setHighlightedVariable(null);
    }, [variables]);

    return {
        availableVariables,
        testVariables,
        highlightedVariable,
        setHighlightedVariable,
        moveToTestVariable,
        moveToAvailableVariables,
        reorderVariables,
        resetVariableSelection
    };
}; 