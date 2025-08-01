import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
  OneSampleTTestAnalysisProps,
  OneSampleTTestResult
} from '../types';

import {
  formatOneSampleTestTable,
  formatOneSampleStatisticsTable,
  formatErrorTable
} from '../utils/formatters'

export const useOneSampleTTestAnalysis = ({
  testVariables,
  testValue,
  estimateEffectSize,
  onClose
}: OneSampleTTestAnalysisProps) => {
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { addLog, addAnalytic, addStatistic } = useResultStore();
  const { data: analysisData } = useAnalysisData();

  const workerRef = useRef<Worker | null>(null);

  const resultsRef = useRef<OneSampleTTestResult[]>([]);
  const errorCountRef = useRef<number>(0);
  const processedCountRef = useRef<number>(0);
  const insufficientDataVarsRef = useRef<string[]>([]);

  // Timing refs
  const timingRef = useRef<{
    analysisStart: number;
    dataSentToWorker: number;
    dataReceivedFromWorker: number;
    dataFormattedToTable: number;
    processCompleted: number;
  }>({
    analysisStart: 0,
    dataSentToWorker: 0,
    dataReceivedFromWorker: 0,
    dataFormattedToTable: 0,
    processCompleted: 0
  });

  const runAnalysis = useCallback(async () => {
    // 1. Catat waktu ketika runAnalysis dimulai
    timingRef.current.analysisStart = performance.now();
    console.log(`[OneSampleTTest] Analysis started at: ${new Date().toISOString()}`);
    
    setIsCalculating(true);
    setErrorMsg(null);

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
    insufficientDataVarsRef.current = [];

    const worker = new Worker('/workers/CompareMeans/manager.js', { type: 'module' });
    workerRef.current = worker;

    let analysisTypes;
    if (estimateEffectSize) {
        // analysisTypes = ['oneSampleTTest', 'oneSampleTTestEffectSize'];
        analysisTypes = ['oneSampleTTest'];
    } else {
        analysisTypes = ['oneSampleTTest'];
    }

    // 2. Catat waktu ketika data dikirim ke web worker
    timingRef.current.dataSentToWorker = performance.now();
    console.log(`[OneSampleTTest] Data sent to worker at: ${new Date().toISOString()}`);
    console.log(`[OneSampleTTest] Time from start to sending data: ${timingRef.current.dataSentToWorker - timingRef.current.analysisStart}ms`);

    testVariables.forEach(variable => {
      const dataForVar = analysisData.map(row => row[variable.columnIndex]);
      const payload = {
        analysisType: analysisTypes,
        variable1: variable,
        data1: dataForVar,
        options: { testValue, estimateEffectSize }
      };
      worker.postMessage(payload);
    });

    worker.onmessage = async (event) => {
      const { variableName, results, status, error: workerError } = event.data;

      // 3. Catat waktu ketika data diterima dari web worker
      if (processedCountRef.current === 0) {
        timingRef.current.dataReceivedFromWorker = performance.now();
        console.log(`[OneSampleTTest] First data received from worker at: ${new Date().toISOString()}`);
        console.log(`[OneSampleTTest] Time from sending to receiving data: ${timingRef.current.dataReceivedFromWorker - timingRef.current.dataSentToWorker}ms`);
      }

      if (status === 'success' && results) {
        // Check for metadata about insufficient data
        if (results.metadata && results.metadata.hasInsufficientData) {
          insufficientDataVarsRef.current.push(results.metadata.variableName);
          console.warn(`Insufficient valid data for variable: ${results.metadata.variableName}. Total: ${results.metadata.totalData}, Valid: ${results.metadata.validData}`);
        }
        
        if (results.oneSampleStatistics && results.oneSampleTest) {
          const { N, Mean, StdDev, SEMean } = results.oneSampleStatistics;
          const { T, DF, PValue, MeanDifference, Lower, Upper } = results.oneSampleTest;
          resultsRef.current.push({
            variable1: results.variable1,
            oneSampleStatistics: {
              N,
              Mean,
              StdDev,
              SEMean
            },
            oneSampleTest: {
              T,
              DF,
              PValue,
              MeanDifference,
              Lower,
              Upper
            }
          });
        }
      } else {
        console.error(`Error processing ${variableName}:`, workerError);
        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
        errorCountRef.current += 1;
      }

      processedCountRef.current++;

      if (processedCountRef.current === testVariables.length) {
        try {
          console.log(`resultsRef.current: ${JSON.stringify(resultsRef.current)}`);
          
          // 4. Catat waktu ketika data diubah ke format tabel
          timingRef.current.dataFormattedToTable = performance.now();
          console.log(`[OneSampleTTest] Data formatting started at: ${new Date().toISOString()}`);
          console.log(`[OneSampleTTest] Time from receiving data to formatting: ${timingRef.current.dataFormattedToTable - timingRef.current.dataReceivedFromWorker}ms`);

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
          
          // Prepare note about insufficient data if needed
          let note = "";
          if (insufficientDataVarsRef.current.length > 0) {
            note = `Note: The following variables did not have sufficient valid data for analysis: ${insufficientDataVarsRef.current.join(', ')}. 
                These variables require at least two valid numeric values for T-Test calculation.`;
          }
          
          // Create analytic with or without note
          const analyticId = await addAnalytic(logId, { 
            title: "T-Test", 
            note: note || undefined 
          });

          // If we have valid results and not all variables have insufficient data
          if (resultsRef.current.length > 0 && insufficientDataVarsRef.current.length < testVariables.length) {
            // Format tables
            const formattedOneSampleStatisticsTable = formatOneSampleStatisticsTable(resultsRef.current);
            const formattedOneSampleTestTable = formatOneSampleTestTable(resultsRef.current, testValue);

            await addStatistic(analyticId, {
              title: "One-Sample Statistics",
              output_data: JSON.stringify({ tables: [formattedOneSampleStatisticsTable] }),
              components: "One-Sample Statistics",
              description: ""
            });

            await addStatistic(analyticId, {
              title: "One-Sample Test",
              output_data: JSON.stringify({ tables: [formattedOneSampleTestTable] }),
              components: "One-Sample Test",
              description: ""
            });
          } 
          // If no valid results or all variables have insufficient data, show error table
          else {
            const formattedErrorTable = formatErrorTable();
            await addStatistic(analyticId, {
              title: "One-Sample T Test Error",
              output_data: JSON.stringify({ tables: [formattedErrorTable] }),
              components: "Error",
              description: ""
            });
          }

          // 5. Catat waktu ketika proses selesai
          timingRef.current.processCompleted = performance.now();
          console.log(`[OneSampleTTest] Process completed at: ${new Date().toISOString()}`);
          console.log(`[OneSampleTTest] Total time from start to completion: ${timingRef.current.processCompleted - timingRef.current.analysisStart}ms`);
          console.log(`[OneSampleTTest] Time from formatting to completion: ${timingRef.current.processCompleted - timingRef.current.dataFormattedToTable}ms`);
          
          // Log summary of all timing stages
          console.log(`[OneSampleTTest] TIMING SUMMARY:`);
          console.log(`  - Analysis start to data sent: ${timingRef.current.dataSentToWorker - timingRef.current.analysisStart}ms`);
          console.log(`  - Data sent to data received: ${timingRef.current.dataReceivedFromWorker - timingRef.current.dataSentToWorker}ms`);
          console.log(`  - Data received to formatting: ${timingRef.current.dataFormattedToTable - timingRef.current.dataReceivedFromWorker}ms`);
          console.log(`  - Formatting to completion: ${timingRef.current.processCompleted - timingRef.current.dataFormattedToTable}ms`);
          console.log(`  - TOTAL TIME: ${timingRef.current.processCompleted - timingRef.current.analysisStart}ms`);

          setIsCalculating(false);
          worker.terminate();
          workerRef.current = null;
          onClose?.();
        } catch (err) {
          console.error("Error saving results:", err);
          setErrorMsg("Error saving results.");
          setIsCalculating(false);
          worker.terminate();
          workerRef.current = null;
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

  const cancelAnalysis = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsCalculating(false);
      console.log("One-Sample T-Test calculation cancelled.");
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelAnalysis();
    };
  }, [cancelAnalysis]);
  
  return {
    isCalculating,
    errorMsg,
    runAnalysis,
    cancelAnalysis
  };
};

export default useOneSampleTTestAnalysis;