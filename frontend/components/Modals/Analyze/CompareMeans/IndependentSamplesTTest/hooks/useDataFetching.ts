import { useState, useCallback } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import type { Variable } from '@/types/Variable';
import type { DataFetchingResult } from '../types';

/**
 * Hook for fetching variable data in the Independent Samples T-Test component
 * @returns Object with functions and state for data fetching
 */
export const useDataFetching = (): DataFetchingResult => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);
    
    const fetchData = useCallback(async (
        testVariables: Variable[], 
        groupingVariable: Variable
    ): Promise<{
        variableData: {
            variable: Variable;
            data: any[];
        }[];
        groupData: {
            variable: Variable;
            data: any[];
        } | null;
    }> => {
        if (testVariables.length === 0) {
            setError("Please select at least one test variable.");
            return { 
                variableData: [], 
                groupData: null 
            };
        }

        if (!groupingVariable) {
            setError("Please select a grouping variable.");
            return { 
                variableData: [], 
                groupData: null 
            };
        }

        setIsLoading(true);
        setError(null);
        
        try {
            // 1. Prepare test variable data
            const variableDataPromises = testVariables.map(variable => 
                useDataStore.getState().getVariableData(variable)
            );
            const variableDataResults = await Promise.all(variableDataPromises);
            
            // 2. Prepare grouping variable data
            const groupDataResult = await useDataStore.getState().getVariableData(groupingVariable);
            
            // 3. Format the data for the worker - extract the data array from the results
            const variableData = variableDataResults.map((result, index) => ({
                variable: testVariables[index],
                data: result.data
            }));
            
            setIsLoading(false);
            return {
                variableData,
                groupData: {
                    variable: groupingVariable,
                    data: groupDataResult.data
                }
            };
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(`An error occurred while fetching data: ${error instanceof Error ? error.message : String(error)}`);
            setIsLoading(false);
            throw error;
        }
    }, []);
    
    return {
        fetchData,
        isLoading,
        error,
        clearError
    };
}; 