import { useState, useCallback, useMemo, useEffect } from 'react';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';
import { VariableSelectionProps, VariableSelectionResult, HighlightedVariableInfo } from '../types';

export const useVariableSelection = (props?: VariableSelectionProps): VariableSelectionResult => {
  const variables = useVariableStore(state => state.variables);
  
  // State for variable lists
  const [availableVariables, setAvailableVariables] = useState<Variable[]>(() => {
    // Filter to only include numeric variables for t-test
    return variables.filter(v => v.type === 'NUMERIC' && v.name !== "");
  });
  
  const [testVariables1, setTestVariables1] = useState<Variable[]>([]);
  const [testVariables2, setTestVariables2] = useState<Variable[]>([]);
  const [highlightedVariable, setHighlightedVariable] = useState<HighlightedVariableInfo | null>(null);
  const [selectedPair, setSelectedPair] = useState<number | null>(null);

  // Notify parent component of changes if onVariableSelectionChange is provided
  useEffect(() => {
    if (props?.onVariableSelectionChange) {
      props.onVariableSelectionChange(testVariables1, testVariables2);
    }
  }, [props, testVariables1, testVariables2]);

  // Handle selecting a variable from available list
  const handleSelectedVariable = useCallback((variable: Variable, targetList: 'list1' | 'list2') => {
    setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
    
    if (targetList === 'list1') {
      setTestVariables1(prev => [...prev, variable]);
    } else {
      setTestVariables2(prev => [...prev, variable]);
    }
    
    setHighlightedVariable(null);
  }, []);

  // Handle deselecting a variable from test lists
  const handleDeselectVariable = useCallback((variable: Variable, sourceList: 'list1' | 'list2', rowIndex?: number) => {
    // Remove variable from its source list
    if (sourceList === 'list1') {
      setTestVariables1(prev => prev.filter((_, i) => i !== rowIndex));
    } else {
      setTestVariables2(prev => prev.filter((_, i) => i !== rowIndex));
    }
    
    // Add variable back to available list in its original position
    setAvailableVariables(prev => {
      const newList = [...prev];
      
      // Find where to insert to maintain the original order
      const originalIndex = variables.findIndex(v => v.tempId === variable.tempId);
      
      let insertIndex = 0;
      while (
        insertIndex < newList.length &&
        variables.findIndex(v => v.tempId === newList[insertIndex].tempId) < originalIndex
      ) {
        insertIndex++;
      }
      
      newList.splice(insertIndex, 0, variable);
      return newList;
    });
    
    setHighlightedVariable(null);
  }, [variables]);

  // Handle moving a variable between test lists
  const handleMoveVariableBetweenLists = useCallback((index: number) => {
    if (index < 0 || (index >= testVariables1.length && index >= testVariables2.length)) {
      return;
    }
    
    // Move from list1 to list2
    if (index < testVariables1.length && testVariables1[index]) {
      const variable = testVariables1[index];
      setTestVariables1(prev => prev.filter((_, i) => i !== index));
      
      // Add to list2 at the same index
      setTestVariables2(prev => {
        const newList = [...prev];
        while (newList.length <= index) {
          newList.push(undefined as unknown as Variable);
        }
        newList[index] = variable;
        return newList;
      });
    }
    // Move from list2 to list1
    else if (index < testVariables2.length && testVariables2[index]) {
      const variable = testVariables2[index];
      setTestVariables2(prev => prev.filter((_, i) => i !== index));
      
      // Add to list1 at the same index
      setTestVariables1(prev => {
        const newList = [...prev];
        while (newList.length <= index) {
          newList.push(undefined as unknown as Variable);
        }
        newList[index] = variable;
        return newList;
      });
    }
    
    setSelectedPair(null);
  }, [testVariables1, testVariables2]);

  // Handle moving a pair up in the list
  const handleMoveUpPair = useCallback((index: number) => {
    if (index <= 0) return;
    
    setTestVariables1(prev => {
      const newList = [...prev];
      if (index < newList.length && index - 1 < newList.length) {
        [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
      }
      return newList;
    });
    
    setTestVariables2(prev => {
      const newList = [...prev];
      if (index < newList.length && index - 1 < newList.length) {
        [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
      }
      return newList;
    });
    
    setSelectedPair(index - 1);
  }, []);

  // Handle moving a pair down in the list
  const handleMoveDownPair = useCallback((index: number) => {
    const maxLength = Math.max(testVariables1.length, testVariables2.length);
    if (index < 0 || index >= maxLength - 1) return;
    
    setTestVariables1(prev => {
      const newList = [...prev];
      if (index < newList.length && index + 1 < newList.length) {
        [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      }
      return newList;
    });
    
    setTestVariables2(prev => {
      const newList = [...prev];
      if (index < newList.length && index + 1 < newList.length) {
        [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      }
      return newList;
    });
    
    setSelectedPair(index + 1);
  }, [testVariables1, testVariables2]);

  // Handle removing a pair
  const handleRemovePair = useCallback((index: number) => {
    // Get variables to move back to available list
    const var1 = testVariables1[index];
    const var2 = testVariables2[index];
    
    // Remove from test lists
    setTestVariables1(prev => prev.filter((_, i) => i !== index));
    setTestVariables2(prev => prev.filter((_, i) => i !== index));
    
    // Add variables back to available list
    if (var1) {
      setAvailableVariables(prev => {
        const newList = [...prev];
        const originalIndex = variables.findIndex(v => v.tempId === var1.tempId);
        
        let insertIndex = 0;
        while (
          insertIndex < newList.length &&
          variables.findIndex(v => v.tempId === newList[insertIndex].tempId) < originalIndex
        ) {
          insertIndex++;
        }
        
        newList.splice(insertIndex, 0, var1);
        return newList;
      });
    }
    
    if (var2) {
      setAvailableVariables(prev => {
        const newList = [...prev];
        const originalIndex = variables.findIndex(v => v.tempId === var2.tempId);
        
        let insertIndex = 0;
        while (
          insertIndex < newList.length &&
          variables.findIndex(v => v.tempId === newList[insertIndex].tempId) < originalIndex
        ) {
          insertIndex++;
        }
        
        newList.splice(insertIndex, 0, var2);
        return newList;
      });
    }
    
    setSelectedPair(null);
  }, [testVariables1, testVariables2, variables]);

  // Check if a pair is valid (both variables are selected)
  const isPairValid = useCallback((index: number): boolean => {
    return !!(testVariables1[index] && testVariables2[index]);
  }, [testVariables1, testVariables2]);

  // Check if all pairs are valid
  const areAllPairsValid = useCallback((): boolean => {
    const maxLength = Math.max(testVariables1.length, testVariables2.length);
    for (let i = 0; i < maxLength; i++) {
      if (!testVariables1[i] || !testVariables2[i]) {
        return false;
      }
    }
    return maxLength > 0;
  }, [testVariables1, testVariables2]);

  // Check for duplicate pairs
  const hasDuplicatePairs = useCallback((): boolean => {
    const pairs = new Set<string>();
    const maxLength = Math.max(testVariables1.length, testVariables2.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (testVariables1[i] && testVariables2[i]) {
        const pairKey = `${testVariables1[i].tempId}-${testVariables2[i].tempId}`;
        if (pairs.has(pairKey)) {
          return true;
        }
        pairs.add(pairKey);
      }
    }
    
    return false;
  }, [testVariables1, testVariables2]);

  // Reset function
  const resetVariableSelection = useCallback(() => {
    const validVars = variables.filter(v => v.type === 'NUMERIC' && v.name !== "");
    setAvailableVariables(validVars);
    setTestVariables1([]);
    setTestVariables2([]);
    setHighlightedVariable(null);
    setSelectedPair(null);
  }, [variables]);

  return {
    availableVariables,
    testVariables1,
    testVariables2,
    highlightedVariable,
    selectedPair,
    setHighlightedVariable,
    setSelectedPair,
    handleSelectedVariable,
    handleDeselectVariable,
    handleMoveVariableBetweenLists,
    handleMoveUpPair,
    handleMoveDownPair,
    handleRemovePair,
    isPairValid,
    areAllPairsValid,
    hasDuplicatePairs,
    resetVariableSelection
  };
};

export default useVariableSelection; 