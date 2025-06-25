import { useState, useEffect } from 'react';
import { Variable } from '@/types/Variable';
import { useVariableStore } from '@/stores/useVariableStore';

export interface VariableSelectionProps {
  initialVariables?: Variable[];
}

export interface VariableSelectionResult {
  availableVariables: Variable[];
  selectedVariables: Variable[];
  highlightedVariable: { tempId: string, source: 'available' | 'selected' } | null;
  setHighlightedVariable: React.Dispatch<React.SetStateAction<{ tempId: string, source: 'available' | 'selected' } | null>>;
  moveToSelectedVariables: (variable: Variable, targetIndex?: number) => void;
  moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
  reorderVariables: (source: 'available' | 'selected', variables: Variable[]) => void;
  resetVariableSelection: () => void;
}

export const useVariableSelection = ({
  initialVariables = []
}: VariableSelectionProps = {}): VariableSelectionResult => {
  const { variables } = useVariableStore();
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [selectedVariables, setSelectedVariables] = useState<Variable[]>(initialVariables);
  const [highlightedVariable, setHighlightedVariable] = useState<{ tempId: string, source: 'available' | 'selected' } | null>(null);

  // Update available variables when store variables change
  useEffect(() => {
    const validVars = variables.filter(v => v.name !== "").map(v => ({
      ...v,
      tempId: v.tempId || `temp_${v.columnIndex}`
    }));
    const selectedTempIds = new Set(selectedVariables.map(v => v.tempId));
    const finalAvailable = validVars.filter(v => v.tempId && !selectedTempIds.has(v.tempId));
    setAvailableVariables(finalAvailable);
  }, [variables, selectedVariables]);

  const moveToSelectedVariables = (variable: Variable, targetIndex?: number) => {
    if (!variable.tempId) {
      console.error("Cannot move variable without tempId:", variable);
      return;
    }
    setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
    setSelectedVariables(prev => {
      if (prev.some(v => v.tempId === variable.tempId)) {
        return prev;
      }
      const newList = [...prev];
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
        newList.splice(targetIndex, 0, variable);
      } else {
        newList.push(variable);
      }
      return newList;
    });
    setHighlightedVariable(null);
  };

  const moveToAvailableVariables = (variable: Variable, targetIndex?: number) => {
    if (!variable.tempId) {
      console.error("Cannot move variable without tempId:", variable);
      return;
    }
    setSelectedVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
    setAvailableVariables(prev => {
      if (prev.some(v => v.tempId === variable.tempId)) {
        return prev;
      }
      const newList = [...prev];
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
        newList.splice(targetIndex, 0, variable);
      } else {
        newList.push(variable);
      }
      newList.sort((a, b) => a.columnIndex - b.columnIndex);
      return newList;
    });
    setHighlightedVariable(null);
  };

  const reorderVariables = (source: 'available' | 'selected', reorderedList: Variable[]) => {
    if (source === 'available') {
      setAvailableVariables([...reorderedList]);
    } else {
      setSelectedVariables([...reorderedList]);
    }
  };

  const resetVariableSelection = () => {
    const allVars = [...availableVariables, ...selectedVariables].sort((a, b) => a.columnIndex - b.columnIndex);
    setAvailableVariables(allVars);
    setSelectedVariables([]);
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