import { useState, useEffect } from 'react';
import { Variable } from '@/types/Variable';
import { useVariableStore } from '@/stores/useVariableStore';
import { 
  VariableSelectionProps,
  HighlightedVariableInfo 
} from '../types';

export const useVariableSelection = ({
  initialVariables = []
}: Omit<VariableSelectionProps, 'resetVariableSelection'> = {}) => {
  const { variables } = useVariableStore();
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [selectedVariables, setSelectedVariables] = useState<Variable[]>(initialVariables);
  const [highlightedVariable, setHighlightedVariable] = useState<HighlightedVariableInfo | null>(null);

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

  const moveToSelectedVariables = (variable: Variable, targetIndex?: number) => {
    const variableWithTempId = {
      ...variable,
      tempId: variable.tempId || `temp_id_${variable.columnIndex}`
    };
    setAvailableVariables(prev => prev.filter(v => v.tempId !== variableWithTempId.tempId));
    setSelectedVariables(prev => {
      if (prev.some(v => v.tempId === variableWithTempId.tempId)) {
        return prev;
      }
      const newList = [...prev];
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
        newList.splice(targetIndex, 0, variableWithTempId);
      } else {
        newList.push(variableWithTempId);
      }
      return newList;
    });
    setHighlightedVariable(null);
  };

  const moveToAvailableVariables = (variable: Variable, targetIndex?: number) => {
    const variableWithTempId = {
      ...variable,
      tempId: variable.tempId || `temp_id_${variable.columnIndex}`
    };
    setSelectedVariables(prev => prev.filter(v => v.tempId !== variableWithTempId.tempId));
    setAvailableVariables(prev => {
      if (prev.some(v => v.tempId === variableWithTempId.tempId)) {
        return prev;
      }
      const newList = [...prev];
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
        newList.splice(targetIndex, 0, variableWithTempId);
      } else {
        newList.push(variableWithTempId);
      }
      newList.sort((a, b) => (a.columnIndex || 0) - (b.columnIndex || 0));
      return newList;
    });
    setHighlightedVariable(null);
  };

  const reorderVariables = (source: 'available' | 'selected', variablesToReorder: Variable[]) => {
    if (source === 'available') {
      setAvailableVariables([...variablesToReorder]);
    } else {
      setSelectedVariables([...variablesToReorder]);
    }
  };

  const resetVariableSelection = () => {
    const allVariablesWithTempId = variables.map(v => ({
      ...v,
      tempId: v.tempId || `temp_id_${v.columnIndex}`
    }));
    setSelectedVariables([]);
    setAvailableVariables(allVariablesWithTempId.filter(v => v.name !== ""));
    setHighlightedVariable(null);
  };

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