import { useState, useCallback } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import type { Variable } from '@/types/Variable';
import { DataFetchingProps, DataFetchingResult, FetchedData } from '../types';

export const useDataFetching = (props?: DataFetchingProps): DataFetchingResult => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch data for the specified variables
  const fetchData = useCallback(async (variables: Variable[]): Promise<FetchedData> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const dataPromises = variables.map(variable => 
        useDataStore.getState().getVariableData(variable)
      );
      
      const variableData = await Promise.all(dataPromises);
      
      return {
        variableData: variableData
      };
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred while fetching data');
      return {
        variableData: null
      };
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Function to clear any errors
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