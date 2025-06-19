import { useState, useCallback, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { KRelatedSamplesAnalysisParams } from '../types';
import { useDataFetching } from './useDataFetching';
import { useKRelatedSamplesWorker } from './useKRelatedSamplesWorker';

export const useKRelatedSamplesAnalysis = ({
    testVariables,
    testType,
    displayStatistics,
    onClose
}: KRelatedSamplesAnalysisParams) => {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const { fetchData, error: fetchError } = useDataFetching();
    const { calculate, cancelCalculation, error: workerError } = useKRelatedSamplesWorker();
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
        if (testVariables.length < 2) {
            setErrorMsg("Please select at least two test variables.");
            return;
        }

        if (!testType.friedman && !testType.kendallsW && !testType.cochransQ) {
            setErrorMsg("Please select at least one test type.");
            return;
        }

        setErrorMsg(null);
        setIsLoading(true);

        try {
            // 1. Fetch data
            const { variableData } = await fetchData(testVariables);

            // 2. Run calculation using worker
            const result = await calculate({
                variableData,
                testType,
                displayStatistics
            });

            // 3. Save results to database
            const variableNames = testVariables.map(v => v.name);
            let logParts = ['NPAR TESTS'];

            // Only add tests that are enabled
            if (testType.friedman) {
                logParts.push(`{FRIEDMAN=${variableNames.join(" ")}}`);
            }

            if (testType.kendallsW) {
                logParts.push(`{KENDALL=${variableNames.join(" ")}}`);
            }

            if (testType.cochransQ) {
                logParts.push(`{COCHRAN=${variableNames.join(" ")}}`);
            }

            if (displayStatistics.descriptive && displayStatistics.quartile) {
                logParts.push(`{STATISTICS DESCRIPTIVES QUARTILES}`);
            } else if (displayStatistics.descriptive) {
                logParts.push(`{STATISTICS DESCRIPTIVES}`);
            } else if (displayStatistics.quartile) {
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

            if (displayStatistics.descriptive || displayStatistics.quartile) {
                await addStatistic(analyticId, {
                    title: "Descriptive Statistics",
                    output_data: result.descriptives,
                    components: "Descriptive Statistics",
                    description: ""
                });
            }

            if (testType.friedman) {
                await addStatistic(analyticId, {
                    title: "Ranks",
                    output_data: result.ranks,
                    components: "Friedman Test",
                    description: ""
                });

                await addStatistic(analyticId, {
                    title: "Test Statistics",
                    output_data: result.friedmanTest,
                    components: "Friedman Test",
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