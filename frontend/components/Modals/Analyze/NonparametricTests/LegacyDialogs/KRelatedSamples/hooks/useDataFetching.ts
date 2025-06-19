import { useState, useCallback } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import type { Variable } from '@/types/Variable';
import { DataFetchingResult } from '../types';

export const useDataFetching = (): DataFetchingResult => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);

    const fetchData = useCallback(async (testVariables: Variable[]) => {
        setIsLoading(true);
        setError(undefined);

        try {
            if (testVariables.length < 2) {
                throw new Error("At least two test variables are required");
            }

            // Fetch data for each test variable
            const variableDataPromises = testVariables.map(variable => 
                useDataStore.getState().getVariableData(variable)
                    .then(data => ({ variable, data }))
            );

            const variableData = await Promise.all(variableDataPromises);
            
            setIsLoading(false);
            return { variableData };
        } catch (error) {
            setIsLoading(false);
            const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching data';
            setError(errorMessage);
            throw error;
        }
    }, []);

    const clearError = useCallback(() => {
        setError(undefined);
    }, []);

    return {
        fetchData,
        isLoading,
        error,
        clearError
    };
}; 