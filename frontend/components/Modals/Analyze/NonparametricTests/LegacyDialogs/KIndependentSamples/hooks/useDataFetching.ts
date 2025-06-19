import { useState } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import type { Variable } from '@/types/Variable';
import { DataFetchingResult } from '../types';

/**
 * Hook for fetching data for K-Independent Samples Test analysis
 * @returns Object with functions and state for data fetching
 */
export const useDataFetching = (): DataFetchingResult => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    /**
     * Fetch data for the specified test variables and grouping variable
     */
    const fetchData = async (testVariables: Variable[], groupingVariable: Variable) => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Prepare array to store variable data
            const variableData: { variable: Variable; data: any[] }[] = [];
            
            // Fetch test variable data one by one
            for (const variable of testVariables) {
                const data = await useDataStore.getState().getVariableData(variable);
                variableData.push({ 
                    variable, 
                    data: Array.isArray(data) ? data : [] 
                });
            }
            
            // Fetch grouping variable data
            const groupDataArray = await useDataStore.getState().getVariableData(groupingVariable);
            const groupData = {
                variable: groupingVariable,
                data: Array.isArray(groupDataArray) ? groupDataArray : []
            };
            
            setIsLoading(false);
            return { variableData, groupData };
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to fetch data. Please try again.');
            setIsLoading(false);
            throw err;
        }
    };
    
    const clearError = () => setError(null);
    
    return {
        fetchData,
        isLoading,
        error,
        clearError
    };
}; 