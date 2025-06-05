import { useState, useEffect, useCallback } from 'react';
import { GoToMode } from '../types';
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';
import { useTableRefStore } from '@/stores/useTableRefStore';

interface UseGoToFormProps {
  defaultMode?: GoToMode;
  onClose: () => void;
}

export const useGoToForm = ({ defaultMode = GoToMode.CASE, onClose }: UseGoToFormProps) => {
  const allVariables = useVariableStore((state) => state.variables);
  const data = useDataStore((state) => state.data);
  const dataTableRef = useTableRefStore((state) => state.dataTableRef);
  
  const [activeTab, setActiveTab] = useState<string>(defaultMode);
  const [caseNumberInput, setCaseNumberInput] = useState<string>('1');
  const [caseError, setCaseError] = useState<string>('');
  const [variableNames, setVariableNames] = useState<string[]>([]);
  const [selectedVariableName, setSelectedVariableName] = useState<string>('');
  const [variableError, setVariableError] = useState<string>('');
  const [totalCases, setTotalCases] = useState<number>(0);
  const [lastNavigationSuccess, setLastNavigationSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    const names = [...allVariables].sort((a,b) => a.columnIndex - b.columnIndex).map(v => v.name);
    setVariableNames(names);
    if (names.length > 0 && !selectedVariableName) {
      setSelectedVariableName(names[0]);
    }
  }, [allVariables, selectedVariableName]);

  useEffect(() => {
    setTotalCases(data?.length || 0);
  }, [data]);

  useEffect(() => {
    setCaseError('');
    setVariableError('');
    if (activeTab === GoToMode.CASE) {
      setCaseNumberInput('1');
    } else if (activeTab === GoToMode.VARIABLE && variableNames.length > 0 && !selectedVariableName) {
      setSelectedVariableName(variableNames[0]);
    }
  }, [activeTab, variableNames, selectedVariableName]);

  const handleCaseNumberChange = useCallback((value: string) => {
    setCaseNumberInput(value);
    if (value === '' || !/^[1-9][0-9]*$/.test(value)) {
      setCaseError('Case number must be a positive integer.');
    } else if (parseInt(value, 10) > totalCases) {
      setCaseError(`Case number must not exceed ${totalCases}.`);
    } else {
      setCaseError('');
    }
  }, [totalCases]);

  const handleSelectedVariableChange = useCallback((value: string) => {
    setSelectedVariableName(value);
    setVariableError('');
  }, []);

  // This is the key function that navigates to a specific case or variable
  const navigateToTarget = useCallback((type: 'case' | 'variable') => {
    // Reset last navigation result
    setLastNavigationSuccess(null);
    
    const hot = dataTableRef?.current?.hotInstance;
    if (!hot) {
      console.error("Handsontable instance not found");
      setLastNavigationSuccess(false);
      return false;
    }
    
    try {
      if (type === 'case') {
        // Validate case number
        if (caseNumberInput === '' || !/^[1-9][0-9]*$/.test(caseNumberInput)) {
          setCaseError('Please enter a valid case number.');
          setLastNavigationSuccess(false);
          return false;
        }
        
        const rowIndex = parseInt(caseNumberInput, 10) - 1; // Convert to 0-based index
        if (rowIndex >= data.length || rowIndex < 0) {
          setCaseError(`Case number must be between 1 and ${data.length}.`);
          setLastNavigationSuccess(false);
          return false;
        }
        
        // Navigate to the row
        console.log(`Navigating to row ${rowIndex}`);
        hot.scrollViewportTo(rowIndex, 0);
        
        // Select all cells in the row
        setTimeout(() => {
          if (hot) {
            // Different selection methods to try
            try {
              // Method 1: Try to use the selectRows method
              if (typeof hot.selectRows === 'function') {
                hot.selectRows(rowIndex);
              } 
              // Method 2: Select all cells in the row
              else {
                const colCount = hot.countCols();
                hot.selectCell(rowIndex, 0, rowIndex, colCount - 1);
              }
              
              setLastNavigationSuccess(true);
              return true;
            } catch (err) {
              // Method 3: Last resort - just select the first cell in the row
              try {
                hot.selectCell(rowIndex, 0);
                setLastNavigationSuccess(true);
                return true;
              } catch (finalErr) {
                console.error("Failed to select cell:", finalErr);
                setLastNavigationSuccess(false);
                return false;
              }
            }
          }
        }, 100);
        
      } else if (type === 'variable') {
        // Validate variable selection
        if (!selectedVariableName) {
          setVariableError('Please select a variable.');
          setLastNavigationSuccess(false);
          return false;
        }
        
        const variable = allVariables.find(v => v.name === selectedVariableName);
        if (!variable) {
          setVariableError('Selected variable not found.');
          setLastNavigationSuccess(false);
          return false;
        }
        
        const colIndex = variable.columnIndex;
        console.log(`Navigating to column ${colIndex} (${selectedVariableName})`);
        
        // Navigate to the column
        hot.scrollViewportTo(0, colIndex);
        
        // Select all cells in the column
        setTimeout(() => {
          if (hot) {
            // Different selection methods to try
            try {
              // Method 1: Try to use the selectColumns method
              if (typeof hot.selectColumns === 'function') {
                hot.selectColumns(colIndex);
              } 
              // Method 2: Select all cells in the column
              else {
                const rowCount = hot.countRows();
                hot.selectCell(0, colIndex, rowCount - 1, colIndex);
              }
              
              setLastNavigationSuccess(true);
              return true;
            } catch (err) {
              // Method 3: Last resort - just select the first cell in the column
              try {
                hot.selectCell(0, colIndex);
                setLastNavigationSuccess(true);
                return true;
              } catch (finalErr) {
                console.error("Failed to select cell:", finalErr);
                setLastNavigationSuccess(false);
                return false;
              }
            }
          }
        }, 100);
      }
      
      return true;
    } catch (error) {
      console.error(`Error navigating to ${type}:`, error);
      setLastNavigationSuccess(false);
      return false;
    }
  }, [allVariables, caseNumberInput, data.length, dataTableRef, selectedVariableName]);

  // This function is called when the user clicks the Go button
  const handleGo = useCallback(() => {
    if (activeTab === GoToMode.CASE) {
      navigateToTarget('case');
    } else if (activeTab === GoToMode.VARIABLE) {
      navigateToTarget('variable');
    }
  }, [activeTab, navigateToTarget]);

  // This function is called when the user clicks the Close button
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return {
    activeTab,
    setActiveTab,
    caseNumberInput,
    handleCaseNumberChange,
    caseError,
    variableNames,
    selectedVariableName,
    handleSelectedVariableChange,
    variableError,
    totalCases,
    handleGo,
    handleClose,
    lastNavigationSuccess
  };
}; 