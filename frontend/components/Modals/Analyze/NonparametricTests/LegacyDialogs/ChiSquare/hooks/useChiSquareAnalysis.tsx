import { useState, useCallback } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useChiSquareWorker } from './useChiSquareWorker';
import { useDataFetching } from './useDataFetching';
import { ChiSquareAnalysisProps, ChiSquareAnalysisResult, WorkerInput } from '../types';

export const useChiSquareAnalysis = (props: ChiSquareAnalysisProps): ChiSquareAnalysisResult => {
  const { 
    selectedVariables, 
    expectedRange, 
    rangeValue, 
    expectedValue, 
    expectedValueList, 
    displayStatistics, 
    onClose 
  } = props;
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { addLog, addAnalytic, addStatistic } = useResultStore();
  const { fetchData } = useDataFetching();
  const { calculate, cancelCalculation, isCalculating } = useChiSquareWorker();
  
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
        expectedRange,
        rangeValue,
        expectedValue,
        expectedValueList,
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
      if (expectedRange.useSpecificRange) {
        logParts.push(`{CHISQUARE=${variableNames.join(" ")} (${rangeValue.lowerValue},${rangeValue.upperValue})}`);
      } else {
        logParts.push(`{CHISQUARE=${variableNames.join(" ")}}`);
      }

      if (expectedValue.allCategoriesEqual) {
        logParts.push(`{EXPECTED=EQUAL}`);
      } else {
        logParts.push(`{EXPECTED=${expectedValueList.join(" ")}}`);
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
      
      if (result.descriptives) {
        await addStatistic(analyticId, {
          title: "Descriptive Statistics",
          output_data: result.descriptives,
          components: "Descriptive Statistics",
          description: ""
        });
      }
      
      if (result.frequencies) {
        if (result.frequencies.length === 1) {
          await addStatistic(analyticId, {
            title: "Frequencies",
            output_data: result.frequencies[0],
            components: "Chi-Square Test",
            description: ""
          });
        } else {
          for (let i = 0; i < result.frequencies.length; i++) {
            await addStatistic(analyticId, {
              title: `Frequencies ${variableNames[i]}`,
              output_data: result.frequencies[i],
              components: "Chi-Square Test",
              description: ""
            });
          }
        }
      }
      
      if (result.chiSquare) {
        await addStatistic(analyticId, {
          title: "Chi-Square Test",
          output_data: result.chiSquare,
          components: "Chi-Square Test",
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
  }, [
    selectedVariables, 
    expectedRange, 
    rangeValue, 
    expectedValue, 
    expectedValueList, 
    displayStatistics, 
    calculate, 
    fetchData, 
    addLog, 
    addAnalytic, 
    addStatistic, 
    onClose
  ]);
  
  return {
    isLoading: isLoading || isCalculating,
    errorMsg,
    runAnalysis,
    cancelAnalysis: cancelCalculation
  };
};

export default useChiSquareAnalysis; 