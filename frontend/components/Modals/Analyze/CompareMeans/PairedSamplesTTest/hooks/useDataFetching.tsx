import { useState, useCallback } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import type { Variable, VariableData } from '@/types/Variable';
import { DataFetchingProps, DataFetchingResult, FetchedData } from '../types';

export const useDataFetching = (props?: DataFetchingProps): DataFetchingResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getVariableData = useDataStore(state => state.getVariableData);

  const fetchData = useCallback(async (variables1: Variable[], variables2: Variable[]): Promise<FetchedData> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch data for both variable sets
      const variableData1 = variables1.length > 0 
        ? await Promise.all(variables1.map(variable => getVariableData(variable)))
        : null;
        
      const variableData2 = variables2.length > 0 
        ? await Promise.all(variables2.map(variable => getVariableData(variable)))
        : null;
      
      return { variableData1, variableData2 };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch variable data';
      setError(errorMessage);
      return { variableData1: null, variableData2: null };
    } finally {
      setIsLoading(false);
    }
  }, [getVariableData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    fetchData,
    clearError
  };
};

export default useDataFetching; 