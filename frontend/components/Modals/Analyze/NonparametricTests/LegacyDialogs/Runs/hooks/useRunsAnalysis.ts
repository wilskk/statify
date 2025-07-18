import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
  RunsAnalysisProps,
  RunsTestResults,
  RunsTestResult
} from '../types';

import {
  formatRunsTestTable,
  formatDescriptiveStatisticsTable,
} from '../utils/formatters';

export const useRunsAnalysis = ({
  testVariables,
  cutPoint,
  customValue,
  displayStatistics,
  onClose
}: RunsAnalysisProps) => {
  const { addLog, addAnalytic, addStatistic } = useResultStore();
  const { data: analysisData } = useAnalysisData();

  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);

  const resultsRef = useRef<RunsTestResult[]>([]);
  const errorCountRef = useRef<number>(0);
  const processedCountRef = useRef<number>(0);

  // Perform analysis
  const runAnalysis = useCallback(async (): Promise<void> => {
    if (testVariables.length === 0) {
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

    const worker = new Worker('/workers/NonparametricTests/manager.js', { type: 'module' });
    workerRef.current = worker;

    let analysisTypes;
    if (displayStatistics.descriptive || displayStatistics.quartiles) {
      analysisTypes = ['descriptiveStatistics', 'runs'];
    } else {
      analysisTypes = ['runs'];
    }

    testVariables.forEach(variable => {
      const dataForVar = analysisData.map(row => row[variable.columnIndex]);
      const payload = {
        analysisType: analysisTypes,
        variable,
        data: dataForVar,
        options: { cutPoint, customValue, displayStatistics }
      };
      worker.postMessage(payload);
    });

    worker.onmessage = async (event) => {
      const { variableName, results, status, error: workerError } = event.data;

      if (status === 'success' && results) {
        if (results.descriptiveStatistics) {
          console.log('results.descriptiveStatistics', JSON.stringify(results.descriptiveStatistics));
          const { variable, N, Mean, StdDev, Min, Max, Percentile25, Percentile50, Percentile75 } = results.descriptiveStatistics;

          if (variable && N && Mean && StdDev && Min && Max && Percentile25 && Percentile50 && Percentile75) {
            resultsRef.current.push({
              variable,
              stats: {
                N,
                Mean,
                StdDev,
                Min,
                Max,
                Percentile25,
                Percentile50,
                Percentile75
              }
            });
          } else {
            console.error(`Error processing descriptive statistics for ${variableName}:`, workerError);
            const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
            setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
          }
        }

        if (results.runsTest) {
          const { variable, median, mean, mode, custom } = results.runsTest;
          console.log('results.runsTest', JSON.stringify(results.runsTest));
          console.log('median', JSON.stringify(median));
          console.log('mean', JSON.stringify(mean));
          console.log('mode', JSON.stringify(mode));
          console.log('custom', JSON.stringify(custom));

          if (variable) {
            if (cutPoint.median && median) {
              const { TestValue, CasesBelow, CasesAbove, Total, Runs, Z, PValue } = median;
              resultsRef.current.push({
                variable,
                cutPoint: 'Median',
                stats: {
                  TestValue,
                  CasesBelow,
                  CasesAbove,
                  Total,
                  Runs,
                  Z,
                  PValue
                }
              });
            } else if (cutPoint.median && !median) {
              console.error(`Error processing median runs test for ${variableName}:`, workerError);
              const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
              setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
              errorCountRef.current += 1;
            }

            if (cutPoint.mean && mean) {
              const { TestValue, CasesBelow, CasesAbove, Total, Runs, Z, PValue } = mean;
              resultsRef.current.push({
                variable,
                cutPoint: 'Mean',
                stats: {
                  TestValue,
                  CasesBelow,
                  CasesAbove,
                  Total,
                  Runs,
                  Z,
                  PValue
                }
              });
            } else if (cutPoint.mean && !mean) {
              console.error(`Error processing runs test for ${variableName}:`, workerError);
              const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
              setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
              errorCountRef.current += 1;
            }

            if (cutPoint.mode && mode) {
              const { TestValue, CasesBelow, CasesAbove, Total, Runs, Z, PValue } = mode;
              resultsRef.current.push({
                variable,
                cutPoint: 'Mode',
                stats: {
                  TestValue,
                  CasesBelow,
                  CasesAbove,
                  Total,
                  Runs,
                  Z,
                  PValue
                }
              });
            } else if (cutPoint.mode && !mode) {
              console.error(`Error processing mode runs test for ${variableName}:`, workerError);
              const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
              setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);  
              errorCountRef.current += 1;
            }

            if (cutPoint.custom && custom) {
              const { TestValue, CasesBelow, CasesAbove, Total, Runs, Z, PValue } = custom;
              resultsRef.current.push({
                variable,
                cutPoint: 'Custom',
                stats: {
                  TestValue,
                  CasesBelow,
                  CasesAbove,
                  Total,
                  Runs,
                  Z,
                  PValue
                }
              });
            } else if (cutPoint.custom && !custom) {
              console.error(`Error processing custom runs test for ${variableName}:`, workerError);
              const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
              setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
              errorCountRef.current += 1;
            }
          } else {
            console.error(`Error processing runs test for ${variableName}:`, workerError);
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

      processedCountRef.current += 1;

      if (processedCountRef.current === testVariables.length) {
        if (resultsRef.current.length > 0) {
          try {
            console.log('resultsRef.current', JSON.stringify(resultsRef.current));
            const descriptiveStatistics = resultsRef.current.filter(r => 'Mean' in (r.stats as any));
            const runsTest = resultsRef.current.filter(r => 'TestValue' in (r.stats as any));

            const results: RunsTestResults = {
              descriptiveStatistics,
              runsTest
            };

            console.log('Results to format:', JSON.stringify(results));

            // Format tables
            const formattedDescriptiveStatisticsTable = formatDescriptiveStatisticsTable(results, displayStatistics);
            const formattedRunsTestTable = formatRunsTestTable(results);

            console.log('Formatted descriptive statistics table:', JSON.stringify(formattedDescriptiveStatisticsTable));
            console.log('Formatted runs test table:', JSON.stringify(formattedRunsTestTable));

            // Prepare log message
            const variableNames = testVariables.map(v => v.name).join(" ");
            let logMsg = `NPAR TESTS`;

            if (cutPoint.median) {
              logMsg += `{RUNS (MEDIAN)=${variableNames}}`;
            }

            if (cutPoint.mode) {
              logMsg += `{RUNS (MODE)=${variableNames}}`;
            }

            if (cutPoint.mean) {
              logMsg += `{RUNS (MEAN)=${variableNames}}`;
            }

            if (cutPoint.custom) {
              logMsg += `{RUNS (${customValue})=${variableNames}}`;
            }

            if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
              logMsg += `{STATISTICS`;
              if (displayStatistics.descriptive) logMsg += ` DESCRIPTIVES`;
              if (displayStatistics.quartiles) logMsg += ` QUARTILES`;
              logMsg += `}`;
            }

            // Save to database
            const logId = await addLog({ log: logMsg });
            const analyticId = await addAnalytic(logId, { title: "Runs Test" });

            // Add descriptive statistics table
            if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
              await addStatistic(analyticId, {
                title: "Descriptive Statistics",
                output_data: JSON.stringify({ tables: [formattedDescriptiveStatisticsTable] }),
                components: "Descriptive Statistics",
                description: ""
              });
            }

            // Add runs test table
            // formattedRunsTestTable is an array of RunsTestTable(s)
            if (Array.isArray(formattedRunsTestTable) && formattedRunsTestTable.length > 0) {
              for (const table of formattedRunsTestTable) {
                let cutPointType = "Test";
                
                // Extract cut point type from table title
                if (table.title.includes("(Median)")) {
                  cutPointType = "Median";
                } else if (table.title.includes("(Mean)")) {
                  cutPointType = "Mean";
                } else if (table.title.includes("(Mode)")) {
                  cutPointType = "Mode";
                } else if (table.title.includes(`Custom (${customValue})`)) {
                  cutPointType = `Custom (${customValue})`;
                }
                
                await addStatistic(analyticId, {
                  title: `Runs Test (${cutPointType})`,
                  output_data: JSON.stringify({ tables: [table] }),
                  components: `Runs Test (${cutPointType})`,
                  description: ""
                });
              }
            }

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
  }, [testVariables, cutPoint, customValue, displayStatistics, addLog, addAnalytic, addStatistic, onClose, analysisData]);

  const cancelCalculation = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsCalculating(false);
      console.log("Runs Test calculation cancelled.");
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
    cancelCalculation
  };
};

export default useRunsAnalysis;