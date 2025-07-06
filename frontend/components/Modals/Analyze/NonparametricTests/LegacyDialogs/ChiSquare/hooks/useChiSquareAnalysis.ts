import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';

import {
    ChiSquareAnalysisProps,
    ChiSquareResults,
    ChiSquareResult
} from '../types';

import { formatFrequenciesTable, formatTestStatisticsTable, formatDescriptiveStatisticsTable, formatErrorMessage } from '../utils/formatters';

export const useChiSquareAnalysis = ({
    testVariables,
    expectedRange,
    rangeValue,
    expectedValue,
    expectedValueList,
    displayStatistics,
    onClose
}: ChiSquareAnalysisProps) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    // Worker references
    const workerRef = useRef<Worker | null>(null);
    
    // Refs for accumulating results inside the worker callback
    const resultsRef = useRef<ChiSquareResult[]>([]);
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);

    const runAnalysis = useCallback(async (): Promise<void> => {
        if (testVariables.length === 0) {
            setErrorMsg('Please select at least one variable to analyze.');
            return;
        }

        if (expectedRange.useSpecifiedRange && !rangeValue.lowerValue && !rangeValue.upperValue) {
            setErrorMsg('Please specify a range of values to analyze.');
            return;
        }

        if (!expectedValue.allCategoriesEqual && expectedValueList.length === 0) {
            setErrorMsg('Please specify a list of values to analyze.');
            return;
        }
        
        setIsCalculating(true);
        setErrorMsg(null);

        // Reset refs for new analysis run
        resultsRef.current = [];
        errorCountRef.current = 0;
        processedCountRef.current = 0;

        const worker = new Worker('/workers/NonparametricTests/manager.js', { type: 'module' });
        workerRef.current = worker;

        testVariables.forEach(variable => {
            const dataForVar = analysisData.map(row => row[variable.columnIndex]);
            const payload = {
                analysisType: 'chiSquare',
                variable,
                data: dataForVar,
                options: { expectedRange, rangeValue, expectedValue, expectedValueList, displayStatistics }
            };
            worker.postMessage(payload);
        });

        worker.onmessage = async (event) => {
            const { variableName, results, status, error: workerError, specifiedRange } = event.data;

            if (status === 'success' && results) {
                // Process frequencies
                if (results.frequencies) {
                    const { variable, categoryList, observedN, expectedN, residual } = results.frequencies;

                    if (variable && categoryList && observedN && expectedN && residual) {
                        resultsRef.current.push({
                            variable,
                            specifiedRange,
                            stats: {
                                categoryList,
                                observedN,
                                expectedN,
                                residual
                            }
                        });
                    } else {
                        console.error(`Error processing ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }

                // Process test statistics
                // if (results.testStatistics) {
                //     const { variable, ChiSquare, DF, PValue } = results.testStatistics;

                //     if (variable && ChiSquare && DF && PValue) {
                //         resultsRef.current.push({
                //           variable,
                //           stats: {
                //             ChiSquare,
                //             DF,
                //             PValue
                //           }
                //       });
                //     } else {
                //         console.error(`Error processing ${variableName}:`, workerError);
                //         const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                //         setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                //         errorCountRef.current += 1;
                //     }
                // }

                // Process descriptive statistics
                // if (results.descriptiveStatistics) {
                //     const { variable, stats } = results.descriptiveStatistics;

                //     if (variable && stats) {
                //         resultsRef.current.push({
                //             variable,
                //             stats
                //         });
                //     } else {
                //         console.error(`Error processing ${variableName}:`, workerError);
                //         const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                //         setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                //         errorCountRef.current += 1;
                //     }
                // }

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
                      // Separate frequencies, test statistics, and descriptive statistics results
                      const frequencies = resultsRef.current.filter(r => 'categoryList' in (r.stats as any));
                      // const testStatistics = resultsRef.current.filter(r => 'ChiSquare' in (r.stats as any));
                      // const descriptiveStatistics = resultsRef.current.filter(r => 'Mean' in (r.stats as any));
                      
                      const results: ChiSquareResults = {
                          frequencies,
                          // testStatistics,
                          // descriptiveStatistics
                      };

                      // Format tables
                      const formattedFrequenciesTable = formatFrequenciesTable(results, specifiedRange);
                      // const formattedTestStatisticsTable = formatTestStatisticsTable(results);
                      // const formattedDescriptiveStatisticsTable = formatDescriptiveStatisticsTable(results);

                      // Prepare log message
                      const variableNames = testVariables.map(v => v.name).join(" ");
                      let logMsg = `NPAR TESTS`;
                      
                      // Only add tests that are enabled
                      if (expectedRange.useSpecifiedRange) {
                        logMsg += `{CHISQUARE=${variableNames} (${rangeValue.lowerValue},${rangeValue.upperValue})}`;
                      } else {
                        logMsg += `{CHISQUARE=${variableNames}}`;
                      }

                      if (expectedValue.allCategoriesEqual) {
                          logMsg += `{EXPECTED=EQUAL}`;
                      } else {
                          logMsg += `{EXPECTED=${expectedValueList.join(" ")}}`;
                      }

                      // if (displayStatistics.descriptive && displayStatistics.quartiles) {
                      //     logMsg += `{STATISTICS DESCRIPTIVES QUARTILES}`;
                      // } else if (displayStatistics.descriptive) {
                      //     logMsg += `{STATISTICS DESCRIPTIVES}`;
                      // } else if (displayStatistics.quartiles) {
                      //     logMsg += `{STATISTICS QUARTILES}`;
                      // }

                      // Save to database
                      const logId = await addLog({ log: logMsg });
                      const analyticId = await addAnalytic(logId, { title: "Chi-Square Test" });
                        
                      // Add frequencies table
                      await addStatistic(analyticId, {
                          title: "Chi-Square Test",
                          output_data: JSON.stringify({ tables: [formattedFrequenciesTable] }),
                          components: "Frequencies",
                          description: ""
                      });
                      
                        
                      // Add test statistics table
                      // if (formattedTestStatisticsTable.rows.length > 0) {
                      //     await addStatistic(analyticId, {
                      //         title: "Chi-Square Test",
                      //         output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                      //         components: "Chi-Square Test",
                      //         description: ""
                      //     });
                      // }
                        
                      // Add descriptive statistics table
                      // if (displayStatistics.descriptive && formattedDescriptiveStatisticsTable.rows.length > 0) {
                      //     await addStatistic(analyticId, {
                      //         title: "Chi-Square Test",
                      //         output_data: JSON.stringify({ tables: [formattedDescriptiveStatisticsTable] }),
                      //         components: "Descriptive Statistics",
                      //         description: ""
                      //     });
                      // }
                          
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
    }, [testVariables, expectedRange, rangeValue, expectedValue, expectedValueList, displayStatistics, onClose, addLog, addAnalytic, addStatistic, analysisData]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("Chi-Square Test calculation cancelled.");
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

export default useChiSquareAnalysis;