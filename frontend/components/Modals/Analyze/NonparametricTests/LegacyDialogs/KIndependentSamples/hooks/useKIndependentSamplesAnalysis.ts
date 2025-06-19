import { useState, useCallback } from 'react';
import { useDataFetching } from './useDataFetching';
import { useKIndependentSamplesWorker } from './useKIndependentSamplesWorker';
import { useResultStore } from '@/stores/useResultStore';
import type { KIndependentSamplesAnalysisParams } from '../types';

/**
 * Hook for orchestrating the K-Independent Samples analysis process
 * @param params Analysis parameters
 * @returns Object with functions and state for running the analysis
 */
export const useKIndependentSamplesAnalysis = (params: KIndependentSamplesAnalysisParams) => {
    const { 
        testVariables, 
        groupingVariable, 
        group1, 
        group2, 
        testType, 
        displayStatistics, 
        onClose 
    } = params;
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const { fetchData, error: dataFetchingError } = useDataFetching();
    const { calculate, cancelCalculation, error: workerError } = useKIndependentSamplesWorker();
    
    const { addLog, addAnalytic, addStatistic } = useResultStore.getState();
    
    const runAnalysis = useCallback(async () => {
        // Validation
        if (testVariables.length < 2) {
            setErrorMsg("Please select at least two test variables.");
            return;
        }
        
        if (!groupingVariable) {
            setErrorMsg("Please select a grouping variable.");
            return;
        }
        
        if (!group1 || !group2) {
            setErrorMsg("Please define grouping variable range.");
            return;
        }
        
        if (!testType.kruskalWallisH && !testType.median && !testType.jonckheereTerpstra) {
            setErrorMsg("Please select at least one test type.");
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
                groupData: data.groupData,
                group1,
                group2,
                testType,
                displayStatistics
            };
            
            // 3. Run calculation
            const results = await calculate(workerInput);
            
            // 4. Save results
            try {
                // Prepare log message
                const variableNames = testVariables.map(v => v.name);
                let logParts = ['NPAR TESTS'];
                
                // Only add tests that are enabled
                if (testType.kruskalWallisH) {
                    logParts.push(`{K-W=${variableNames.join(" ")} BY ${groupingVariable.name}(${group1} ${group2})}`);
                }
                
                if (testType.median) {
                    logParts.push(`{MEDIAN=${variableNames.join(" ")} BY ${groupingVariable.name}(${group1} ${group2})}`);
                }
                
                if (testType.jonckheereTerpstra) {
                    logParts.push(`{J-T=${variableNames.join(" ")} BY ${groupingVariable.name}(${group1} ${group2})}`);
                }
                
                if (displayStatistics.descriptive && displayStatistics.quartiles) {
                    logParts.push(`{STATISTICS DESCRIPTIVES QUARTILES}`);
                } else if (displayStatistics.descriptive) {
                    logParts.push(`{STATISTICS DESCRIPTIVES}`);
                } else if (displayStatistics.quartiles) {
                    logParts.push(`{STATISTICS QUARTILES}`);
                }
                
                // Join all parts with spaces
                let logMsg = logParts.join(' ');
                
                // If no tests are selected, provide a default message
                if (logParts.length === 1) {
                    logMsg = 'NPAR TESTS {No specific tests selected}';
                }
                
                // Save to database
                const logId = await addLog({ log: logMsg });
                const analyticId = await addAnalytic(logId, { title: "NPar Tests", note: "" });
                
                if (displayStatistics.descriptive || displayStatistics.quartiles) {
                    await addStatistic(analyticId, {
                        title: "Descriptive Statistics",
                        output_data: results.descriptives,
                        components: "Descriptive Statistics",
                        description: ""
                    });
                }
                
                if (testType.kruskalWallisH && results.ranks && results.kruskalWallisH) {
                    await addStatistic(analyticId, {
                        title: "Ranks",
                        output_data: results.ranks,
                        components: "Kruskal-Wallis Test",
                        description: ""
                    });
                    
                    await addStatistic(analyticId, {
                        title: "Test Statistics",
                        output_data: results.kruskalWallisH,
                        components: "Kruskal-Wallis Test",
                        description: ""
                    });
                }
                
                if (testType.median && results.medianFrequencies && results.medianTest) {
                    await addStatistic(analyticId, {
                        title: "Frequencies",
                        output_data: results.medianFrequencies,
                        components: "Median Test",
                        description: ""
                    });
                    
                    await addStatistic(analyticId, {
                        title: "Test Statistics",
                        output_data: results.medianTest,
                        components: "Median Test",
                        description: ""
                    });
                }
                
                if (testType.jonckheereTerpstra && results.jonckheereTerpstraTest) {
                    await addStatistic(analyticId, {
                        title: "Test Statistics",
                        output_data: results.jonckheereTerpstraTest,
                        components: "Jonckheere-Terpstra Test",
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
        group1, 
        group2, 
        testType, 
        displayStatistics, 
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