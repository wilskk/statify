import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import type { Variable } from '@/types/Variable';
import { ExploreAnalysisParams } from '../types';
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
            const logId = await addLog({ log: logMsg });
            analyticId = await addAnalytic(logId, {
                title: "Explore Analysis",
                note: `Explore analysis for ${dependentNames}`
            });

            const groupedData = groupDataByFactors(analysisData, params.factorVariables);
            const analysisPromises = [];
            
            for (const groupKey in groupedData) {
                const group = groupedData[groupKey];
                for (const depVar of params.dependentVariables) {
                    
                    const promise = new Promise((resolve, reject) => {
                        const worker = new Worker('/workers/DescriptiveStatistics/manager.js');

                        worker.onmessage = (e) => {
                            if (e.data.status === 'success') {
                                resolve({ groupKey, result: { ...e.data.results, variable: depVar } });
                            } else {
                                reject(new Error(e.data.error));
                            }
                            worker.terminate();
                        };

                        worker.onerror = (e) => {
                            reject(new Error(`Worker error for ${depVar.name}: ${e.message}`));
                            worker.terminate();
                        };

                        const dataForVar = group.data.map((d: any) => d[depVar.columnIndex]);
                        
                        worker.postMessage({
                            analysisType: 'examine',
                            variable: depVar,
                            data: dataForVar,
                            weights: weights,
                            options: {
                                confidenceInterval: parseFloat(params.confidenceInterval) || 95,
                                showMEstimators: params.showMEstimators,
                                showPercentiles: params.showPercentiles,
                                showOutliers: params.showOutliers,
                            }
                        });
                    });
                    analysisPromises.push(promise);
                }
            }

            const settledPromises = await Promise.allSettled(analysisPromises);
            
            const aggregatedResults: Record<string, { factorLevels: Record<string, any>, results: any[] }> = {};

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
                    if(!error) setError(settled.reason?.message || 'An analysis task failed.');
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

                let hasAddedStatistic = false;

                for (const section of outputSections) {
                    const formattedOutput = section.formatter(aggregatedResults, params);
                    if (formattedOutput) {
                        const tables = [{ title: formattedOutput.title, columnHeaders: formattedOutput.columnHeaders, rows: formattedOutput.rows }];
                        const footnotes = formattedOutput.footnotes || [];
                        let description = `Explore analysis for ${dependentNames}.`;
                        if (footnotes.length > 0) {
                            description += `\n\n${footnotes.join('\n')}`;
                        }

                        await addStatistic(analyticId!, {
                            title: section.title(dependentNames),
                            output_data: JSON.stringify({ tables }),
                            components: section.componentName,
                            description: description,
                        });
                        hasAddedStatistic = true;
                    }
                }
                
                if (hasAddedStatistic) {
                    onClose();
                } else {
                    if (!error) setError("Analysis produced no displayable results.");
                }

            } else {
                if (!error) setError("Analysis produced no results.");
            }

        } catch (e) {
            const err = e instanceof Error ? e.message : String(e);
            console.error("Explore Analysis Error:", err);
            setError(`An unexpected error occurred: ${err}`);
        } finally {
            setIsCalculating(false);
        }
    }, [params, analysisData, weights, addLog, addAnalytic, addStatistic, groupDataByFactors, onClose, error]);

    return { runAnalysis, isCalculating, error };
}; 