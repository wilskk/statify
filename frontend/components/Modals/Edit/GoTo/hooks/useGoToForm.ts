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
  // const variableTableRef = useTableRefStore((state) => state.variableTableRef); // For future use if navigating variable view

  const [activeTab, setActiveTab] = useState<string>(defaultMode);
  const [caseNumberInput, setCaseNumberInput] = useState<string>('1');
  const [caseError, setCaseError] = useState<string>('');
  const [variableNames, setVariableNames] = useState<string[]>([]);
  const [selectedVariableName, setSelectedVariableName] = useState<string>('');
  const [variableError, setVariableError] = useState<string>('');
  const [totalCases, setTotalCases] = useState<number>(0);

  useEffect(() => {
    const names = allVariables.sort((a,b) => a.columnIndex - b.columnIndex).map(v => v.name);
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

  const handleGo = useCallback(() => {
    const hotInstance = dataTableRef?.current?.hotInstance;
    if (!hotInstance) {
      console.error("Handsontable instance not available.");
      // Optionally set a general error to display in the modal
      return;
    }

    if (activeTab === GoToMode.CASE) {
      if (caseNumberInput === '' || !/^[1-9][0-9]*$/.test(caseNumberInput) || parseInt(caseNumberInput, 10) > totalCases) {
        setCaseError(`Please enter a valid case number (1-${totalCases}).`);
        return;
      }
      const rowIndex = parseInt(caseNumberInput, 10) - 1; // 0-indexed
      hotInstance.selectCell(rowIndex, 0, rowIndex, 0, true, false); // Select the first cell of the row
      hotInstance.scrollViewportTo(rowIndex, 0, true, true);
      console.log(`Go to case number: ${caseNumberInput}`);
    } else if (activeTab === GoToMode.VARIABLE) {
      if (!selectedVariableName) {
        setVariableError('Please select a variable.');
        return;
      }
      const variable = allVariables.find(v => v.name === selectedVariableName);
      if (!variable) {
        setVariableError('Selected variable not found.');
        return;
      }
      const columnIndex = variable.columnIndex;
      hotInstance.selectCell(0, columnIndex, 0, columnIndex, true, false); // Select the first cell of the column
      hotInstance.scrollViewportTo(0, columnIndex, true, true);
      console.log(`Go to variable: ${selectedVariableName} (column ${columnIndex})`);
    }
    onClose(); // Close modal after action
  }, [activeTab, caseNumberInput, totalCases, selectedVariableName, allVariables, dataTableRef, onClose]);

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
  };
}; 