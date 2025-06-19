import { useState, useCallback } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useRunsWorker } from './useRunsWorker';
import { useDataFetching } from './useDataFetching';
import { RunsAnalysisProps, RunsAnalysisResult, WorkerInput } from '../types';

export const useRunsAnalysis = (props: RunsAnalysisProps): RunsAnalysisResult => {
  const { selectedVariables, cutPoint, customValue, displayStatistics, onClose } = props;
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { addLog, addAnalytic, addStatistic } = useResultStore();
  const { fetchData } = useDataFetching();
  const { calculate, cancelCalculation, isCalculating } = useRunsWorker();
  
  // Perform analysis
  const runAnalysis = useCallback(async () => {
    if (selectedVariables.length === 0) {
      setErrorMsg("Please select at least one variable.");
      return;
    }

    if (!cutPoint.median && !cutPoint.mode && !cutPoint.mean && !cutPoint.custom) {
      setErrorMsg("Please select at least one cut point.");
      return;
    }

    if (cutPoint.custom && customValue === null) {
      setErrorMsg("Please provide a custom value.");
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
        cutPoint,
        customValue,
        displayStatistics
      };
      
      // Run the calculation
      const result = await calculate(workerInput);
      
      if (!result || !result.success) {
        throw new Error(result?.error || "Calculation failed.");
      }
      
      // Save results to database
      const variableNames = selectedVariables.map(v => v.name);
      let logParts = ['NPAR TESTS'];

      // Only add tests that are enabled
      if (cutPoint.median) {
        logParts.push(`{RUNS (MEDIAN)=${variableNames.join(" ")}}`);
      }

      if (cutPoint.mode) {
        logParts.push(`{RUNS (MODE)=${variableNames.join(" ")}}`);
      }

      if (cutPoint.mean) {
        logParts.push(`{RUNS (MEAN)=${variableNames.join(" ")}}`);
      }

      if (cutPoint.custom) {
        logParts.push(`{RUNS (${customValue})=${variableNames.join(" ")}}`);
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
      
      const logId = await addLog({ log: logMsg });
      const analyticId = await addAnalytic(logId, { title: "NPar Tests", note: "" });
      
      if (result.descriptives && (displayStatistics.descriptive || displayStatistics.quartiles)) {
        await addStatistic(analyticId, {
          title: "Descriptive Statistics",
          output_data: result.descriptives.output_data,
          components: "Descriptive Statistics",
          description: ""
        });
      }
      
      let i = 0;
      if (cutPoint.median && result.runsMedian) {
        i++;
        await addStatistic(analyticId, {
          title: i === 1 ? "Runs Test" : `Runs Test ${i}`,
          output_data: result.runsMedian.output_data,
          components: i === 1 ? "Runs Test" : `Runs Test ${i}`,
          description: ""
        });
      }
      
      if (cutPoint.mean && result.runsMean) {
        i++;
        await addStatistic(analyticId, {
          title: i === 1 ? "Runs Test" : `Runs Test ${i}`,
          output_data: result.runsMean.output_data,
          components: i === 1 ? "Runs Test" : `Runs Test ${i}`,
          description: ""
        });
      }
      
      if (cutPoint.mode && result.runsMode) {
        i++;
        await addStatistic(analyticId, {
          title: i === 1 ? "Runs Test" : `Runs Test ${i}`,
          output_data: result.runsMode.output_data,
          components: i === 1 ? "Runs Test" : `Runs Test ${i}`,
          description: ""
        });
      }
      
      if (cutPoint.custom && result.runsCustom) {
        i++;
        await addStatistic(analyticId, {
          title: i === 1 ? "Runs Test" : `Runs Test ${i}`,
          output_data: result.runsCustom.output_data,
          components: i === 1 ? "Runs Test" : `Runs Test ${i}`,
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
  }, [selectedVariables, cutPoint, customValue, displayStatistics, calculate, fetchData, addLog, addAnalytic, addStatistic, onClose]);
  
  return {
    isLoading: isLoading || isCalculating,
    errorMsg,
    runAnalysis,
    cancelAnalysis: cancelCalculation
  };
};

export default useRunsAnalysis; 