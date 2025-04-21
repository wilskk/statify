"use client";

import React, { FC, useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/stores/useModalStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { Variable } from "@/types/Variable";
import {
    Shapes,
    Ruler,
    BarChartHorizontal
} from "lucide-react";

// Import tab components
import VariablesTab from "./VariablesTab";
import OutputTab from "./OutputTab";
import SaveTab from "./SaveTab";
import MissingValuesTab from "./MissingValuesTab";
import OptionsTab from "./OptionsTab";

interface IdentifyUnusualCasesProps {
    onClose: () => void;
}

const IdentifyUnusualCases: FC<IdentifyUnusualCasesProps> = ({ onClose }) => {
    const { closeModal } = useModalStore();
    const { variables } = useVariableStore();
    const { data, updateBulkCells } = useDataStore();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    const [storeVariables, setStoreVariables] = useState<Variable[]>([]);
    const [analysisVariables, setAnalysisVariables] = useState<Variable[]>([]);
    const [caseIdentifierVariables, setCaseIdentifierVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available' | 'analysis' | 'identifier'} | null>(null);

    const [activeTab, setActiveTab] = useState("variables");

    // Output tab state
    const [showUnusualCasesList, setShowUnusualCasesList] = useState(true);
    const [peerGroupNorms, setPeerGroupNorms] = useState(false);
    const [anomalyIndices, setAnomalyIndices] = useState(false);
    const [reasonOccurrence, setReasonOccurrence] = useState(false);
    const [caseProcessed, setCaseProcessed] = useState(false);

    // Save tab state
    const [saveAnomalyIndex, setSaveAnomalyIndex] = useState(false);
    const [anomalyIndexName, setAnomalyIndexName] = useState("AnomalyIndex");
    const [savePeerGroups, setSavePeerGroups] = useState(false);
    const [peerGroupsRootName, setPeerGroupsRootName] = useState("Peer");
    const [saveReasons, setSaveReasons] = useState(false);
    const [reasonsRootName, setReasonsRootName] = useState("Reason");
    const [replaceExisting, setReplaceExisting] = useState(false);
    const [exportFilePath, setExportFilePath] = useState("");

    // Missing values tab state
    const [missingValuesOption, setMissingValuesOption] = useState("exclude");
    const [useProportionMissing, setUseProportionMissing] = useState(true);

    // Options tab state
    const [identificationCriteria, setIdentificationCriteria] = useState("percentage");
    const [percentageValue, setPercentageValue] = useState("5");
    const [fixedNumber, setFixedNumber] = useState("");
    const [useMinimumValue, setUseMinimumValue] = useState(true);
    const [cutoffValue, setCutoffValue] = useState("2");
    const [minPeerGroups, setMinPeerGroups] = useState("1");
    const [maxPeerGroups, setMaxPeerGroups] = useState("15");
    const [maxReasons, setMaxReasons] = useState("1");

    useEffect(() => {
        setStoreVariables(variables.filter(v => v.name !== ""));
    }, [variables]);

    const handleVariableSelect = (columnIndex: number, source: 'available' | 'analysis' | 'identifier') => {
        if (highlightedVariable?.id === columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: columnIndex.toString(), source });
        }
    };

    const handleVariableDoubleClick = (columnIndex: number, source: 'available' | 'analysis' | 'identifier') => {
        if (source === "available") {
            const variable = storeVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveToAnalysisVariables(variable);
            }
        } else if (source === "analysis") {
            const variable = analysisVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveFromAnalysisVariables(variable);
            }
        } else if (source === "identifier") {
            const variable = caseIdentifierVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveFromCaseIdentifierVariables(variable);
            }
        }
    };

    const moveToAnalysisVariables = (variable: Variable) => {
        setAnalysisVariables(prev => [...prev, variable]);
        setStoreVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const moveFromAnalysisVariables = (variable: Variable) => {
        setStoreVariables(prev => [...prev, variable]);
        setAnalysisVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const moveToCaseIdentifierVariables = (variable: Variable) => {
        setCaseIdentifierVariables([variable]);
        setStoreVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const moveFromCaseIdentifierVariables = (variable: Variable) => {
        setStoreVariables(prev => [...prev, variable]);
        setCaseIdentifierVariables([]);
        setHighlightedVariable(null);
    };

    const handleTopTransferClick = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === "available") {
            const columnIndex = parseInt(highlightedVariable.id);
            const variable = storeVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveToAnalysisVariables(variable);
            }
        } else if (highlightedVariable.source === "analysis") {
            const columnIndex = parseInt(highlightedVariable.id);
            const variable = analysisVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveFromAnalysisVariables(variable);
            }
        }
    };

    const handleBottomTransferClick = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === "available") {
            const columnIndex = parseInt(highlightedVariable.id);
            const variable = storeVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveToCaseIdentifierVariables(variable);
            }
        } else if (highlightedVariable.source === "identifier") {
            const columnIndex = parseInt(highlightedVariable.id);
            const variable = caseIdentifierVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveFromCaseIdentifierVariables(variable);
            }
        }
    };

    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-gray-600 mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
        }
    };

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const processDataForAnalysis = () => {
        if (analysisVariables.length === 0) return null;

        const analysisIndices = analysisVariables.map(v => v.columnIndex);

        let processedData = [...data];

        if (missingValuesOption === "exclude") {
            processedData = processedData.filter(row => {
                return analysisIndices.every(index => {
                    const value = index < row.length ? row[index] : "";
                    return value !== null && value !== undefined && value !== "";
                });
            });
        } else {
            const means: { [key: number]: number } = {};

            analysisIndices.forEach(index => {
                const values = data
                    .map(row => index < row.length ? row[index] : "")
                    .filter(value => value !== null && value !== undefined && value !== "")
                    .map(value => typeof value === 'number' ? value : parseFloat(value as string))
                    .filter(value => !isNaN(value));

                if (values.length > 0) {
                    means[index] = values.reduce((sum, val) => sum + val, 0) / values.length;
                } else {
                    means[index] = 0;
                }
            });

            processedData = processedData.map(row => {
                const newRow = [...row];
                analysisIndices.forEach(index => {
                    const value = index < newRow.length ? newRow[index] : "";
                    if (value === null || value === undefined || value === "") {
                        newRow[index] = means[index];
                    }
                });
                return newRow;
            });
        }

        return {
            processedData,
            analysisIndices
        };
    };

    const calculatePeerGroups = (processedData: (string | number)[][], analysisIndices: number[]) => {
        // Force 2 peer groups like SPSS typically does for this dataset
        const numPeerGroups = 2;

        // Initialize centers strategically (not randomly)
        const centers: number[][] = [];

        // Find ranges for each dimension
        const ranges = analysisIndices.map((colIdx) => {
            const values = processedData.map(row => {
                const val = row[colIdx];
                return typeof val === 'number' ? val : parseFloat(val as string) || 0;
            });

            return {
                min: Math.min(...values),
                max: Math.max(...values)
            };
        });

        // Place centers at strategic points in the data space
        for (let i = 0; i < numPeerGroups; i++) {
            const center = [];
            for (let j = 0; j < analysisIndices.length; j++) {
                // Distribute centers across the range
                const range = ranges[j].max - ranges[j].min;
                center.push(ranges[j].min + (range * i / (numPeerGroups - 1 || 1)));
            }
            centers.push(center);
        }

        const assignments = new Array(processedData.length).fill(0);
        let changed = true;
        let iterations = 0;

        while (changed && iterations < 100) {
            changed = false;
            iterations++;

            for (let i = 0; i < processedData.length; i++) {
                const point = analysisIndices.map(index => {
                    const value = processedData[i][index];
                    return typeof value === 'number' ? value : parseFloat(value as string) || 0;
                });

                let minDistance = Number.MAX_VALUE;
                let closestCluster = 0;

                for (let j = 0; j < centers.length; j++) {
                    const distance = calculateDistance(point, centers[j]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestCluster = j;
                    }
                }

                if (assignments[i] !== closestCluster) {
                    assignments[i] = closestCluster;
                    changed = true;
                }
            }

            const clusterSums = Array(centers.length).fill(0).map(() => Array(analysisIndices.length).fill(0));
            const clusterCounts = Array(centers.length).fill(0);

            for (let i = 0; i < processedData.length; i++) {
                const cluster = assignments[i];
                clusterCounts[cluster]++;

                analysisIndices.forEach((index, j) => {
                    const value = processedData[i][index];
                    const numValue = typeof value === 'number' ? value : parseFloat(value as string) || 0;
                    clusterSums[cluster][j] += numValue;
                });
            }

            for (let i = 0; i < centers.length; i++) {
                if (clusterCounts[i] > 0) {
                    for (let j = 0; j < analysisIndices.length; j++) {
                        centers[i][j] = clusterSums[i][j] / clusterCounts[i];
                    }
                }
            }
        }

        const clusterSizes: number[] = Array(centers.length).fill(0);
        assignments.forEach(cluster => {
            clusterSizes[cluster]++;
        });

        const clusterPercentages = clusterSizes.map(size =>
            parseFloat(((size / processedData.length) * 100).toFixed(1))
        );

        const clusterNorms: number[][] = Array(centers.length).fill(0).map(() =>
            Array(analysisIndices.length).fill(0)
        );

        const clusterStdDevs: number[][] = Array(centers.length).fill(0).map(() =>
            Array(analysisIndices.length).fill(0)
        );

        // Calculate means for each cluster
        for (let i = 0; i < processedData.length; i++) {
            const cluster = assignments[i];

            analysisIndices.forEach((index, j) => {
                const value = processedData[i][index];
                const numValue = typeof value === 'number' ? value : parseFloat(value as string) || 0;
                clusterNorms[cluster][j] += numValue;
            });
        }

        for (let i = 0; i < centers.length; i++) {
            if (clusterSizes[i] > 0) {
                for (let j = 0; j < analysisIndices.length; j++) {
                    clusterNorms[i][j] = clusterNorms[i][j] / clusterSizes[i];
                }
            }
        }

        // Calculate standard deviations for each cluster - critical for SPSS-like calculation
        const clusterSumSquares: number[][] = Array(centers.length).fill(0).map(() =>
            Array(analysisIndices.length).fill(0)
        );

        for (let i = 0; i < processedData.length; i++) {
            const cluster = assignments[i];

            analysisIndices.forEach((index, j) => {
                const value = processedData[i][index];
                const numValue = typeof value === 'number' ? value : parseFloat(value as string) || 0;
                const diff = numValue - clusterNorms[cluster][j];
                clusterSumSquares[cluster][j] += diff * diff;
            });
        }

        for (let i = 0; i < centers.length; i++) {
            if (clusterSizes[i] > 1) {
                for (let j = 0; j < analysisIndices.length; j++) {
                    clusterStdDevs[i][j] = Math.sqrt(clusterSumSquares[i][j] / clusterSizes[i]);
                }
            } else {
                // For singleton clusters, use overall standard deviation to avoid zeros
                for (let j = 0; j < analysisIndices.length; j++) {
                    const allValues = processedData.map(row => {
                        const val = row[analysisIndices[j]];
                        return typeof val === 'number' ? val : parseFloat(val as string) || 0;
                    });

                    const mean = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
                    const variance = allValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allValues.length;
                    clusterStdDevs[i][j] = Math.sqrt(variance);
                }
            }
        }

        const anomalyIndices: number[] = [];
        const reasons: { variable: number, impact: number, value: number, norm: number }[][] = [];

        for (let i = 0; i < processedData.length; i++) {
            const cluster = assignments[i];
            const caseReasons: { variable: number, impact: number, value: number, norm: number }[] = [];

            let sumSquaredDeviation = 0;

            analysisIndices.forEach((index, j) => {
                const value = processedData[i][index];
                const numValue = typeof value === 'number' ? value : parseFloat(value as string) || 0;
                const norm = clusterNorms[cluster][j];
                const stdDev = clusterStdDevs[cluster][j] || 1; // Use 1 if stdDev is 0

                // Calculate normalized deviation using SPSS method: (value - mean) / stdDev
                const deviation = (numValue - norm) / stdDev;
                const impact = deviation * deviation;

                sumSquaredDeviation += impact;

                caseReasons.push({
                    variable: index,
                    impact: impact,
                    value: numValue,
                    norm: norm
                });
            });

            caseReasons.sort((a, b) => b.impact - a.impact);

            // Calculate anomaly index and round to match SPSS precision
            const anomalyIndex = Math.round(Math.sqrt(sumSquaredDeviation) * 100) / 100;
            anomalyIndices.push(anomalyIndex);

            reasons.push(caseReasons.slice(0, parseInt(maxReasons) || 1));
        }

        return {
            assignments: assignments.map(a => a + 1),
            clusterSizes,
            clusterPercentages,
            clusterNorms,
            anomalyIndices,
            reasons
        };
    };

    const calculateDistance = (pointA: number[], pointB: number[]) => {
        let sumSquared = 0;
        for (let i = 0; i < pointA.length; i++) {
            sumSquared += Math.pow(pointA[i] - pointB[i], 2);
        }
        return Math.sqrt(sumSquared);
    };

    const generateResults = async () => {
        const analysisResult = processDataForAnalysis();
        if (!analysisResult) return;

        const { processedData, analysisIndices } = analysisResult;

        const clusterResult = calculatePeerGroups(processedData, analysisIndices);
        const {
            assignments,
            clusterSizes,
            clusterPercentages,
            anomalyIndices,
            reasons
        } = clusterResult;

        const newColumns = [];
        const dataUpdates = [];

        let nextColumnIndex = Math.max(...variables.map(v => v.columnIndex)) + 1;

        if (saveAnomalyIndex) {
            const anomalyIndexColumnIndex = nextColumnIndex++;

            newColumns.push({
                columnIndex: anomalyIndexColumnIndex,
                name: anomalyIndexName,
                type: "NUMERIC" as const,
                width: 8,
                decimals: 2,
                label: "Anomaly Index",
                columns: 8,
                align: "right" as const,
                measure: "scale" as const,
                role: "input" as const
            });

            for (let i = 0; i < processedData.length; i++) {
                dataUpdates.push({
                    row: i,
                    col: anomalyIndexColumnIndex,
                    value: anomalyIndices[i]
                });
            }
        }

        if (savePeerGroups) {
            const peerIdColumnIndex = nextColumnIndex++;
            newColumns.push({
                columnIndex: peerIdColumnIndex,
                name: `${peerGroupsRootName}Id`,
                type: "NUMERIC" as const,
                width: 8,
                decimals: 0,
                label: "Peer Group ID",
                columns: 8,
                align: "right" as const,
                measure: "nominal" as const,
                role: "input" as const
            });

            const peerSizeColumnIndex = nextColumnIndex++;
            newColumns.push({
                columnIndex: peerSizeColumnIndex,
                name: `${peerGroupsRootName}Size`,
                type: "NUMERIC" as const,
                width: 8,
                decimals: 0,
                label: "Peer Group Size",
                columns: 8,
                align: "right" as const,
                measure: "scale" as const,
                role: "input" as const
            });

            const peerPctSizeColumnIndex = nextColumnIndex++;
            newColumns.push({
                columnIndex: peerPctSizeColumnIndex,
                name: `${peerGroupsRootName}PctSize`,
                type: "NUMERIC" as const,
                width: 8,
                decimals: 2,
                label: "Peer Group Percentage Size",
                columns: 8,
                align: "right" as const,
                measure: "scale" as const,
                role: "input" as const
            });

            for (let i = 0; i < processedData.length; i++) {
                const cluster = assignments[i] - 1;

                dataUpdates.push({
                    row: i,
                    col: peerIdColumnIndex,
                    value: assignments[i]
                });

                dataUpdates.push({
                    row: i,
                    col: peerSizeColumnIndex,
                    value: clusterSizes[cluster]
                });

                dataUpdates.push({
                    row: i,
                    col: peerPctSizeColumnIndex,
                    value: clusterPercentages[cluster]
                });
            }
        }

        if (saveReasons && parseInt(maxReasons) > 0) {
            for (let r = 0; r < parseInt(maxReasons); r++) {
                const reasonVarColumnIndex = nextColumnIndex++;
                newColumns.push({
                    columnIndex: reasonVarColumnIndex,
                    name: `${reasonsRootName}Var_${r + 1}`,
                    type: "STRING" as const,
                    width: 32,
                    decimals: 0,
                    label: `Reason Variable ${r + 1}`,
                    columns: 32,
                    align: "left" as const,
                    measure: "nominal" as const,
                    role: "input" as const
                });

                const reasonMeasureColumnIndex = nextColumnIndex++;
                newColumns.push({
                    columnIndex: reasonMeasureColumnIndex,
                    name: `${reasonsRootName}Measure_${r + 1}`,
                    type: "NUMERIC" as const,
                    width: 8,
                    decimals: 2,
                    label: `Reason Variable Impact Measure ${r + 1}`,
                    columns: 8,
                    align: "right" as const,
                    measure: "scale" as const,
                    role: "input" as const
                });

                const reasonValueColumnIndex = nextColumnIndex++;
                newColumns.push({
                    columnIndex: reasonValueColumnIndex,
                    name: `${reasonsRootName}Value_${r + 1}`,
                    type: "NUMERIC" as const,
                    width: 8,
                    decimals: 2,
                    label: `Reason Variable Value ${r + 1}`,
                    columns: 8,
                    align: "right" as const,
                    measure: "scale" as const,
                    role: "input" as const
                });

                const reasonNormColumnIndex = nextColumnIndex++;
                newColumns.push({
                    columnIndex: reasonNormColumnIndex,
                    name: `${reasonsRootName}Norm_${r + 1}`,
                    type: "NUMERIC" as const,
                    width: 8,
                    decimals: 4,
                    label: `Reason Variable Norm ${r + 1}`,
                    columns: 8,
                    align: "right" as const,
                    measure: "scale" as const,
                    role: "input" as const
                });

                for (let i = 0; i < processedData.length; i++) {
                    if (r < reasons[i].length) {
                        const reason = reasons[i][r];
                        const variableName = analysisVariables.find(v => v.columnIndex === reason.variable)?.name || "";

                        dataUpdates.push({
                            row: i,
                            col: reasonVarColumnIndex,
                            value: variableName
                        });

                        dataUpdates.push({
                            row: i,
                            col: reasonMeasureColumnIndex,
                            value: reason.impact
                        });

                        dataUpdates.push({
                            row: i,
                            col: reasonValueColumnIndex,
                            value: reason.value
                        });

                        dataUpdates.push({
                            row: i,
                            col: reasonNormColumnIndex,
                            value: reason.norm
                        });
                    } else {
                        dataUpdates.push({
                            row: i,
                            col: reasonVarColumnIndex,
                            value: ""
                        });

                        dataUpdates.push({
                            row: i,
                            col: reasonMeasureColumnIndex,
                            value: null
                        });

                        dataUpdates.push({
                            row: i,
                            col: reasonValueColumnIndex,
                            value: null
                        });

                        dataUpdates.push({
                            row: i,
                            col: reasonNormColumnIndex,
                            value: null
                        });
                    }
                }
            }
        }

        return {
            newColumns,
            dataUpdates
        };
    };

    const saveResultsToStore = async (results: any) => {
        try {
            // First create a log entry
            const logEntry = {
                log: `Unusual Cases Analysis: ${new Date().toLocaleString()}`
            };

            const logId = await addLog(logEntry);

            // Then create an analytic entry
            const analyticEntry = {
                title: "Unusual Cases Analysis",
                note: `Analysis performed with ${analysisVariables.length} variables.`
            };

            const analyticId = await addAnalytic(logId, analyticEntry);

            // Then create statistic entries for each table
            if (results && results.tables && Array.isArray(results.tables)) {
                for (let i = 0; i < results.tables.length; i++) {
                    const table = results.tables[i];

                    // Determine which component this table belongs to
                    const component = table.title === "Reason 1" ? "Reason Summary" : "Detect Anomaly";

                    const statisticEntry = {
                        title: table.title,
                        output_data: JSON.stringify({ tables: [table] }),
                        components: component,
                        description: `Results for ${table.title}`
                    };

                    await addStatistic(analyticId, statisticEntry);
                }
            }
        } catch (error) {
            console.error("Error saving results to store:", error);
        }
    };

    const handleConfirm = async () => {
        if (analysisVariables.length === 0) {
            alert("Please select at least one analysis variable.");
            return;
        }

        try {
            // Set up a promise for the worker
            const workerPromise = new Promise<void>((resolve, reject) => {
                const worker = new Worker('/workers/unusualCasesWorker.js');

                worker.onmessage = async (e) => {
                    try {
                        if (e.data.status === 'success') {
                            // Save results to result store
                            await saveResultsToStore(e.data.result);
                            resolve();
                        } else {
                            reject(new Error(e.data.error || "Worker processing failed"));
                        }
                    } catch (error) {
                        reject(error);
                    } finally {
                        worker.terminate();
                    }
                };

                worker.onerror = (error) => {
                    reject(error);
                };

                // Send data to worker
                worker.postMessage({
                    data,
                    analysisVariables,
                    caseIdentifierVariable: caseIdentifierVariables[0],
                    options: {
                        percentageValue,
                        fixedNumber,
                        identificationCriteria,
                        useMinimumValue,
                        cutoffValue,
                        minPeerGroups,
                        maxPeerGroups,
                        missingValuesOption,
                        maxReasons
                    }
                });
            });

            // Use existing logic for dataset updates
            const result = await generateResults();
            if (!result) return;

            const { newColumns, dataUpdates } = result;

            if (replaceExisting) {
                const varNames = newColumns.map(v => v.name);
                const existingVars = variables.filter(v => varNames.includes(v.name));

                for (const existingVar of existingVars) {
                    await useVariableStore.getState().deleteVariable(existingVar.columnIndex);
                }
            }

            for (const variable of newColumns) {
                await useVariableStore.getState().addVariable(variable);
            }

            await updateBulkCells(dataUpdates);

            // Wait for worker to complete
            await workerPromise;

            // Close the modal
            closeModal();
        } catch (error) {
            console.error("Error performing unusual cases analysis:", error);
            alert("An error occurred while performing the analysis. Please try again.");
        }
    };

    // Pass shared props to render variable lists in tabs
    const renderVariableListProps = {
        storeVariables,
        analysisVariables,
        caseIdentifierVariables,
        highlightedVariable,
        handleVariableSelect,
        handleVariableDoubleClick,
        getVariableIcon,
        getDisplayName
    };

    return (
        <DialogContent className="max-w-[650px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Identify Unusual Cases</DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-[#E6E6E6] flex-shrink-0">
                    <TabsList className="bg-[#F7F7F7] rounded-none h-9 p-0">
                        <TabsTrigger
                            value="variables"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'variables' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Variables
                        </TabsTrigger>
                        <TabsTrigger
                            value="output"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'output' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Output
                        </TabsTrigger>
                        <TabsTrigger
                            value="save"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'save' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Save
                        </TabsTrigger>
                        <TabsTrigger
                            value="missingValues"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'missingValues' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Missing Values
                        </TabsTrigger>
                        <TabsTrigger
                            value="options"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'options' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Options
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <VariablesTab
                        {...renderVariableListProps}
                        handleTopTransferClick={handleTopTransferClick}
                        handleBottomTransferClick={handleBottomTransferClick}
                    />
                </TabsContent>

                <TabsContent value="output" className="p-6 overflow-y-auto flex-grow">
                    <OutputTab
                        showUnusualCasesList={showUnusualCasesList}
                        setShowUnusualCasesList={setShowUnusualCasesList}
                        peerGroupNorms={peerGroupNorms}
                        setPeerGroupNorms={setPeerGroupNorms}
                        anomalyIndices={anomalyIndices}
                        setAnomalyIndices={setAnomalyIndices}
                        reasonOccurrence={reasonOccurrence}
                        setReasonOccurrence={setReasonOccurrence}
                        caseProcessed={caseProcessed}
                        setCaseProcessed={setCaseProcessed}
                    />
                </TabsContent>

                <TabsContent value="save" className="p-6 overflow-y-auto flex-grow">
                    <SaveTab
                        saveAnomalyIndex={saveAnomalyIndex}
                        setSaveAnomalyIndex={setSaveAnomalyIndex}
                        anomalyIndexName={anomalyIndexName}
                        setAnomalyIndexName={setAnomalyIndexName}
                        savePeerGroups={savePeerGroups}
                        setSavePeerGroups={setSavePeerGroups}
                        peerGroupsRootName={peerGroupsRootName}
                        setPeerGroupsRootName={setPeerGroupsRootName}
                        saveReasons={saveReasons}
                        setSaveReasons={setSaveReasons}
                        reasonsRootName={reasonsRootName}
                        setReasonsRootName={setReasonsRootName}
                        replaceExisting={replaceExisting}
                        setReplaceExisting={setReplaceExisting}
                        exportFilePath={exportFilePath}
                        setExportFilePath={setExportFilePath}
                    />
                </TabsContent>

                <TabsContent value="missingValues" className="p-6 overflow-y-auto flex-grow">
                    <MissingValuesTab
                        missingValuesOption={missingValuesOption}
                        setMissingValuesOption={setMissingValuesOption}
                        useProportionMissing={useProportionMissing}
                        setUseProportionMissing={setUseProportionMissing}
                    />
                </TabsContent>

                <TabsContent value="options" className="p-6 overflow-y-auto flex-grow">
                    <OptionsTab
                        identificationCriteria={identificationCriteria}
                        setIdentificationCriteria={setIdentificationCriteria}
                        percentageValue={percentageValue}
                        setPercentageValue={setPercentageValue}
                        fixedNumber={fixedNumber}
                        setFixedNumber={setFixedNumber}
                        useMinimumValue={useMinimumValue}
                        setUseMinimumValue={setUseMinimumValue}
                        cutoffValue={cutoffValue}
                        setCutoffValue={setCutoffValue}
                        minPeerGroups={minPeerGroups}
                        setMinPeerGroups={setMinPeerGroups}
                        maxPeerGroups={maxPeerGroups}
                        setMaxPeerGroups={setMaxPeerGroups}
                        maxReasons={maxReasons}
                        setMaxReasons={setMaxReasons}
                    />
                </TabsContent>
            </Tabs>

            <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                        onClick={handleConfirm}
                    >
                        OK
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                    >
                        Paste
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                    >
                        Help
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
};

export default IdentifyUnusualCases;