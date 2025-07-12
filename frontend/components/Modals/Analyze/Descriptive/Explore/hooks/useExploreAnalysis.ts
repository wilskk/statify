import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import type { Variable } from '@/types/Variable';
import { ExploreAnalysisParams } from '../types';
import { createPooledWorkerClient } from '@/utils/workerClient';
import { formatCaseProcessingSummary, formatDescriptivesTable, formatMEstimatorsTable, formatPercentilesTable, formatExtremeValuesTable } from '../utils';
import { useAnalysisData } from '@/hooks/useAnalysisData';

interface GroupedData {
    [key: string]: {
        factorLevels: Record<string, string | number>;
        data: any[];
    };
}

export const useExploreAnalysis = (params: ExploreAnalysisParams, onClose: () => void) => {
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { data: analysisData, weights } = useAnalysisData();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    const groupDataByFactors = useCallback((currentData: any[], factorVariables: Variable[]): GroupedData => {
        if (factorVariables.length === 0 || factorVariables.every(v => v === null)) {
            return { 'all_data': { factorLevels: {}, data: currentData } };
        }
        const grouped: GroupedData = {};
        currentData.forEach((row: any) => {
            const key = factorVariables.map(v => row[v.columnIndex]).join(' | ');
            if (!grouped[key]) {
                grouped[key] = {
                    factorLevels: factorVariables.reduce((acc, v) => {
                        acc[v.name] = row[v.columnIndex];
                        return acc;
                    }, {} as Record<string, string | number>),
                    data: []
                };
            }
            grouped[key].data.push(row);
        });
        return grouped;
    }, []);

    const runAnalysis = useCallback(async () => {
        if (params.dependentVariables.length === 0) {
            setError("Please select at least one dependent variable.");
            return;
        }

        if (!analysisData || analysisData.length === 0) {
            setError("No data available to analyze.");
            return;
        }

        setIsCalculating(true);
        setError(null);

        let analyticId: number | null = null;
        try {
            const dependentNames = params.dependentVariables.map(v => v.name).join(' ');
            const factorNames = params.factorVariables.map(v => v.name).join(' ');
            const logMsg = `EXPLORE VARIABLES=${dependentNames}${factorNames ? ` BY ${factorNames}` : ''}`;

            const groupedData = groupDataByFactors(analysisData, params.factorVariables);
            const analysisPromises: Promise<any>[] = [];

            for (const groupKey in groupedData) {
                const group = groupedData[groupKey];
                for (const depVar of params.dependentVariables) {
                    const promise = new Promise((resolve, reject) => {
                        const workerClient = createPooledWorkerClient('examine');

                        workerClient.onMessage((eventData: any) => {
                            if (eventData.status === 'success') {
                                resolve({ groupKey, result: { ...eventData.results, variable: depVar } });
                            } else {
                                reject(new Error(eventData.error));
                            }
                            workerClient.terminate();
                        });

                        workerClient.onError((err: ErrorEvent) => {
                            reject(new Error(`Worker error for ${depVar.name}: ${err.message}`));
                            workerClient.terminate();
                        });

                        const dataForVar = group.data.map((d: any) => d[depVar.columnIndex]);

                        workerClient.post({
                            analysisType: 'examine',
                            variable: depVar,
                            data: dataForVar,
                            weights: weights,
                            options: {
                                confidenceInterval: parseFloat(params.confidenceInterval) || 95,
                                showMEstimators: params.showMEstimators,
                                showPercentiles: params.showPercentiles,
                                showOutliers: params.showOutliers,
                            },
                        });
                    });
                    analysisPromises.push(promise);
                }
            }

            const logId = await addLog({ log: logMsg });
            analyticId = await addAnalytic(logId, {
                title: "Explore Analysis",
                note: `Explore analysis for ${dependentNames}`
            });

            const settledPromises = await Promise.allSettled(analysisPromises);
            
            const aggregatedResults: Record<string, { factorLevels: Record<string, any>, results: any[] }> = {};
            let taskFailed = false;

            settledPromises.forEach(settled => {
                if (settled.status === 'fulfilled') {
                    const { groupKey, result } = settled.value as { groupKey: string, result: any };
                    if (!aggregatedResults[groupKey]) {
                        aggregatedResults[groupKey] = {
                            factorLevels: groupedData[groupKey].factorLevels,
                            results: []
                        };
                    }
                    aggregatedResults[groupKey].results.push(result);
                } else {
                    console.error("A worker task failed:", settled.reason);
                    taskFailed = true;
                    setError('An analysis task failed');
                }
            });

            if (Object.keys(aggregatedResults).length > 0) {
                const dependentNames = params.dependentVariables.map(v => v.name).join(' ');

                const outputSections = [
                    {
                        formatter: formatCaseProcessingSummary,
                        componentName: "Case Processing Summary",
                        title: (depName: string) => `Case Processing Summary: ${depName}`
                    },
                    {
                        formatter: formatDescriptivesTable,
                        componentName: "Descriptives",
                        title: (depName: string) => `Descriptives: ${depName}`
                    },
                    {
                        formatter: formatMEstimatorsTable,
                        componentName: "M-Estimators",
                        title: (depName: string) => `M-Estimators: ${depName}`
                    },
                    {
                        formatter: formatPercentilesTable,
                        componentName: "Percentiles",
                        title: (depName:string) => `Percentiles: ${depName}`
                    },
                    {
                        formatter: formatExtremeValuesTable,
                        componentName: "Extreme Values",
                        title: (depName:string) => `Extreme Values: ${depName}`
                    },
                ];

                const tablesToSend: any[] = [];
                const components: string[] = [];
                let description = `Explore analysis for ${dependentNames}.`;

                outputSections.forEach(section => {
                    const formatted = section.formatter(aggregatedResults, params);
                    if (formatted) {
                        tablesToSend.push({ title: formatted.title, columnHeaders: formatted.columnHeaders, rows: formatted.rows });
                        if (formatted.footnotes && formatted.footnotes.length > 0) {
                            description += `\n\n${formatted.footnotes.join('\n')}`;
                        }
                        components.push(section.componentName);
                    }
                });

                if (tablesToSend.length > 0) {
                    await addStatistic(analyticId!, {
                        title: `Explore Results: ${dependentNames}`,
                        output_data: JSON.stringify({ tables: tablesToSend }),
                        components: components.join(', '),
                        description,
                    });
                    onClose();
                } else {
                    if (!taskFailed) setError("Analysis produced no displayable results.");
                }

            } else {
                if (!taskFailed) setError("Analysis produced no results.");
            }

        } catch (e) {
            const err = e instanceof Error ? e.message : String(e);
            console.error("Explore Analysis Error:", err);
            setError(`An unexpected error occurred: ${err}`);
        } finally {
            setIsCalculating(false);
        }
    }, [params, analysisData, weights, addLog, addAnalytic, addStatistic, groupDataByFactors, onClose]);

    return { runAnalysis, isCalculating, error };
}; 