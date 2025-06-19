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
    const [groupingVariable, setGroupingVariable] = useState<Variable | null>(null);
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

    // Move a variable from available to grouping variable
    const moveToGroupingVariable = useCallback((variable: Variable) => {
        if (groupingVariable) {
            // Return existing grouping variable to available variables
            setAvailableVariables(prev => {
                const newList = [...prev, groupingVariable];
                return newList.sort((a, b) => {
                    const indexA = variables.findIndex(v => v.columnIndex === a.columnIndex);
                    const indexB = variables.findIndex(v => v.columnIndex === b.columnIndex);
                    return indexA - indexB;
                });
            });
        }
        
        setGroupingVariable(variable);
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    }, [groupingVariable, variables]);

    // Move a variable back to available variables
    const moveToAvailableVariables = useCallback((variable: Variable, source: 'selected' | 'grouping', targetIndex?: number) => {
        if (source === 'selected') {
            setTestVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        } else if (source === 'grouping' && groupingVariable?.columnIndex === variable.columnIndex) {
            setGroupingVariable(null);
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
    }, [groupingVariable, variables]);

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
        setGroupingVariable(null);
        setHighlightedVariable(null);
    }, [variables]);

    return {
        availableVariables,
        testVariables,
        groupingVariable,
        highlightedVariable,
        setHighlightedVariable,
        moveToTestVariable,
        moveToGroupingVariable,
        moveToAvailableVariables,
        reorderVariables,
        resetVariableSelection
    };
}; 