import { useState, useEffect } from 'react';
import { Variable } from '@/types/Variable';
import { useVariableStore } from '@/stores/useVariableStore';
import { 
  VariableSelectionProps, 
  VariableSelectionResult, 
  HighlightedVariableInfo 
} from '../types';

export const useVariableSelection = ({
  initialVariables = []
}: VariableSelectionProps = {}): VariableSelectionResult => {
  const { variables } = useVariableStore();
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
  const [highlightedVariable, setHighlightedVariable] = useState<HighlightedVariableInfo | null>(null);

  useEffect(() => {
    setAvailableVariables(variables.filter(v => v.name !== ""));
  }, [variables]);

  const moveToSelectedVariables = (variable: Variable, targetIndex?: number) => {
    setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
    setSelectedVariables(prev => {
      if (prev.some(v => v.columnIndex === variable.columnIndex)) {
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
    setSelectedVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
    setAvailableVariables(prev => {
      if (prev.some(v => v.columnIndex === variable.columnIndex)) {
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

  const reorderVariables = (source: 'available' | 'selected', variablesToReorder: Variable[]) => {
    if (source === 'available') {
      setAvailableVariables([...variablesToReorder]);
    } else {
      setSelectedVariables([...variablesToReorder]);
    }
  };

  const resetVariableSelection = () => {
    setSelectedVariables([]);
    setAvailableVariables(variables.filter(v => v.name !== ""));
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