import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
  OneSampleTTestAnalysisProps,
  OneSampleTTestResults,
  OneSampleTTestResult
} from '../types';

import {
  formatOneSampleTestTable,
  formatOneSampleStatisticsTable
} from '../utils/formatters'

export const useOneSampleTTestAnalysis = ({
  testVariables,
  testValue,
  estimateEffectSize,
  onClose
}: OneSampleTTestAnalysisProps) => {
  const { addLog, addAnalytic, addStatistic } = useResultStore();
  const { data: analysisData } = useAnalysisData();

  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);

  const resultsRef = useRef<OneSampleTTestResult[]>([]);
  const errorCountRef = useRef<number>(0);
  const processedCountRef = useRef<number>(0);

  const runAnalysis = useCallback(async () => {
    if (testVariables.length === 0) {
      setErrorMsg("Please select at least one variable.");
      return;
    }
    
    setErrorMsg(null);
    setIsCalculating(true);

    try {
      await useDataStore.getState().checkAndSave();
    } catch (e: any) {
      setErrorMsg(`Failed to save pending changes: ${e.message}`);
      setIsCalculating(false);
      return;
    }

    // Reset refs for new analysis run
    resultsRef.current = [];
    errorCountRef.current = 0;
    processedCountRef.current = 0;

    const worker = new Worker('/workers/CompareMeans/manager.js', { type: 'module' });
    workerRef.current = worker;

    let analysisTypes;
    if (estimateEffectSize) {
        // analysisTypes = ['oneSampleTTest', 'oneSampleTTestEffectSize'];
        analysisTypes = ['oneSampleTTest'];
    } else {
        analysisTypes = ['oneSampleTTest'];
    }

    testVariables.forEach(variable => {
      const dataForVar = analysisData.map(row => row[variable.columnIndex]);
      const payload = {
        analysisType: analysisTypes,
        variable,
        data: dataForVar,
        options: { testValue, estimateEffectSize }
      };
      worker.postMessage(payload);
    });

    worker.onmessage = async (event) => {
      const { variableName, results, status, error: workerError } = event.data;

      if (status === 'success' && results) {
        if (results.oneSampleStatistics) {
          const { variable, N, Mean, StdDev, SEMean } = results.oneSampleStatistics;

          if (variable && N && Mean && StdDev && SEMean) {
            resultsRef.current.push({
              variable,
              stats: {
                N,
                Mean,
                StdDev,
                SEMean
              }
            });
          } else {
            console.error(`Error processing oneSampleStatistics for ${variableName}:`, workerError);
            const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
            setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
            errorCountRef.current += 1;
          }
        }

        if (results.oneSampleTest) {
          const { variable, T, DF, PValue, MeanDifference, Lower, Upper } = results.oneSampleTest;
          
          if (variable && T && DF && PValue !== null && MeanDifference && Lower && Upper) {
            resultsRef.current.push({
              variable,
              testValue,
              stats: {
                T,
                DF,
                PValue,
                MeanDifference,
                Lower,
                Upper
              }
            });
          } else {
            console.error(`Error processing oneSampleTest for ${variableName}:`, workerError);
            const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
            setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
            errorCountRef.current += 1;
          }
        }
      } else {
        console.error(`Error processing ${variableName}:`, workerError);
        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
        errorCountRef.current += 1;
      }

      processedCountRef.current++;

      if (processedCountRef.current === testVariables.length) {
        if (resultsRef.current.length > 0) {
          try {
            const oneSampleStatistics = resultsRef.current.filter(r => 'Mean' in (r.stats as any));
            const oneSampleTest = resultsRef.current.filter(r => 'T' in (r.stats as any));

            const results: OneSampleTTestResults = {
              oneSampleStatistics,
              oneSampleTest
            };

            console.log('Results to format:', JSON.stringify(results));

            // Format tables
            const formattedOneSampleStatisticsTable = formatOneSampleStatisticsTable(results);
            const formattedOneSampleTestTable = formatOneSampleTestTable(results);

            // Prepare log message
            const variableNames = testVariables.map(v => v.name).join(" ");
            let logMsg = `T-TEST {TESTVAL=${testValue}} {VARIABLES=${variableNames}}`;

            if (estimateEffectSize) {
              logMsg += `{ES DISPLAY (TRUE)}`;
            } else {
              logMsg += `{ES DISPLAY (FALSE)}`;
            }
            
            logMsg += `{CRITERIA=0.95}`;

            // Save to database
            const logId = await addLog({ log: logMsg });
            const analyticId = await addAnalytic(logId, { title: "One-Sample T-Test" });

            await addStatistic(analyticId, {
              title: "One-Sample T-Test",
              output_data: JSON.stringify({ tables: [formattedOneSampleStatisticsTable] }),
              components: "One-Sample Statistics",
              description: ""
            });

            await addStatistic(analyticId, {
              title: "One-Sample T-Test",
              output_data: JSON.stringify({ tables: [formattedOneSampleTestTable] }),
              components: "One-Sample Test",
              description: ""
            });

            if (onClose) {
              onClose();
            }
          } catch (err) {
            console.error("Error saving results:", err);
            setErrorMsg("Error saving results.");
          }
        }

        setIsCalculating(false);
        worker.terminate();
        workerRef.current = null;
        if (errorCountRef.current === 0) {
          onClose?.();
        }
      }
    };

    worker.onerror = (err) => {
      console.error("A critical worker error occurred:", err);
      setErrorMsg(`A critical worker error occurred: ${err.message}`);
      setIsCalculating(false);
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [testVariables, testValue, estimateEffectSize, analysisData, addLog, addAnalytic, addStatistic, onClose]);

  const cancelCalculation = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsCalculating(false);
      console.log("One-Sample T-Test calculation cancelled.");
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelCalculation();
    };
  }, [cancelCalculation]);
  
  return {
    isCalculating,
    errorMsg,
    runAnalysis,
    cancelAnalysis: cancelCalculation
  };
};

export default useOneSampleTTestAnalysis;