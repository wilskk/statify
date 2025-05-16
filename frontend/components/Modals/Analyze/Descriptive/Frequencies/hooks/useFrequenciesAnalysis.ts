import { useState, useCallback, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import type { Variable } from '@/types/Variable';
import type { 
  StatisticsOptions, 
  ChartOptions, 
  FrequenciesAnalysisParams,
  FrequenciesResults,
  RawFrequencyData
} from '../types';
import { useDataFetching } from './useDataFetching';
import { useFrequenciesWorker } from './useFrequenciesWorker';
import { formatFrequencyTable } from '../utils';

export interface FrequenciesAnalysisResult {
  isLoading: boolean;
  errorMsg: string | null;
  runAnalysis: () => Promise<void>;
  cancelAnalysis: () => void;
}

export const useFrequenciesAnalysis = ({
    selectedVariables,
    showFrequencyTables,
    showStatistics,
    statisticsOptions,
  showCharts,
  chartOptions,
    onClose,
}: FrequenciesAnalysisParams): FrequenciesAnalysisResult => {
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const { addLog, addAnalytic, addStatistic } = useResultStore();
  
  // Use the data fetching hook
  const { fetchData, error: fetchError, isLoading: isFetching } = useDataFetching();
  
  // Use the worker hook
  const { calculate, error: workerError, isCalculating, cancelCalculation } = useFrequenciesWorker();

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

  const runAnalysis = useCallback(async () => {
    if (selectedVariables.length === 0) {
      setErrorMsg("Please select at least one variable.");
      return;
    }
    
    setErrorMsg(null);

    try {
      // Use the data fetching hook to fetch variable data
      const { variableData, weightVariableData } = await fetchData(selectedVariables);
      
      // Check if data fetching was successful
      if (!variableData) {
        // Error already set by fetchData
        return;
      }

      // Determine which calculations to run
      const calculateFrequencies = showFrequencyTables;
      const calculateDescriptives = showStatistics && statisticsOptions !== null;

      if (!calculateFrequencies && !calculateDescriptives) {
        setErrorMsg("Please select at least one analysis option (Frequency Tables or Statistics).");
        return;
      }

      // Use the worker hook to calculate statistics
      const result = await calculate(
        {
          variableData, 
          weightVariableData,
          statisticsOptions,
          chartOptions
        },
        {
          calculateFrequencies,
          calculateDescriptives
        }
      );

      // Check if calculation was successful
      if (!result) {
        // Error already set by worker hook
        return;
      }

      // Process the successful result
                try {
                    const variableNames = selectedVariables.map(v => v.name);
                    const executedActions = [];

        if (result.frequencies) executedActions.push("Frequencies");
        if (result.descriptive) executedActions.push("Statistics");

                    if (executedActions.length === 0) {
                         console.warn("Workers finished, but no results were generated.");
          setErrorMsg("Analysis completed but produced no output.");
          return;
                    }

                    const logMsg = `${executedActions.join(' & ').toUpperCase()} VARIABLES=${variableNames.join(", ")}`;
                    const logId = await addLog({ log: logMsg });

                    const analyticId = await addAnalytic(logId, {
                        title: executedActions.join(' & '),
                        note: `Analysis performed on: ${variableNames.join(", ")}`
                    });

        const statisticsToAdd: any[] = [];

        // Add Descriptive Statistics
        if (result.descriptive) {
                        statisticsToAdd.push({
            title: result.descriptive.title,
            output_data: JSON.stringify(result.descriptive.output_data),
            components: result.descriptive.components,
            description: result.descriptive.description
          });
        }

        // Format and add Frequency Tables
        if (result.frequencies && Array.isArray(result.frequencies)) {
          for (const rawFrequencyData of result.frequencies) {
            // Use the formatter utility to convert raw data to table format
            const formattedTable = formatFrequencyTable(rawFrequencyData as RawFrequencyData);
            
                            statisticsToAdd.push({
              title: formattedTable.title,
              output_data: JSON.stringify({ tables: [formattedTable] }),
              components: formattedTable.components,
              description: formattedTable.description
            });
          }
        }

        // Add all statistics to the result store
                    for (const stat of statisticsToAdd) {
                        await addStatistic(analyticId, stat);
                    }

                    onClose(); // Close modal on success
                } catch (err) {
        console.error("Error saving frequencies results:", err);
        setErrorMsg("An error occurred while saving the analysis results.");
      }
    } catch (error) {
      console.error("Error in frequencies analysis:", error);
      setErrorMsg(`An error occurred during analysis: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [
    selectedVariables, 
    showFrequencyTables, 
    showStatistics, 
    statisticsOptions, 
    showCharts, 
    chartOptions, 
    onClose, 
    addLog, 
    addAnalytic, 
    addStatistic, 
    fetchData, 
    calculate
  ]);

  // Calculate combined loading state
  const isLoading = isFetching || isCalculating;

  return { 
    isLoading, 
    errorMsg, 
    runAnalysis,
    cancelAnalysis: cancelCalculation
  };
}; 