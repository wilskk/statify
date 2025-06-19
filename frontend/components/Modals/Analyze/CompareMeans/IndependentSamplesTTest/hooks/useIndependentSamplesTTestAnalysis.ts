import { useState, useCallback } from 'react';
import { useDataFetching } from './useDataFetching';
import { useTTestWorker } from './useTTestWorker';
import { useResultStore } from '@/stores/useResultStore';
import type { IndependentSamplesTTestAnalysisParams } from '../types';

/**
 * Hook for orchestrating the Independent Samples T-Test analysis process
 * @param params Analysis parameters
 * @returns Object with functions and state for running the analysis
 */
export const useIndependentSamplesTTestAnalysis = (params: IndependentSamplesTTestAnalysisParams) => {
    const { 
        testVariables, 
        groupingVariable, 
        defineGroups, 
        group1, 
        group2, 
        cutPointValue, 
        estimateEffectSize, 
        onClose 
    } = params;
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const { fetchData, error: dataFetchingError } = useDataFetching();
    const { calculate, cancelCalculation, error: workerError } = useTTestWorker();
    
    const { addLog, addAnalytic, addStatistic } = useResultStore.getState();
    
    const runAnalysis = useCallback(async () => {
        // Validation
        if (testVariables.length === 0) {
            setErrorMsg("Please select at least one test variable.");
            return;
        }
        
        if (!groupingVariable) {
            setErrorMsg("Please select a grouping variable.");
            return;
        }
        
        if ((defineGroups.useSpecifiedValues && (!group1 || !group2)) || 
            (defineGroups.cutPoint && !cutPointValue)) {
            setErrorMsg("Please define grouping variable.");
            return;
        }
        
        setErrorMsg(null);
        setIsLoading(true);
        
        try {
            // 1. Fetch data
            const data = await fetchData(testVariables, groupingVariable);
            
            if (dataFetchingError) {
                setErrorMsg(dataFetchingError);
                setIsLoading(false);
                return;
            }
            
            // 2. Prepare worker input
            const workerInput = {
                variableData: data.variableData,
                groupData: data.groupData!,
                defineGroups,
                group1,
                group2,
                cutPointValue,
                estimateEffectSize
            };
            
            // 3. Run calculation
            const results = await calculate(workerInput);
            
            // 4. Save results
            try {
                // Prepare log message
                const variableNames = testVariables.map(v => v.name);
                let logParts = ["T-TEST"];
                
                if (defineGroups.useSpecifiedValues) {
                    logParts.push(`GROUPS=${groupingVariable.name}(${group1} ${group2}) {${variableNames.join(" ")}}`);
                } else {
                    logParts.push(`GROUPS=${groupingVariable.name}(${cutPointValue}) {${variableNames.join(" ")}}`);
                }
                
                // Add options
                if (estimateEffectSize) {
                    logParts.push(`{ES DISPLAY (TRUE)}`);
                } else {
                    logParts.push(`{ES DISPLAY (FALSE)}`);
                }
                
                logParts.push(`{CRITERIA=0.95}`);
                
                // Join all parts with spaces
                let logMsg = logParts.join(' ');
                
                // Save to database
                const logId = await addLog({ log: logMsg });
                const analyticId = await addAnalytic(logId, { title: "T-Test", note: "" });
                
                if (results.group) {
                    await addStatistic(analyticId, {
                        title: "Group Statistics",
                        output_data: results.group,
                        components: "Group Statistics",
                        description: ""
                    });
                }
                
                if (results.test) {
                    await addStatistic(analyticId, {
                        title: "Independent Samples Test",
                        output_data: results.test,
                        components: "Independent Samples Test",
                        description: ""
                    });
                }
                
                onClose();
            } catch (err) {
                console.error(err);
                setErrorMsg("Error saving results.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(workerError || "An error occurred during analysis.");
        } finally {
            setIsLoading(false);
        }
    }, [
        testVariables, 
        groupingVariable, 
        defineGroups, 
        group1, 
        group2, 
        cutPointValue, 
        estimateEffectSize, 
        fetchData, 
        calculate, 
        addLog, 
        addAnalytic, 
        addStatistic, 
        onClose,
        dataFetchingError,
        workerError
    ]);
    
    return {
        isLoading,
        errorMsg,
        runAnalysis,
        cancelAnalysis: cancelCalculation
    };
}; 