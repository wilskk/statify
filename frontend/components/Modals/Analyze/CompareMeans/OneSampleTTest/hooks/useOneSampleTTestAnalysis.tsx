import { useState, useCallback, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useOneSampleTTestWorker } from './useOneSampleTTestWorker';
import { useDataFetching } from './useDataFetching';
import { OneSampleTTestAnalysisProps, OneSampleTTestAnalysisResult, WorkerInput } from '../types';

/**
 * Hook for performing One-Sample T-Test analysis
 * 
 * @param props - Analysis properties
 * @returns Analysis result object
 */
export const useOneSampleTTestAnalysis = (props: OneSampleTTestAnalysisProps): OneSampleTTestAnalysisResult => {
  const { selectedVariables, testValue, estimateEffectSize, onClose } = props;
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { addLog, addAnalytic, addStatistic } = useResultStore();
  
  // Use the data fetching hook
  const { fetchData, error: fetchError, isLoading: isFetching } = useDataFetching();
  
  // Use the worker hook
  const { calculate, error: workerError, cancelCalculation, isCalculating } = useOneSampleTTestWorker();
  
  // Sync fetch error and worker error to our error state
  useEffect(() => {
    if (fetchError) {
      setErrorMsg(fetchError);
    } else if (workerError) {
      setErrorMsg(workerError);
    } else {
      setErrorMsg(null);
    }
  }, [fetchError, workerError]);

  /**
   * Run the One-Sample T-Test analysis
   */
  const runAnalysis = useCallback(async () => {
    if (selectedVariables.length === 0) {
      setErrorMsg("Please select at least one variable.");
      return;
    }
    
    setErrorMsg(null);
    setIsLoading(true);
    
    try {
      // Fetch the data
      const { variableData } = await fetchData(selectedVariables);
      
      if (!variableData) {
        setErrorMsg("Failed to fetch variable data.");
        setIsLoading(false);
        return;
      }
      
      // Prepare input for worker
      const workerInput: WorkerInput = {
        variableData,
        testValue,
        estimateEffectSize
      };
      
      // Run the calculation
      const result = await calculate(workerInput);
      
      if (!result || !result.success) {
        throw new Error(result?.error || "Calculation failed.");
      }
      
      // Save results to database
      try {
        // Build the log message
        const variableNames = selectedVariables.map(v => v.name);
        let logParts = [`T-TEST {TESTVAL=${testValue}} {VARIABLES=${variableNames.join(" ")}}`];
        
        if (estimateEffectSize) {
          logParts.push(`{ES DISPLAY (TRUE)}`);
        } else {
          logParts.push(`{ES DISPLAY (FALSE)}`);
        }
        
        logParts.push(`{CRITERIA=0.95}`);
        
        // Join all parts with spaces
        let logMsg = logParts.join(' ');
        
        // Add log entry
        const logId = await addLog({ log: logMsg });
        
        // Add analytic entry
        const analyticId = await addAnalytic(logId, { 
          title: "One-Sample T-Test", 
          note: `Test value = ${testValue}` 
        });
        
        // Add statistics tables
        if (result.statistics) {
          await addStatistic(analyticId, {
            title: result.statistics.title,
            output_data: result.statistics.output_data,
            components: result.statistics.components,
            description: result.statistics.description
          });
        }
        
        if (result.test) {
          await addStatistic(analyticId, {
            title: result.test.title,
            output_data: result.test.output_data,
            components: result.test.components,
            description: result.test.description
          });
        }
        
        // Close modal on success
        if (onClose) onClose();
      } catch (saveError) {
        console.error("Error saving analysis results:", saveError);
        setErrorMsg(`Analysis completed but failed to save results: ${saveError instanceof Error ? saveError.message : String(saveError)}`);
      }
    } catch (error) {
      console.error("Error in One-Sample T-Test analysis:", error);
      setErrorMsg(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedVariables, testValue, estimateEffectSize, calculate, fetchData, addLog, addAnalytic, addStatistic, onClose]);
  
  // Calculate combined loading state
  const isAnalysisLoading = isLoading || isFetching || isCalculating;
  
  return {
    isLoading: isAnalysisLoading,
    errorMsg,
    runAnalysis,
    cancelAnalysis: cancelCalculation
  };
};

export default useOneSampleTTestAnalysis; 