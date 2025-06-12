import { useState, useCallback } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useOneSampleTTestWorker } from './useOneSampleTTestWorker';
import { useDataFetching } from './useDataFetching';
import { OneSampleTTestAnalysisProps, OneSampleTTestAnalysisResult, WorkerInput } from '../types';

export const useOneSampleTTestAnalysis = (props: OneSampleTTestAnalysisProps): OneSampleTTestAnalysisResult => {
  const { selectedVariables, testValue, estimateEffectSize, onClose } = props;
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { addLog, addAnalytic, addStatistic } = useResultStore();
  const { fetchData } = useDataFetching();
  const { calculate, cancelCalculation, isCalculating } = useOneSampleTTestWorker();
  
  // Perform analysis
  const runAnalysis = useCallback(async () => {
    if (selectedVariables.length === 0) {
      setErrorMsg("Please select at least one variable.");
      return;
    }
    
    setErrorMsg(null);
    setIsLoading(true);
    
    try {
      // Fetch the data
      const data = await fetchData(selectedVariables);
      
      if (!data.variableData) {
        setErrorMsg("Failed to fetch variable data.");
        setIsLoading(false);
        return;
      }
      
      // Prepare input for worker
      const workerInput: WorkerInput = {
        variableData: data.variableData,
        testValue: testValue,
        estimateEffectSize: estimateEffectSize
      };
      
      // Run the calculation
      const result = await calculate(workerInput);
      
      if (!result || !result.success) {
        throw new Error(result?.error || "Calculation failed.");
      }
      
      // Save results to database
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
      
      const logId = await addLog({ log: logMsg });
      const analyticId = await addAnalytic(logId, { title: "T-Test", note: "" });
      
      if (result.statistics) {
        await addStatistic(analyticId, {
          title: "One-Sample Statistics",
          output_data: result.statistics.output_data,
          components: "One-Sample Statistics",
          description: ""
        });
      }
      
      if (result.test) {
        await addStatistic(analyticId, {
          title: "One-Sample Test",
          output_data: result.test.output_data,
          components: "One-Sample Test",
          description: ""
        });
      }
      
      setIsLoading(false);
      if (onClose) onClose();
      
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "An unknown error occurred.");
      setIsLoading(false);
    }
  }, [selectedVariables, testValue, estimateEffectSize, calculate, fetchData, addLog, addAnalytic, addStatistic, onClose]);
  
  return {
    isLoading: isLoading || isCalculating,
    errorMsg,
    runAnalysis,
    cancelAnalysis: cancelCalculation
  };
};

export default useOneSampleTTestAnalysis; 