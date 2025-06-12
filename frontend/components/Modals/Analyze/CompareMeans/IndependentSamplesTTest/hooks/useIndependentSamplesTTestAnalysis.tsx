import { useState, useCallback } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useIndependentSamplesTTestWorker } from './useIndependentSamplesTTestWorker';
import { useDataFetching } from './useDataFetching';
import { 
  IndependentSamplesTTestAnalysisProps, 
  IndependentSamplesTTestAnalysisResult, 
  WorkerInput 
} from '../types';

export const useIndependentSamplesTTestAnalysis = (props: IndependentSamplesTTestAnalysisProps): IndependentSamplesTTestAnalysisResult => {
  const { 
    selectedVariables, 
    groupingVariable, 
    defineGroups, 
    group1, 
    group2, 
    cutPointValue, 
    estimateEffectSize, 
    onClose 
  } = props;
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { addLog, addAnalytic, addStatistic } = useResultStore();
  const { fetchData } = useDataFetching();
  const { calculate, cancelCalculation, isCalculating } = useIndependentSamplesTTestWorker();
  
  // Perform analysis
  const runAnalysis = useCallback(async () => {
    // Validation
    if (selectedVariables.length === 0) {
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
      // Fetch the data
      const data = await fetchData(selectedVariables, groupingVariable);
      
      if (!data.variableData || !data.groupData) {
        setErrorMsg("Failed to fetch variable data.");
        setIsLoading(false);
        return;
      }
      
      // Prepare input for worker
      const workerInput: WorkerInput = {
        variableData: data.variableData,
        groupData: data.groupData,
        defineGroups: defineGroups,
        group1: group1,
        group2: group2,
        cutPointValue: cutPointValue,
        estimateEffectSize: estimateEffectSize
      };
      
      // Run the calculation
      const result = await calculate(workerInput);
      
      if (!result || !result.success) {
        throw new Error(result?.error || "Calculation failed.");
      }
      
      // Save results to database
      const variableNames = selectedVariables.map(v => v.name);
      let logParts = ["T-TEST"];

      if (defineGroups.useSpecifiedValues) {
        logParts.push(`GROUPS=${groupingVariable.name}(${group1} ${group2}) {${variableNames.join(" ")}}`);
      } else {
        logParts.push(`GROUPS=${groupingVariable.name}(${cutPointValue}) {${variableNames.join(" ")}}`);
      }

      // Only add tests that are enabled
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
      
      if (result.group) {
        await addStatistic(analyticId, {
          title: "Group Statistics",
          output_data: result.group.output_data,
          components: "Group Statistics",
          description: ""
        });
      }
      
      if (result.test) {
        await addStatistic(analyticId, {
          title: "Independent Samples Test",
          output_data: result.test.output_data,
          components: "Independent Samples Test",
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
    groupingVariable, 
    defineGroups, 
    group1, 
    group2, 
    cutPointValue, 
    estimateEffectSize, 
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

export default useIndependentSamplesTTestAnalysis; 