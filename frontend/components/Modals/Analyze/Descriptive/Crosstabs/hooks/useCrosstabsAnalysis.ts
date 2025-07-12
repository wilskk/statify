import { useState, useCallback, useRef, useEffect } from 'react';
import { useVariableStore } from '@/stores/useVariableStore';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { CrosstabsAnalysisParams } from '../types';
import { formatCaseProcessingSummary, formatCrosstabulationTable } from '../utils/formatters';
import { createPooledWorkerClient, WorkerClient } from '@/utils/workerClient';
import type { Variable } from '@/types/Variable';

export const useCrosstabsAnalysis = (params: CrosstabsAnalysisParams, onClose: () => void) => {
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Keep reference to the pooled worker client so we can terminate / reuse
    const workerClientRef = useRef<WorkerClient<any, any> | null>(null);
    
    const { data, weights } = useAnalysisData();
    const { variables } = useVariableStore();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    const runAnalysis = useCallback(async () => {
        const { rowVariables, columnVariables, options } = params;

        if (rowVariables.length === 0 || columnVariables.length === 0) {
            return;
        }

        setIsCalculating(true);
        setError(null);

        // Acquire a pooled worker for crosstabs analyses
        const workerClient = createPooledWorkerClient('crosstabs');
        workerClientRef.current = workerClient;

        let resultCount = 0;
        let totalJobs = 0;

        const variablePairs: { rowVar: Variable, colVar: Variable }[] = [];
        for (const rowVar of rowVariables) {
            for (const colVar of columnVariables) {
                variablePairs.push({ rowVar, colVar });
            }
        }
        totalJobs = variablePairs.length;

        const handleWorkerMessage = async (eventData: any) => {
            const { variableName, status, results, error: workerError } = eventData;

            resultCount++;
            const [rowVarName, colVarName] = (variableName ?? '').split(' * ');
            const pair = variablePairs.find(p => p.rowVar.name === rowVarName && p.colVar.name === colVarName);

            if (status === 'error') {
                console.error(`Worker error for ${variableName}:`, workerError);
                setError((prev) => prev ? `${prev}\n${variableName}: ${workerError}` : `${variableName}: ${workerError}`);
            } else if (pair) {
                try {
                    const { rowVar, colVar } = pair;
                    const crosstabParams = {
                        ...params,
                        rowVariables: [rowVar],
                        columnVariables: [colVar]
                    };
                    const logMsg = `CROSSTABS TABLES=${rowVar.name} BY ${colVar.name}.`;
                    const logId = await addLog({ log: logMsg });
                    
                    const analyticId = await addAnalytic(logId, {
                        title: "Crosstabs",
                        note: `Crosstabulation for ${rowVar.label || rowVar.name} by ${colVar.label || colVar.name}`
                    });

                    const caseProcessingSummary = formatCaseProcessingSummary(results, crosstabParams);
                    const crosstabulationTable = formatCrosstabulationTable(results, crosstabParams);

                    // Pisahkan Case Processing dan Crosstabs menjadi dua statistik terpisah
                    
                    // Statistik 1: Case Processing Summary
                    if (caseProcessingSummary !== null && analyticId) {
                        await addStatistic(analyticId, {
                            title: `Case Processing: ${rowVar.label || rowVar.name} by ${colVar.label || colVar.name}`,
                            output_data: JSON.stringify({ 
                                tables: [{ 
                                    title: caseProcessingSummary.title, 
                                    columnHeaders: caseProcessingSummary.columnHeaders, 
                                    rows: caseProcessingSummary.rows 
                                }] 
                            }),
                            components: "DataTableRenderer",
                            description: "Case processing summary statistics"
                        });
                    }

                    // Statistik 2: Crosstab Results
                    if (crosstabulationTable !== null && analyticId) {
                        await addStatistic(analyticId, {
                            title: `Crosstabs: ${rowVar.label || rowVar.name} by ${colVar.label || colVar.name}`,
                            output_data: JSON.stringify({ 
                                tables: [{ 
                                    title: crosstabulationTable.title, 
                                    columnHeaders: crosstabulationTable.columnHeaders, 
                                    rows: crosstabulationTable.rows 
                                }] 
                            }),
                            components: "DataTableRenderer",
                            description: "Crosstabulation results"
                        });
                    }
                } catch (e) {
                    const err = e instanceof Error ? e.message : String(e);
                    console.error("Crosstabs Analysis UI Error:", err);
                    setError((prev) => prev ? `${prev}\nUI Error: ${err}` : `UI Error: ${err}`);
                }
            }
            
            if (resultCount === totalJobs) {
                setIsCalculating(false);
                if (!error) onClose();
                // Release the worker back to the pool
                workerClient.terminate();
                workerClientRef.current = null;
            }
        };

        const handleWorkerError = (err: ErrorEvent) => {
            console.error("Worker instantiation error:", err);
            setError(`Failed to load the analysis worker. ${err.message}`);
            setIsCalculating(false);
            workerClient.terminate();
            workerClientRef.current = null;
        };

        workerClient.onMessage(handleWorkerMessage);
        workerClient.onError(handleWorkerError);

        variablePairs.forEach(({ rowVar, colVar }) => {
            const rowVariable = variables.find((v: Variable) => v.name === rowVar.name);
            const colVariable = variables.find((v: Variable) => v.name === colVar.name);

            if (!rowVariable || !colVariable) {
                setError(`Variable definition not found for ${rowVar.name} or ${colVar.name}`);
                return;
            }

            const requiredVars = [
                { name: rowVar.name, index: rowVariable.columnIndex },
                { name: colVar.name, index: colVariable.columnIndex }
            ];

            const analysisData = data.map((d: any[]) => {
                const rowObject: { [key: string]: any } = {};
                requiredVars.forEach(v => {
                    rowObject[v.name] = d[v.index];
                });
                return rowObject;
            });
            
            workerClient.post({
                analysisType: 'crosstabs',
                variable: { row: rowVariable, col: colVariable },
                data: analysisData,
                weights: weights,
                options,
            });
        });
    }, [params, data, weights, variables, addLog, addAnalytic, addStatistic, onClose, error]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (workerClientRef.current) {
                workerClientRef.current.terminate();
                workerClientRef.current = null;
            }
        };
    }, []);

    return { runAnalysis, isCalculating, error };
};
