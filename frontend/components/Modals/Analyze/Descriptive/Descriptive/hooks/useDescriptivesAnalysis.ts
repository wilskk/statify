import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { Variable } from '@/types/Variable';
import { 
    DescriptivesAnalysisProps, 
    DescriptiveResult, 
    ZScoreData
} from '../types';
import { formatDescriptiveTableOld } from '../utils/formatters';
import { useZScoreProcessing } from './useZScoreProcessing';
import { useAnalysisData } from '@/hooks/useAnalysisData';

export const useDescriptivesAnalysis = ({
    selectedVariables,
    displayStatistics,
    saveStandardized,
    displayOrder,
    onClose
}: DescriptivesAnalysisProps) => {
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setErrorMsg] = useState<string | null>(null);
    const workerRef = useRef<Worker | null>(null);

    // Refs for accumulating results inside the worker callback
    const resultsRef = useRef<DescriptiveResult[]>([]);
    const zScoresRef = useRef<ZScoreData>({});
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);
    
    const { processZScoreData } = useZScoreProcessing({ setErrorMsg });
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData, weights } = useAnalysisData();

    const runAnalysis = useCallback(async () => {
        setIsCalculating(true);
        setErrorMsg(null);

        // Reset refs for new analysis run
        resultsRef.current = [];
        zScoresRef.current = {};
        errorCountRef.current = 0;
        processedCountRef.current = 0;
        
        const worker = new Worker('/workers/DescriptiveStatistics/manager.js');
        workerRef.current = worker;

        selectedVariables.forEach(variable => {
            const dataForVar = analysisData.map(row => row[variable.columnIndex]);
            const payload = {
                analysisType: 'descriptives',
                variable,
                data: dataForVar,
                weights,
                options: { ...displayStatistics, saveStandardized }
            };
            worker.postMessage(payload);
        });
        
        worker.onmessage = async (event) => {
            const { variableName, results, status, error: workerError } = event.data;
            const { variable, stats, zScores } = results || {};
            
            if (status === 'success' && variable && stats) {
                resultsRef.current.push({ variable, stats });
                if (saveStandardized && zScores) {
                    zScoresRef.current[variable.name] = { 
                        scores: zScores, 
                        variableInfo: {
                            name: `Z${variable.name}`,
                            label: `Zscore(${variable.label || variable.name})`,
                            type: "NUMERIC",
                            width: 8,
                            decimals: 3,
                            measure: 'scale'
                        }
                    };
                }
            } else {
                console.error(`Error processing ${variableName}:`, workerError);
                const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                errorCountRef.current += 1;
            }
            
            processedCountRef.current += 1;
            
            if (processedCountRef.current === selectedVariables.length) {
                const zScoreVarsCreated = Object.keys(zScoresRef.current).length > 0
                    ? await processZScoreData(zScoresRef.current)
                    : 0;

                if (resultsRef.current.length > 0) {
                    const formattedTable = formatDescriptiveTableOld(resultsRef.current, displayStatistics, displayOrder);
                    const logId = await addLog({ log: `DESCRIPTIVES VARIABLES=${selectedVariables.map(v => v.name).join(" ")}` });
                    const analyticId = await addAnalytic(logId, { title: "Descriptives" });
                    await addStatistic(analyticId, {
                        title: "Descriptive Statistics",
                        output_data: JSON.stringify({ tables: [formattedTable] }),
                        components: "Descriptive Statistics",
                        description: ""
                    });
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

    }, [selectedVariables, displayStatistics, saveStandardized, displayOrder, onClose, addLog, addAnalytic, addStatistic, processZScoreData, analysisData, weights]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("Descriptives calculation cancelled.");
        }
    }, []);

    useEffect(() => {
        return () => {
            cancelCalculation();
        };
    }, [cancelCalculation]);

    return { runAnalysis, isCalculating, cancelCalculation, error };
};