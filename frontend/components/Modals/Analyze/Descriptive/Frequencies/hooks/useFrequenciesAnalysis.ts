import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import type { Variable } from '@/types/Variable';
import type { 
  FrequenciesAnalysisParams,
  WorkerResult,
  FrequencyTable,
  DescriptiveStatistics
} from '../types';
import { useAnalysisData } from '@/hooks/useVariableData';
import { formatFrequencyTable, formatStatisticsTable } from '../utils';

export interface FrequenciesAnalysisResult {
  isLoading: boolean;
  errorMsg: string | null;
  runAnalysis: () => Promise<void>;
  cancelAnalysis: () => void;
}

interface FrequenciesResult {
  variable: Variable;
  stats?: DescriptiveStatistics;
  frequencyTable?: FrequencyTable;
}

export const useFrequenciesAnalysis = ({
    selectedVariables,
    statisticsOptions,
    chartOptions,
    onClose,
    ...displayOptions
}: FrequenciesAnalysisParams): FrequenciesAnalysisResult => {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const analysisData = useAnalysisData();
    const workerRef = useRef<Worker | null>(null);
    const resultsRef = useRef<FrequenciesResult[]>([]);
    const processedCountRef = useRef(0);

    const cancelAnalysis = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        return () => cancelAnalysis();
    }, [cancelAnalysis]);

    const runAnalysis = useCallback(async () => {
        if (selectedVariables.length === 0) {
            setErrorMsg("Please select at least one variable.");
            return;
        }
        
        if (!displayOptions.showFrequencyTables && !displayOptions.showStatistics) {
            setErrorMsg("Please select at least one analysis option (Frequency Tables or Statistics).");
            return;
        }

        setIsLoading(true);
        setErrorMsg(null);

        resultsRef.current = [];
        processedCountRef.current = 0;
        workerRef.current = new Worker('/workers/DescriptiveStatistics/manager.js');

        selectedVariables.forEach(variable => {
            workerRef.current?.postMessage({
                analysisType: 'frequencies',
                variable,
                data: analysisData.data.map(row => row[variable.columnIndex]),
                weights: analysisData.weights,
                options: {
                    displayFrequency: displayOptions.showFrequencyTables,
                    displayDescriptive: displayOptions.showStatistics,
                    statisticsOptions,
                    chartOptions
                }
            });
        });

        workerRef.current.onmessage = async (e: MessageEvent<any>) => {
            const { status, results, error } = e.data;

            if (status === 'success' && results) {
                resultsRef.current.push(results);
            } else {
                setErrorMsg(prev => prev ? `${prev}\n${error}` : error);
            }

            processedCountRef.current++;
            if (processedCountRef.current === selectedVariables.length) {
                if (workerRef.current) {
                    workerRef.current.terminate();
                    workerRef.current = null;
                }

                if (resultsRef.current.length > 0) {
                    const variableNameList = selectedVariables.map(v => v.name).join(", ");
                    const logId = await addLog({ log: `FREQUENCIES VARIABLES=${variableNameList}` });
                    const analyticId = await addAnalytic(logId, { title: "Frequencies" });

                    if (displayOptions.showStatistics) {
                        const statsTable = formatStatisticsTable(resultsRef.current);
                        await addStatistic(analyticId, {
                            title: "Statistics",
                            output_data: JSON.stringify(statsTable),
                            components: "Descriptive Statistics",
                            description: "Descriptive statistics summary for the selected variables."
                        });
                    }

                    if (displayOptions.showFrequencyTables) {
                        for (const result of resultsRef.current) {
                            if (result.frequencyTable) {
                                const freqTable = formatFrequencyTable(result.frequencyTable);
                                await addStatistic(analyticId, {
                                    title: `Frequency Table: ${result.variable.label || result.variable.name}`,
                                    output_data: JSON.stringify(freqTable),
                                    components: "Frequency Table",
                                    description: `Frequency distribution for ${result.variable.label || result.variable.name}.`
                                });
                            }
                        }
                    }
                }
                
                setIsLoading(false);
                onClose();
            }
        };

        workerRef.current.onerror = (e) => {
            setErrorMsg(e.message);
            setIsLoading(false);
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };

    }, [
        selectedVariables,
        displayOptions,
        statisticsOptions,
        chartOptions,
        analysisData,
        addLog,
        addAnalytic,
        addStatistic,
        onClose
    ]);

    return { 
        isLoading, 
        errorMsg, 
        runAnalysis,
        cancelAnalysis
    };
}; 