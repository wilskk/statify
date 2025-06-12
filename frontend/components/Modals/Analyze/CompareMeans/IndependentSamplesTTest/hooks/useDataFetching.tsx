import { useState, useCallback } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import type { Variable } from '@/types/Variable';
import { DataFetchingProps, DataFetchingResult, FetchedData } from '../types';

export const useDataFetching = (props?: DataFetchingProps): DataFetchingResult => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch data for the specified variables and grouping variable
  const fetchData = useCallback(async (variables: Variable[], groupVariable: Variable): Promise<FetchedData> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch test variables data
      const variableDataPromises = variables.map(variable => 
        useDataStore.getState().getVariableData(variable)
      );
      
      // Fetch grouping variable data
      const groupDataPromise = useDataStore.getState().getVariableData(groupVariable);
      
      // Wait for all data to be fetched
      const [variableData, groupData] = await Promise.all([
        Promise.all(variableDataPromises),
        groupDataPromise
      ]);
      
      return {
        variableData: variableData,
        groupData: groupData
      };
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred while fetching data');
      return {
        variableData: null,
        groupData: null
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