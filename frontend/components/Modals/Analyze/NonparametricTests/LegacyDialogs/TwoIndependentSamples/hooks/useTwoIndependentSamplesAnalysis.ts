import { useState, useCallback, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { TwoIndependentSamplesAnalysisParams } from '../types';
import { useDataFetching } from './useDataFetching';
import { useTwoIndependentSamplesWorker } from './useTwoIndependentSamplesWorker';

export const useTwoIndependentSamplesAnalysis = ({
    testVariables,
    groupingVariable,
    group1,
    group2,
    testType,
    displayStatistics,
    onClose
}: TwoIndependentSamplesAnalysisParams) => {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const { fetchData, error: fetchError } = useDataFetching();
    const { calculate, cancelCalculation, error: workerError } = useTwoIndependentSamplesWorker();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    // Update error message if there's an error from data fetching or worker
    useEffect(() => {
        if (fetchError) {
            setErrorMsg(fetchError);
        } else if (workerError) {
            setErrorMsg(workerError);
        }
    }, [fetchError, workerError]);

    const runAnalysis = useCallback(async () => {
        // Validation checks
        if (testVariables.length < 1) {
            setErrorMsg("Please select at least one test variable.");
            return;
        }

        if (!groupingVariable) {
            setErrorMsg("Please select a grouping variable.");
            return;
        }

        if (group1 === null || group2 === null) {
            setErrorMsg("Please define grouping variable range.");
            return;
        }

        if (!testType.mannWhitneyU && !testType.mosesExtremeReactions && 
            !testType.kolmogorovSmirnovZ && !testType.waldWolfowitzRuns) {
            setErrorMsg("Please select at least one test type.");
            return;
        }

        setErrorMsg(null);
        setIsLoading(true);

        try {
            // 1. Fetch data
            const { variableData, groupData } = await fetchData(testVariables, groupingVariable);

            // 2. Run calculation using worker
            const result = await calculate({
                variableData,
                groupData,
                group1,
                group2,
                testType,
                displayStatistics
            });

            // 3. Save results to database
            const variableNames = testVariables.map(v => v.name);
            let logParts = ['NPAR TESTS'];

            // Only add tests that are enabled
            if (testType.mannWhitneyU) {
                logParts.push(`{M-W=${variableNames.join(" ")} BY ${groupingVariable.name}(${group1} ${group2})}`);
            }

            if (testType.mosesExtremeReactions) {
                logParts.push(`{MOSES=${variableNames.join(" ")} BY ${groupingVariable.name}(${group1} ${group2})}`);
            }

            if (testType.kolmogorovSmirnovZ) {
                logParts.push(`{K-S=${variableNames.join(" ")} BY ${groupingVariable.name}(${group1} ${group2})}`);
            }

            if (testType.waldWolfowitzRuns) {
                logParts.push(`{W-W=${variableNames.join(" ")} BY ${groupingVariable.name}(${group1} ${group2})}`);
            }

            if (displayStatistics.descriptive && displayStatistics.quartiles) {
                logParts.push(`{STATISTICS DESCRIPTIVES QUARTILES}`);
            } else if (displayStatistics.descriptive) {
                logParts.push(`{STATISTICS DESCRIPTIVES}`);
            } else if (displayStatistics.quartiles) {
                logParts.push(`{STATISTICS QUARTILES}`);
            }

            // Join all parts with spaces
            let logMsg = logParts.join(' ');

            // If no tests are selected, provide a default message
            if (logParts.length === 1) {
                logMsg = 'NPAR TESTS {No specific tests selected}';
            }

            const logId = await addLog({ log: logMsg });
            const analyticId = await addAnalytic(logId, { title: "NPar Tests", note: "" });

            if (displayStatistics.descriptive || displayStatistics.quartiles) {
                await addStatistic(analyticId, {
                    title: "Descriptive Statistics",
                    output_data: result.descriptives,
                    components: "Descriptive Statistics",
                    description: ""
                });
            }

            if (testType.mannWhitneyU) {
                await addStatistic(analyticId, {
                    title: "Ranks",
                    output_data: result.ranks,
                    components: "Mann-Whitney Test",
                    description: ""
                });

                await addStatistic(analyticId, {
                    title: "Test Statistics",
                    output_data: result.mannWhitneyU,
                    components: "Mann-Whitney Test",
                    description: ""
                });
            }

            if (testType.kolmogorovSmirnovZ) {
                await addStatistic(analyticId, {
                    title: "Frequencies",
                    output_data: result.kolmogorovSmirnovZFrequencies,
                    components: "Two-Samples Kolmogorov-Smirnov Test",
                    description: ""
                });

                await addStatistic(analyticId, {
                    title: "Test Statistics",
                    output_data: result.kolmogorovSmirnovZ,
                    components: "Two-Samples Kolmogorov-Smirnov Test",
                    description: ""
                });
            }

            // Close the modal after successful analysis
            setIsLoading(false);
            onClose();
        } catch (error) {
            console.error(error);
            setErrorMsg(error instanceof Error ? error.message : 'An error occurred during analysis');
            setIsLoading(false);
        }
    }, [
        testVariables,
        groupingVariable,
        group1,
        group2,
        testType,
        displayStatistics,
        fetchData,
        calculate,
        addLog,
        addAnalytic,
        addStatistic,
        onClose
    ]);

    return {
        isLoading,
        errorMsg,
        runAnalysis,
        cancelAnalysis: cancelCalculation
    };
}; 