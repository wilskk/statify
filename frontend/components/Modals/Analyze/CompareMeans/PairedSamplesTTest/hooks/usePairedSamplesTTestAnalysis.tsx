import { useState, useCallback } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useDataFetching } from './useDataFetching';
import { usePairedSamplesTTestWorker } from './usePairedSamplesTTestWorker';
import { PairedSamplesTTestAnalysisProps, PairedSamplesTTestAnalysisResult } from '../types';

export const usePairedSamplesTTestAnalysis = (props: PairedSamplesTTestAnalysisProps): PairedSamplesTTestAnalysisResult => {
  const { 
    testVariables1, 
    testVariables2, 
    calculateStandardizer, 
    estimateEffectSize, 
    areAllPairsValid, 
    hasDuplicatePairs, 
    onClose 
  } = props;
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { addLog, addAnalytic, addStatistic } = useResultStore();
  const { fetchData } = useDataFetching();
  const { calculate, cancelCalculation, isCalculating } = usePairedSamplesTTestWorker();
  
  // Perform analysis
  const runAnalysis = useCallback(async () => {
    if (testVariables1.length === 0 || testVariables2.length === 0) {
      setErrorMsg("Please select at least one pair of variables.");
      return;
    }
    
    if (!areAllPairsValid()) {
      setErrorMsg("All pairs must have both variables selected.");
      return;
    }
    
    if (hasDuplicatePairs()) {
      setErrorMsg("Duplicate pairs are not allowed.");
      return;
    }
    
    if (!calculateStandardizer.standardDeviation && 
        !calculateStandardizer.correctedStandardDeviation && 
        !calculateStandardizer.averageOfVariances) {
      setErrorMsg("Please select at least one standardizer calculation method.");
      return;
    }
    
    setErrorMsg(null);
    setIsLoading(true);
    
    try {
      // Fetch the data
      const data = await fetchData(testVariables1, testVariables2);
      
      if (!data.variableData1 || !data.variableData2) {
        setErrorMsg("Failed to fetch variable data.");
        setIsLoading(false);
        return;
      }
      
      // Prepare input for worker
      const workerInput = {
        variableData1: data.variableData1,
        variableData2: data.variableData2,
        calculateStandardizer,
        estimateEffectSize
      };
      
      // Run the calculation with the mock worker
      const result = await calculate(workerInput);
      
      if (!result || !result.success) {
        throw new Error(result?.error || "Calculation failed.");
      }
      
      // Save results to database
      const pairNames = testVariables1.map((v, i) => 
        `(${v.name} WITH ${testVariables2[i]?.name || 'undefined'})`
      );
      
      let logParts = [`T-TEST PAIRS=${pairNames.join(" ")}`];
      
      if (estimateEffectSize) {
        logParts.push(`{ES DISPLAY (TRUE)}`);
      } else {
        logParts.push(`{ES DISPLAY (FALSE)}`);
      }
      
      // Add standardizer options
      logParts.push(`{STANDARDIZER=`);
      if (calculateStandardizer.standardDeviation) {
        logParts.push(`SD`);
      } else if (calculateStandardizer.correctedStandardDeviation) {
        logParts.push(`CSD`);
      } else if (calculateStandardizer.averageOfVariances) {
        logParts.push(`AOV`);
      }
      logParts.push(`}`);
      
      logParts.push(`{CRITERIA=0.95}`);
      
      // Join all parts with spaces
      let logMsg = logParts.join(' ');
      
      const logId = await addLog({ log: logMsg });
      const analyticId = await addAnalytic(logId, { title: "Paired-Samples T-Test", note: "" });
      
      // Add the statistics to the database
      if (result.statistics) {
        await addStatistic(analyticId, {
          title: "Paired Samples Statistics",
          output_data: JSON.stringify(result.statistics.output_data),
          components: "Paired Samples Statistics",
          description: ""
        });
      }
      
      if (result.correlations) {
        await addStatistic(analyticId, {
          title: "Paired Samples Correlations",
          output_data: JSON.stringify(result.correlations.output_data),
          components: "Paired Samples Correlations",
          description: ""
        });
      }
      
      if (result.test) {
        await addStatistic(analyticId, {
          title: "Paired Samples Test",
          output_data: JSON.stringify(result.test.output_data),
          components: "Paired Samples Test",
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
    testVariables1, 
    testVariables2, 
    calculateStandardizer, 
    estimateEffectSize, 
    areAllPairsValid, 
    hasDuplicatePairs, 
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

export default usePairedSamplesTTestAnalysis; 