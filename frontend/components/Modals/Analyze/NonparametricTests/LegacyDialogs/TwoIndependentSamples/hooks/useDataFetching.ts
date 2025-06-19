import { useState, useCallback } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import type { Variable } from '@/types/Variable';
import { DataFetchingResult } from '../types';

export const useDataFetching = (): DataFetchingResult => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const dataStore = useDataStore();

    const fetchData = useCallback(async (
        testVariables: Variable[], 
        groupingVariable: Variable
    ) => {
        setIsLoading(true);
        setError(undefined);

        try {
            // Fetch test variable data
            const variableDataPromises = testVariables.map(async (variable) => {
                const data = await dataStore.getVariableData(variable);
                return { variable, data };
            });

            // Fetch grouping variable data
            const groupData = await dataStore.getVariableData(groupingVariable)
                .then(data => ({ variable: groupingVariable, data }));

            // Wait for all test variable data to be fetched
            const variableData = await Promise.all(variableDataPromises);

            setIsLoading(false);
            return { variableData, groupData };
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
            setIsLoading(false);
            throw err;
        }
    }, [dataStore]);

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