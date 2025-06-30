import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { 
    FrequenciesAnalysisParams, 
    WorkerInput, 
    WorkerResult, 
    CombinedResults,
    StatisticsOptions,
    ChartOptions,
    FrequencyTable,
    DescriptiveStatistics,
    FrequenciesResult
} from '../types';
// import { processAndAddCharts } from '../utils/chartProcessor';
import { formatStatisticsTable, formatFrequencyTable } from '../utils/formatters';
import { Variable } from '@/types/Variable';

/**
 * Defines the return structure for the useFrequenciesAnalysis hook.
 */
interface FrequenciesAnalysisResult {
    isLoading: boolean;
    errorMsg: string | null;
    runAnalysis: () => Promise<void>;
    cancelAnalysis: () => void;
}

/**
 * A hook to perform frequency analysis.
 * This hook encapsulates the logic for interacting with a web worker to calculate frequencies,
 * handling state, processing results, and formatting them for display.
 *
 * @param params - The parameters for the analysis, including selected variables and options.
 * @returns An object containing the analysis state and control functions.
 */
export const useFrequenciesAnalysis = (params: FrequenciesAnalysisParams): FrequenciesAnalysisResult => {
    const { selectedVariables, showFrequencyTables, showStatistics, statisticsOptions, showCharts, chartOptions, onClose } = params;

    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: allData, weights } = useAnalysisData();

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const resultsRef = useRef<FrequenciesResult[]>([]);
    const processedCountRef = useRef(0);
    
    const handleWorkerMessage = useCallback(async (event: MessageEvent<WorkerResult>, analyticId: number) => {
        workerRef.current?.terminate();
        workerRef.current = null;
        setIsLoading(false);

        const { success, results, error } = event.data;

        if (success && results) {
            if (showStatistics && results.statistics) {
                const statsResults: FrequenciesResult[] = Object.entries(results.statistics).map(([varName, stats]) => ({
                    variable: selectedVariables.find(v => v.name === varName)!,
                    stats: stats
                }));

                if (statsResults.length > 0) {
                    const statsTableObject = formatStatisticsTable(statsResults);
                    if (statsTableObject && statsTableObject.tables) {
                        for (const table of statsTableObject.tables) {
                            await addStatistic(analyticId, {
                                title: table.title || 'Descriptive Statistics',
                                output_data: JSON.stringify(table),
                                components: 'table',
                                description: ''
                            });
                        }
                    }
                }
            }
            if (showFrequencyTables && results.frequencyTables) {
                for (const varName in results.frequencyTables) {
                    const freqTableData = results.frequencyTables[varName];
                    const freqTableObject = formatFrequencyTable(freqTableData);
                    if (freqTableObject && freqTableObject.tables) {
                        for (const table of freqTableObject.tables) {
                            await addStatistic(analyticId, {
                                title: table.title || 'Frequency Table',
                                output_data: JSON.stringify(table),
                                components: 'table',
                                description: ''
                            });
                        }
                    }
                }
            }
            /* if(showCharts && chartOptions && results.frequencyTables) {
                // The useResultStore does not have an `addChart` method.
                // This logic should be adapted if chart storage is implemented.
                // For now, we are just processing and logging.
                console.log("Chart processing would happen here.");
            } */
            onClose();
        } else {
            setErrorMsg(error || 'An unknown error occurred in the worker.');
        }
    }, [addStatistic, showFrequencyTables, showStatistics, onClose, selectedVariables]);

    const runAnalysis = useCallback(async () => {
        if (selectedVariables.length === 0) {
            setErrorMsg("Please select at least one variable.");
            return;
        }

        setIsLoading(true);
        setErrorMsg(null);
        
        const logId = await addLog({ log: 'Frequencies' });
        const analyticId = await addAnalytic(logId, {
            title: 'Frequencies Analysis',
            note: selectedVariables.map(v => v.name).join(', '),
        });

        workerRef.current = new Worker(new URL('@/public/workers/DescriptiveStatistics/manager.js', import.meta.url));
        workerRef.current.onmessage = (event: MessageEvent<WorkerResult>) => handleWorkerMessage(event, analyticId);
        workerRef.current.onerror = (e: ErrorEvent) => {
            console.error("Frequencies worker error:", e);
            setErrorMsg(`An unexpected error occurred in the Frequencies worker: ${e.message}`);
            setIsLoading(false);
            if(workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
        
        const workerInput: WorkerInput = {
            variableData: selectedVariables.map(variable => ({
                variable,
                data: allData.map(row => row[variable.columnIndex]).filter(item => item !== null && item !== undefined) as (string | number)[],
            })),
            weightVariableData: weights,
            options: {
                displayFrequency: showFrequencyTables,
                displayDescriptive: showStatistics,
                statisticsOptions,
                chartOptions
            }
        };
        workerRef.current.postMessage(workerInput);

    }, [selectedVariables, allData, weights, showFrequencyTables, showStatistics, statisticsOptions, chartOptions, addLog, addAnalytic, handleWorkerMessage]);

    const cancelAnalysis = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsLoading(false);
            console.log("Frequencies analysis cancelled.");
        }
    }, []);

    useEffect(() => {
        return () => cancelAnalysis();
    }, [cancelAnalysis]);

    return {
        isLoading,
        errorMsg,
        runAnalysis,
        cancelAnalysis,
    };
}; 