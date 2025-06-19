import { useState, useCallback } from 'react';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';
import { HighlightedVariable, VariableSelectionProps, VariableSelectionResult } from '../types';

/**
 * Hook for managing variable selections in the K-Independent Samples component
 * @returns An object containing variables and functions for managing variable selection
 */
export const useVariableSelection = (props?: VariableSelectionProps): VariableSelectionResult => {
    const variables = useVariableStore(state => state.variables);
    const [availableVariables, setAvailableVariables] = useState<Variable[]>(() => {
        const validVars = variables.filter(v => v.type === 'NUMERIC' && v.name !== "");
        return props?.initialVariables || validVars;
    });
    const [testVariables, setTestVariables] = useState<Variable[]>([]);
    const [groupingVariable, setGroupingVariable] = useState<Variable | null>(null);
    const [highlightedVariable, setHighlightedVariable] = useState<HighlightedVariable | null>(null);

    const moveToTestVariable = useCallback((variable: Variable, targetIndex?: number) => {
        // Remove from source list
        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        
        // Add to test variables list
        setTestVariables(prev => {
            const newList = [...prev];
            
            // If target index is specified, insert at that position
            if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variable);
            } else {
                // Otherwise append to end
                newList.push(variable);
            }
            
            return newList;
        });
        
        setHighlightedVariable(null);
    }, []);

    const moveToGroupingVariable = useCallback((variable: Variable) => {
        if (!variable) return;
        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        
        if (groupingVariable) {
            setAvailableVariables(prev => [...prev, groupingVariable]);
        }
        
        // Set new grouping variable
        setGroupingVariable(variable);
        setHighlightedVariable(null);
    }, [groupingVariable]);

    const moveToAvailableVariables = useCallback((variable: Variable, source: 'selected' | 'grouping', targetIndex?: number) => {
        if (!variable) return;

        // Handle moving from test variables
        if (source === 'selected') {
            setTestVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        }
        // Handle moving from grouping variable
        else if (source === 'grouping') {
            setGroupingVariable(null);
        }

        setAvailableVariables(prev => {
            const newList = [...prev];
            // If target index is specified, insert at that position
            if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variable);
            } else {
                // Otherwise, insert in original order from the variables array
                const originalIndex = variables.findIndex(v => v.tempId === variable.tempId);
                
                // Find where to insert to maintain the original order
                let insertIndex = 0;
                while (
                    insertIndex < newList.length &&
                    variables.findIndex(v => v.tempId === newList[insertIndex].tempId) < originalIndex
                ) {
                    insertIndex++;
                }
                
                newList.splice(insertIndex, 0, variable);
            }
            return newList;
        });
        setHighlightedVariable(null);
    }, [variables]);

    const reorderVariables = useCallback((source: 'available' | 'selected', reorderedVariables: Variable[]) => {
        if (source === 'available') {
            setAvailableVariables([...reorderedVariables]);
        } else if (source === 'selected') {
            setTestVariables([...reorderedVariables]);
        }
    }, []);

    const resetVariableSelection = useCallback(() => {
        // Safely combine arrays and filter out null values
        const allVars = [
            ...testVariables,
            ...(groupingVariable ? [groupingVariable] : [])
        ];
        
        // Add all variables back to available
        setAvailableVariables(prev => {
            const combined = [...prev, ...allVars];
            // Remove duplicates based on columnIndex
            const uniqueVars = Array.from(
                new Map(combined.map(v => [v.columnIndex, v])).values()
            );
            return uniqueVars.sort((a, b) => a.columnIndex - b.columnIndex);
        });
        
        setTestVariables([]);
        setGroupingVariable(null);
        setHighlightedVariable(null);
    }, [testVariables, groupingVariable]);
    
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