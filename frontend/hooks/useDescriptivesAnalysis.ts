import { useState, useCallback, useRef, useEffect } from 'react';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import type { Variable, DescriptiveStatistics, ZScoreData, DataRow } from '@/types';

interface DescriptiveResults {
    [key: string]: DescriptiveStatistics & { zScores?: ZScoreData };
}

interface RunDescriptivesOptions {
    statistics: {
        [key in keyof DescriptiveStatistics]?: boolean;
    };
    zScores?: boolean;
}

export const useDescriptivesAnalysis = () => {
    const { data: analysisData, weights: analysisWeights } = useAnalysisData();
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<DescriptiveResults>({});
    const [error, setError] = useState<string | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const activeTasks = useRef(0);

    const runDescriptives = useCallback((variables: Variable[], options: RunDescriptivesOptions) => {
        if (workerRef.current) {
            workerRef.current.terminate();
        }

        const newWorker = new Worker(new URL('@/workers/DescriptiveStatistics/manager.js', import.meta.url), { type: 'module' });
        workerRef.current = newWorker;
        
        setIsLoading(true);
        setResults({});
        setError(null);

        activeTasks.current = variables.length;

        variables.forEach(variable => {
            const columnIndex = variable.columnIndex;
            const columnData = analysisData.map((row: DataRow) => row[columnIndex]);

            const payload = {
                variable,
                data: columnData,
                weights: analysisWeights,
                options,
            };

            newWorker.postMessage({
                analysisType: 'descriptives',
                payload,
            });
        });

        newWorker.onmessage = (e: MessageEvent) => {
            const { success, payload: workerPayload, results: workerResults, error: workerError } = e.data;
            
            if (success) {
                const { variable } = workerPayload;
                setResults(prev => ({
                    ...prev,
                    [variable.name]: workerResults,
                }));
            } else {
                setError(workerError);
            }
            activeTasks.current -= 1;
            if (activeTasks.current === 0) {
                setIsLoading(false);
            }
        };

        newWorker.onerror = (err) => {
            setError(err.message);
            setIsLoading(false);
        };

    }, [analysisData, analysisWeights]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
    }, []);

    return { isLoading, results, error, runDescriptives, cancelCalculation };
}; 