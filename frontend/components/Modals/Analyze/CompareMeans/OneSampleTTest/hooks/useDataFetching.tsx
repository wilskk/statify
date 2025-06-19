import { useState, useCallback } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { Variable } from '@/types/Variable';
import { DataFetchingResult, FetchedData } from '../types';

/**
 * Hook for fetching data for One-Sample T-Test analysis
 * 
 * @returns Data fetching result object
 */
export const useDataFetching = (): DataFetchingResult => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Clear any error messages
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Fetch data for the specified variables
   * 
   * @param variables - Array of variables to fetch data for
   * @returns Object containing the fetched variable data
   */
  const fetchData = useCallback(async (variables: Variable[]): Promise<FetchedData> => {
    if (variables.length === 0) {
      setError("Please select at least one variable.");
      return { variableData: null };
    }

    setIsLoading(true);
    clearError();
    
    try {
      // Fetch variable data
      const variableDataPromises = variables.map(varDef =>
        useDataStore.getState().getVariableData(varDef)
      );
      const fetchedVariableData = await Promise.all(variableDataPromises);

      // Check if any variable has no valid data
      for (let i = 0; i < fetchedVariableData.length; i++) {
        const varData = fetchedVariableData[i];
        const validValues = varData.data.filter(val => 
          val !== null && val !== undefined && val !== ""
        );
        
        if (validValues.length === 0) {
          setError(`Variable "${variables[i].name}" has no valid data.`);
          setIsLoading(false);
          return { variableData: null };
        }
      }
      
      setIsLoading(false);
      return {
        variableData: fetchedVariableData
      };
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`An error occurred while fetching data: ${err instanceof Error ? err.message : String(err)}`);
      setIsLoading(false);
      return {
        variableData: null
      };
    }
  }, [clearError]);
  
  return {
    isLoading,
    error,
    fetchData,
    clearError
  };
};

export default useDataFetching; 