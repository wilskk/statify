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
        // Helper to build SPSS-like log syntax based on current params
        const generateExploreLog = () => {
            const dependentNames = params.dependentVariables.map(v => v.name).join(' ');
            const factorNames = params.factorVariables.map(v => v.name).join(' ');

            const lines: string[] = [];
            lines.push(`EXAMINE VARIABLES=${dependentNames}${factorNames ? ` BY ${factorNames}` : ''}`);

            // PLOT line
            const plotOpts: string[] = [];
            if (params.boxplotType !== 'none') plotOpts.push('BOXPLOT');
            if (params.showStemAndLeaf) plotOpts.push('STEMLEAF');
            if (params.showHistogram) plotOpts.push('HISTOGRAM');
            if (params.showNormalityPlots) plotOpts.push('NORMALITY');
            if (plotOpts.length) {
                lines.push(`  /PLOT ${plotOpts.join(' ')}`);
            }

            // COMPARE line for boxplot
            if (params.boxplotType === 'dependents-together') {
                lines.push('  /COMPARE VARIABLES');
            } else if (params.boxplotType === 'factor-levels-together') {
                lines.push('  /COMPARE GROUPS');
            }

            // M-Estimators
            if (params.showMEstimators) {
                lines.push('  /MESTIMATORS HUBER(1.339) ANDREW(1.34) HAMPEL(1.7,3.4,8.5) TUKEY(4.685)');
            }

            // Percentiles
            if (params.showPercentiles) {
                lines.push('  /PERCENTILES(5,10,25,50,75,90,95) HAVERAGE');
            }

            // Statistics line
            const stats: string[] = [];
            if (params.showDescriptives) stats.push('DESCRIPTIVES');
            if (params.showOutliers) stats.push('EXTREME');
            if (stats.length) {
                lines.push(`  /STATISTICS ${stats.join(' ')}`);
            }

            // Confidence interval
            lines.push(`  /CINTERVAL ${parseFloat(params.confidenceInterval) || 95}`);

            // Default suffixes
            lines.push('  /MISSING LISTWISE');
            lines.push('  /NOTOTAL.');

            return lines.join('\n');
        };

        // Validation
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

        // Helper to perform analysis for a given subset of factor variables
        const performAnalysisForFactors = async (factorVars: Variable[], logId: number) => {
            // === Debug logging start ===
            console.log("[Explore] Perform analysis for factors:", factorVars.map(v => v.name));
            // === Debug logging end ===

            const localParams: ExploreAnalysisParams = {
                ...params,
                factorVariables: factorVars,
            };

            const dependentNames = localParams.dependentVariables.map(v => v.name).join(' ');
            const factorNames = localParams.factorVariables.map(v => v.name).join(' ');
            // Group data according to current factor set
            const groupedData = groupDataByFactors(analysisData, localParams.factorVariables);

            // Create log & analytic entry
            let analyticId: number | null = null;
            try {
                analyticId = await addAnalytic(logId, {
                    title: `Explore Analysis${factorNames ? ` (BY ${factorNames})` : ''}`,
                    note: `Explore analysis for ${dependentNames}${factorNames ? ` by ${factorNames}` : ''}`,
                });
            } catch (logErr) {
                console.error('[Explore] Failed to create analytic:', logErr);
            }

            console.log("[Explore] Grouped data keys:", Object.keys(groupedData));
            const analysisPromises: Promise<any>[] = [];

            for (const groupKey in groupedData) {
                const group = groupedData[groupKey];
                for (const depVar of localParams.dependentVariables) {
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
                                confidenceInterval: parseFloat(localParams.confidenceInterval) || 95,
                                showMEstimators: localParams.showMEstimators,
                                showPercentiles: localParams.showPercentiles,
                                showOutliers: localParams.showOutliers,
                            },
                        });
                    });
                    analysisPromises.push(promise);
                }
            }

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
                    console.error("[Explore] Worker task rejected:", settled.reason);
                    taskFailed = true;
                    setError('An analysis task failed');
                }
            });

            if (Object.keys(aggregatedResults).length > 0) {
                const outputSections = [
                    { formatter: formatCaseProcessingSummary, componentName: 'Case Processing Summary' },
                    { formatter: formatDescriptivesTable, componentName: 'Descriptives' },
                    { formatter: formatMEstimatorsTable, componentName: 'M-Estimators' },
                    { formatter: formatPercentilesTable, componentName: 'Percentiles' },
                    { formatter: formatExtremeValuesTable, componentName: 'Extreme Values' },
                ];

                for (const section of outputSections) {
                    const formatted = section.formatter(aggregatedResults, localParams);
                    if (formatted) {
                        await addStatistic(analyticId!, {
                            title: formatted.title,
                            output_data: JSON.stringify({ tables: [formatted] }),
                            components: section.componentName,
                            description: formatted.footnotes ? formatted.footnotes.join('\n') : '',
                        });
                    }
                }

                try {
                    await processAndAddPlots(analyticId!, groupedData as any, localParams);
                } catch (plotErr) {
                    console.error('Explore plot generation failed:', plotErr);
                }
            } else {
                if (!taskFailed) setError('Analysis produced no results.');
            }
        };

        try {
            // Determine factor sets: single combined or individual analytics per factor
            const factorSets: Variable[][] = params.factorVariables.length > 1
                ? params.factorVariables.map(f => [f])
                : [params.factorVariables];

            // Create a single log using SPSS-style syntax
            const spssCommand = generateExploreLog();
            const logId = await addLog({ log: spssCommand });

            for (const factorSet of factorSets) {
                await performAnalysisForFactors(factorSet, logId);
            }

            // Close modal after all analyses are complete
            onClose();
        } catch (e) {
            const err = e instanceof Error ? e.message : String(e);
            console.error('Explore Analysis Error:', err);
            setError(`An unexpected error occurred: ${err}`);
        } finally {
            setIsCalculating(false);
        }
    }, [params, analysisData, weights, addLog, addAnalytic, addStatistic, groupDataByFactors, onClose]);

    return { runAnalysis, isCalculating, error };
}; 