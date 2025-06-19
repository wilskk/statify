import { useState, useCallback, useEffect } from 'react';
import { useVariableStore } from '@/stores/useVariableStore';
import { Variable } from '@/types/Variable';
import {
  VariableSelectionProps,
  VariableSelectionResult,
  HighlightedVariable
} from '../types';

export const useVariableSelection = ({
  initialVariables = []
}: VariableSelectionProps = {}): VariableSelectionResult => {
  const { variables } = useVariableStore();
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [selectedVariables, setSelectedVariables] = useState<Variable[]>(initialVariables);
  const [highlightedVariable, setHighlightedVariable] = useState<HighlightedVariable | null>(null);

  useEffect(() => {
    const globalVarsWithTempId = variables.map(v => ({
      ...v,
      tempId: v.tempId || `temp_id_${v.columnIndex}`
    }));
    const globalVarTempIds = new Set(globalVarsWithTempId.map(v => v.tempId));

    // Synchronize selectedVariables with global store: remove any selected variables that no longer exist globally.
    const stillExistingSelectedVars = selectedVariables.filter(sv => 
        sv.tempId && globalVarTempIds.has(sv.tempId)
    );

    if (stillExistingSelectedVars.length !== selectedVariables.length || 
        !stillExistingSelectedVars.every((val, index) => val.tempId === selectedVariables[index]?.tempId)) {
        setSelectedVariables(stillExistingSelectedVars);
    }
    
    // Update availableVariables based on the potentially updated selectedVariables list.
    const currentSelectedTempIds = new Set(stillExistingSelectedVars.filter(v => v.tempId).map(v => v.tempId!));
    const newAvailableVariables = globalVarsWithTempId.filter(
      v => v.name !== "" && v.tempId && !currentSelectedTempIds.has(v.tempId)
    );
    setAvailableVariables(newAvailableVariables);

  }, [variables, selectedVariables]);

  // Function to move a variable from available to selected
  const moveToSelectedVariables = useCallback((variable: Variable, targetIndex?: number) => {
    setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
    
    setSelectedVariables(prev => {
      const newList = [...prev];
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
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
      if (prev.some(v => v.tempId === variable.tempId)) {
        return prev;
      }
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
        newList.splice(targetIndex, 0, variable);
      } else {
        newList.push(variable);
      }
      newList.sort((a, b) => (a.columnIndex || 0) - (b.columnIndex || 0));
      return newList;
    });
    
    setHighlightedVariable(null);
  }, []);

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
    const validVars = variables.filter(v => v.type === 'NUMERIC' && v.name !== "");
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