import { useState, useCallback, useMemo } from 'react';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';
import { VariableSelectionProps, VariableSelectionResult, HighlightedVariableInfo } from '../types';

export const useVariableSelection = (props?: VariableSelectionProps): VariableSelectionResult => {
  const variables = useVariableStore(state => state.variables);
  
  // State for variable lists
  const [availableVariables, setAvailableVariables] = useState<Variable[]>(() => {
    // Filter out empty variable names
    const validVars = variables.filter(v => v.name !== "");
    return props?.initialVariables || validVars;
  });
  
  const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
  const [highlightedVariable, setHighlightedVariable] = useState<HighlightedVariableInfo | null>(null);

  // Function to move a variable from available to selected
  const moveToSelectedVariables = useCallback((variable: Variable, targetIndex?: number) => {
    setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
    
    setSelectedVariables(prev => {
      const newList = [...prev];
      if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= newList.length) {
        newList.splice(targetIndex, 0, variable);
      } else {
        newList.push(variable);
      }
      return newList;
    });
    
    setHighlightedVariable(null);
  }, []);

  // Function to move a variable from selected to available
  const moveToAvailableVariables = useCallback((variable: Variable, targetIndex?: number) => {
    setSelectedVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
    
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

  // Function to reorder variables within a list
  const reorderVariables = useCallback((source: 'available' | 'selected', reorderedVariables: Variable[]) => {
    if (source === 'available') {
      setAvailableVariables(reorderedVariables);
    } else {
      setSelectedVariables(reorderedVariables);
    }
  }, []);

  // Reset function
  const resetVariableSelection = useCallback(() => {
    const validVars = variables.filter(v => v.name !== "");
    setAvailableVariables(validVars);
    setSelectedVariables([]);
    setHighlightedVariable(null);
  }, [variables]);

  return {
    availableVariables,
    selectedVariables,
    highlightedVariable,
    setHighlightedVariable,
    moveToSelectedVariables,
    moveToAvailableVariables,
    reorderVariables,
    resetVariableSelection
  };
};

export default useVariableSelection; 