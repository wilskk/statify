import { useState, useCallback } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useMetaStore } from '@/stores/useMetaStore';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable, VariableData } from '@/types/Variable';

interface UseFetchDataResult {
  isLoading: boolean;
  error: string | null;
  fetchData: (variables: Variable[]) => Promise<{
    variableData: VariableData[] | null;
    weightVariableData: (string | number)[] | null;
  }>;
  clearError: () => void;
}

export const useDataFetching = (): UseFetchDataResult => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchData = useCallback(async (variables: Variable[]) => {
    if (variables.length === 0) {
      setError("Please select at least one variable.");
      return { variableData: null, weightVariableData: null };
    }

    setIsLoading(true);
    clearError();

    try {
      // Fetch variable data
      const variableDataPromises = variables.map(varDef =>
        useDataStore.getState().getVariableData(varDef)
      );
      const fetchedVariableData: VariableData[] = await Promise.all(variableDataPromises);

      // Check for weight variable
      const weightVariableName = useMetaStore.getState().meta.weight;
      let weightVariableData: (string | number)[] | null = null;
      
      if (weightVariableName) {
        const weightVariable = useVariableStore.getState().getVariableByName(weightVariableName);
        if (weightVariable) {
          try {
            const weightDataResult = await useDataStore.getState().getVariableData(weightVariable);
            weightVariableData = weightDataResult.data;
          } catch (err) {
            console.error(`Error fetching data for weight variable "${weightVariableName}":`, err);
            setError(`Could not fetch data for the weight variable "${weightVariableName}". Analysis aborted.`);
            setIsLoading(false);
            return { variableData: null, weightVariableData: null };
          }
        } else {
          console.warn(`Weight variable "${weightVariableName}" is set in meta, but not found in variable definitions.`);
          // Continue without weights if definition not found
        }
      }

      setIsLoading(false);
      return { variableData: fetchedVariableData, weightVariableData };

    } catch (error) {
      console.error("Error fetching data:", error);
      setError(`An error occurred while fetching data: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoading(false);
      return { variableData: null, weightVariableData: null };
    }
  }, [clearError]);

  return {
    isLoading,
    error,
    fetchData,
    clearError
  };
}; 