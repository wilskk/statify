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
    DescriptiveStatistics
} from '../types';
import { processAndAddCharts } from '../utils/chartProcessor';
import { formatResultsToTables } from '../utils/tableFormatter';
import { Variable } from '@/types/Variable';

/**
 * Defines the return structure for the useFrequenciesAnalysis hook.
 */
interface FrequenciesAnalysisResult {
    isCalculating: boolean;
    errorMsg: string | null;
    runAnalysis: () => Promise<void>;
    cancelAnalysis: () => void;
}

interface FrequenciesResult {
  variable: Variable;
  stats?: DescriptiveStatistics;
  frequencyTable?: FrequencyTable;
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

    const { addLog, addAnalytic, addStatistic, addChart } = useResultStore();
    const { data: allData, weights } = useAnalysisData();

    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const resultsRef = useRef<FrequenciesResult[]>([]);
    const processedCountRef = useRef(0);
    
    const handleWorkerMessage = useCallback(async (event: MessageEvent<WorkerResult>, analyticId: string) => {
        workerRef.current?.terminate();
        workerRef.current = null;
        setIsCalculating(false);

        const { success, results, error } = event.data;

        if (success && results) {
            if (showStatistics && results.statistics) {
                const statsTables = formatResultsToTables(results.statistics, 'statistics');
                for (const table of statsTables) {
                    await addStatistic(analyticId, {
                        title: 'Descriptive Statistics',
                        output_type: 'table',
                        output_data: JSON.stringify(table),
                    });
                }
            }
            if (showFrequencyTables && results.frequencyTables) {
                const freqTables = formatResultsToTables(results.frequencyTables, 'frequencies');
                 for (const table of freqTables) {
                    await addStatistic(analyticId, {
                        title: 'Frequency Table',
                        output_type: 'table',
                        output_data: JSON.stringify(table),
                    });
                }
            }
            if(showCharts && chartOptions && results.frequencyTables) {
                // The useResultStore does not have an `addChart` method.
                // This logic should be adapted if chart storage is implemented.
                // For now, we are just processing and logging.
                console.log("Chart processing would happen here.");
            }
            onClose();
        } else {
            setErrorMsg(error || 'An unknown error occurred in the worker.');
        }
    }, [addStatistic, chartOptions, showCharts, showFrequencyTables, showStatistics, onClose]);

    const runAnalysis = useCallback(async () => {
        if (selectedVariables.length === 0) {
            setErrorMsg("Please select at least one variable.");
            return;
        }

        setIsCalculating(true);
        setErrorMsg(null);
        
        const logId = await addLog({ log: 'Frequencies' });
        const analyticId = await addAnalytic(logId, {
            title: 'Frequencies Analysis',
            variables_involved: selectedVariables.map(v => v.name).join(', '),
        });

        workerRef.current = new Worker(new URL('@/public/workers/Frequencies/frequencies.worker.js', import.meta.url));
        workerRef.current.onmessage = (event: MessageEvent<WorkerResult>) => handleWorkerMessage(event, analyticId);
        workerRef.current.onerror = (e: ErrorEvent) => {
            console.error("Frequencies worker error:", e);
            setErrorMsg(`An unexpected error occurred in the Frequencies worker: ${e.message}`);
            setIsCalculating(false);
            if(workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
        
        const workerInput: WorkerInput = {
            variableData: selectedVariables.map(variable => ({
                variable,
                data: allData.map(row => row[variable.columnIndex]),
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

    }, [selectedVariables, allData, weights, showFrequencyTables, showStatistics, statisticsOptions, showCharts, chartOptions, addLog, addAnalytic, handleWorkerMessage]);

    const cancelAnalysis = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("Frequencies analysis cancelled.");
        }
    }, []);

    useEffect(() => {
        return () => cancelAnalysis();
    }, [cancelAnalysis]);

    return {
        isCalculating,
        errorMsg,
        runAnalysis,
        cancelAnalysis,
    };
}; 