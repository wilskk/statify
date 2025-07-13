import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import type { Variable } from '@/types/Variable';
import { ExploreAnalysisParams } from '../types';
import { createWorkerClient } from '@/utils/workerClient';
import { formatCaseProcessingSummary, formatDescriptivesTable, formatMEstimatorsTable, formatPercentilesTable, formatExtremeValuesTable } from '../utils';
import { processAndAddPlots } from '../utils/plotProcessor';
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

        // === Debug logging start ===
        console.log("[Explore] Run analysis invoked with params:", params);
        console.log("[Explore] analysisData rows:", analysisData.length);
        console.log("[Explore] dependent vars:", params.dependentVariables.map(v => v.name));
        console.log("[Explore] factor vars:", params.factorVariables.map(v => v.name));
        console.log("[Explore] label var:", params.labelVariable?.name);
        // === Debug logging end ===
        
        let analyticId: number | null = null;
        try {
            const dependentNames = params.dependentVariables.map(v => v.name).join(' ');
            const factorNames = params.factorVariables.map(v => v.name).join(' ');
            const logMsg = `EXPLORE VARIABLES=${dependentNames}${factorNames ? ` BY ${factorNames}` : ''}`;

            const groupedData = groupDataByFactors(analysisData, params.factorVariables);

            // Create log & analytic entry
            try {
                const logId = await addLog({ log: logMsg });
                analyticId = await addAnalytic(logId, {
                    title: "Explore Analysis",
                    note: `Explore analysis for ${dependentNames}`,
                });
            } catch (logErr) {
                console.error('[Explore] Failed to create log/analytic:', logErr);
            }

            console.log("[Explore] Grouped data keys:", Object.keys(groupedData));
            const analysisPromises: Promise<any>[] = [];

            // Prepare promises

            for (const groupKey in groupedData) {
                const group = groupedData[groupKey];
                for (const depVar of params.dependentVariables) {
                    const promise = new Promise((resolve, reject) => {
                        const workerClient = createWorkerClient('/workers/DescriptiveStatistics/examine.worker.js');

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

            console.log('[Explore] Number of analysis promises:', analysisPromises.length);

            const settledPromises = await Promise.allSettled(analysisPromises);

            console.log("[Explore] Worker promises settled results:", settledPromises.map(p => p.status));
            
            const aggregatedResults: Record<string, { factorLevels: Record<string, any>, results: any[] }> = {};
            let taskFailed = false;

            settledPromises.forEach(settled => {
                if (settled.status === 'fulfilled') {
                    const { groupKey, result } = settled.value as { groupKey: string, result: any };
                    console.log(`[Explore] Fulfilled result for group ${groupKey} variable ${result.variable?.name}`);
                    if (!aggregatedResults[groupKey]) {
                        aggregatedResults[groupKey] = {
                            factorLevels: groupedData[groupKey].factorLevels,
                            results: []
                        };
                    }
                    aggregatedResults[groupKey].results.push(result);
                } else {
                    console.error("[Explore] Worker task rejected:", settled.reason);
                    // Log more details if Error object
                    if (settled.reason instanceof Error) {
                        console.error("[Explore] Error message:", settled.reason.message);
                    }
                    taskFailed = true;
                    setError('An analysis task failed');
                }
            });

            console.log("[Explore] AggregatedResults keys:", Object.keys(aggregatedResults));

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

                for (const section of outputSections) {
                    const formatted = section.formatter(aggregatedResults, params);
                    console.log(`[Explore] Formatter ${section.componentName} returned`, formatted ? formatted.rows?.length : 'null');
                    if (formatted) {
                        await addStatistic(analyticId!, {
                            title: formatted.title,
                            output_data: JSON.stringify({ tables: [formatted] }),
                            components: section.componentName,
                            description: formatted.footnotes ? formatted.footnotes.join('\n') : '',
                        });
                    }
                }

                // Generate descriptive plots (histogram / stem-and-leaf)
                try {
                    await processAndAddPlots(analyticId!, groupedData as any, params);
                } catch (plotErr) {
                    console.error('Explore plot generation failed:', plotErr);
                }

                onClose();

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