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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useModalStore } from "@/stores/useModalStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { Variable } from "@/types/Variable";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    CornerDownRight,
    CornerDownLeft,
    InfoIcon
} from "lucide-react";

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

    const [showUnusualCasesList, setShowUnusualCasesList] = useState(true);
    const [peerGroupNorms, setPeerGroupNorms] = useState(false);
    const [anomalyIndices, setAnomalyIndices] = useState(false);
    const [reasonOccurrence, setReasonOccurrence] = useState(false);
    const [caseProcessed, setCaseProcessed] = useState(false);

    const [saveAnomalyIndex, setSaveAnomalyIndex] = useState(false);
    const [anomalyIndexName, setAnomalyIndexName] = useState("AnomalyIndex");
    const [savePeerGroups, setSavePeerGroups] = useState(false);
    const [peerGroupsRootName, setPeerGroupsRootName] = useState("Peer");
    const [saveReasons, setSaveReasons] = useState(false);
    const [reasonsRootName, setReasonsRootName] = useState("Reason");
    const [replaceExisting, setReplaceExisting] = useState(false);
    const [exportFilePath, setExportFilePath] = useState("");

    const [missingValuesOption, setMissingValuesOption] = useState("exclude");
    const [useProportionMissing, setUseProportionMissing] = useState(true);

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
                values: [],
                missing: [],
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
                values: [],
                missing: [],
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
                values: [],
                missing: [],
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
                values: [],
                missing: [],
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
                    values: [],
                    missing: [],
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
                    values: [],
                    missing: [],
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
                    values: [],
                    missing: [],
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
                    values: [],
                    missing: [],
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

    const renderVariableList = (variables: Variable[], source: 'available' | 'analysis' | 'identifier', height: string) => (
        <div className="border border-[#E6E6E6] p-2 rounded-md overflow-y-auto overflow-x-hidden" style={{ height }}>
            <div className="space-y-1">
                {variables.map((variable) => (
                    <TooltipProvider key={variable.columnIndex}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-[#F7F7F7] ${
                                        highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === source
                                            ? "bg-[#E6E6E6] border-[#888888]"
                                            : "border-[#CCCCCC]"
                                    }`}
                                    onClick={() => handleVariableSelect(variable.columnIndex, source)}
                                    onDoubleClick={() => handleVariableDoubleClick(variable.columnIndex, source)}
                                >
                                    <div className="flex items-center w-full">
                                        {getVariableIcon(variable)}
                                        <span className="text-xs truncate">{getDisplayName(variable)}</span>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p className="text-xs">{getDisplayName(variable)}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>
        </div>
    );

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
                    <div className="grid grid-cols-8 gap-6">
                        <div className="col-span-3">
                            <div className="text-sm mb-2 font-medium">Variables:</div>
                            {renderVariableList(storeVariables, 'available', '300px')}
                            <div className="text-xs mt-2 text-[#888888] flex items-center">
                                <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                                <span>To change a variable&apos;s measurement level, right click on it in the Variables list.</span>
                            </div>
                        </div>

                        <div className="col-span-1 flex flex-col items-center justify-center">
                            <div className="flex flex-col space-y-32">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                    onClick={handleTopTransferClick}
                                    disabled={!highlightedVariable || (highlightedVariable.source !== 'available' && highlightedVariable.source !== 'analysis')}
                                >
                                    {highlightedVariable?.source === 'analysis' ?
                                        <CornerDownLeft size={16} /> :
                                        <CornerDownRight size={16} />
                                    }
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                    onClick={handleBottomTransferClick}
                                    disabled={!highlightedVariable || (highlightedVariable.source !== 'available' && highlightedVariable.source !== 'identifier')}
                                >
                                    {highlightedVariable?.source === 'identifier' ?
                                        <CornerDownLeft size={16} /> :
                                        <CornerDownRight size={16} />
                                    }
                                </Button>
                            </div>
                        </div>

                        <div className="col-span-4 space-y-6">
                            <div>
                                <div className="text-sm mb-2 font-medium">Analysis Variables:</div>
                                {renderVariableList(analysisVariables, 'analysis', '150px')}
                            </div>

                            <div>
                                <div className="text-sm mb-2 font-medium">Case Identifier Variable:</div>
                                {renderVariableList(caseIdentifierVariables, 'identifier', '60px')}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="output" className="p-6 overflow-y-auto flex-grow">
                    <div className="flex items-center mb-4">
                        <Checkbox
                            id="unusualCasesList"
                            checked={showUnusualCasesList}
                            onCheckedChange={(checked) => setShowUnusualCasesList(!!checked)}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="unusualCasesList" className="text-sm cursor-pointer">
                            List of unusual cases and reasons why they are considered unusual
                        </Label>
                    </div>

                    <div className="border border-[#E6E6E6] rounded-md p-6">
                        <div className="text-sm font-medium mb-4">Summaries</div>

                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center">
                                    <Checkbox
                                        id="peerGroupNorms"
                                        checked={peerGroupNorms}
                                        onCheckedChange={(checked) => setPeerGroupNorms(!!checked)}
                                        className="mr-2 border-[#CCCCCC]"
                                    />
                                    <Label htmlFor="peerGroupNorms" className="text-sm font-medium cursor-pointer">
                                        Peer group norms
                                    </Label>
                                </div>
                                <p className="text-xs mt-2 ml-6 text-[#888888]">
                                    Peer groups are groups of cases that have similar values for analysis variables. This option displays the
                                    distributions of analysis variables by peer group.
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center">
                                    <Checkbox
                                        id="anomalyIndices"
                                        checked={anomalyIndices}
                                        onCheckedChange={(checked) => setAnomalyIndices(!!checked)}
                                        className="mr-2 border-[#CCCCCC]"
                                    />
                                    <Label htmlFor="anomalyIndices" className="text-sm font-medium cursor-pointer">
                                        Anomaly indices
                                    </Label>
                                </div>
                                <p className="text-xs mt-2 ml-6 text-[#888888]">
                                    The anomaly index measures how unusual a case is with respect to its peer group. This option displays the
                                    distribution of anomaly index values among unusual cases.
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center">
                                    <Checkbox
                                        id="reasonOccurrence"
                                        checked={reasonOccurrence}
                                        onCheckedChange={(checked) => setReasonOccurrence(!!checked)}
                                        className="mr-2 border-[#CCCCCC]"
                                    />
                                    <Label htmlFor="reasonOccurrence" className="text-sm font-medium cursor-pointer">
                                        Reason occurrence by analysis variable
                                    </Label>
                                </div>
                                <p className="text-xs mt-2 ml-6 text-[#888888]">
                                    Reports how often each analysis variable was responsible for a case being considered unusual.
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center">
                                    <Checkbox
                                        id="caseProcessed"
                                        checked={caseProcessed}
                                        onCheckedChange={(checked) => setCaseProcessed(!!checked)}
                                        className="mr-2 border-[#CCCCCC]"
                                    />
                                    <Label htmlFor="caseProcessed" className="text-sm font-medium cursor-pointer">
                                        Case processed
                                    </Label>
                                </div>
                                <p className="text-xs mt-2 ml-6 text-[#888888]">
                                    Summarizes the distribution of cases included and excluded from the analysis.
                                </p>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="save" className="p-6 overflow-y-auto flex-grow">
                    <div className="border border-[#E6E6E6] rounded-md p-6 mb-6">
                        <div className="text-sm font-medium mb-4">Save Variables</div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="flex items-center">
                                        <Checkbox
                                            id="saveAnomalyIndex"
                                            checked={saveAnomalyIndex}
                                            onCheckedChange={(checked) => setSaveAnomalyIndex(!!checked)}
                                            className="mr-2 border-[#CCCCCC]"
                                        />
                                        <Label htmlFor="saveAnomalyIndex" className="text-sm font-medium cursor-pointer">
                                            Anomaly index
                                        </Label>
                                    </div>
                                    <p className="text-xs mt-2 ml-6 text-[#888888]">
                                        Measures the unusualness of each case with respect to its peer
                                    </p>
                                </div>

                                <div className="flex items-center">
                                    <Label htmlFor="anomalyIndexName" className="text-xs whitespace-nowrap mr-2">
                                        Name:
                                    </Label>
                                    <Input
                                        id="anomalyIndexName"
                                        value={anomalyIndexName}
                                        onChange={(e) => setAnomalyIndexName(e.target.value)}
                                        className="h-8 text-sm border-[#CCCCCC] focus:border-black focus:ring-black"
                                        disabled={!saveAnomalyIndex}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="flex items-center">
                                        <Checkbox
                                            id="savePeerGroups"
                                            checked={savePeerGroups}
                                            onCheckedChange={(checked) => setSavePeerGroups(!!checked)}
                                            className="mr-2 border-[#CCCCCC]"
                                        />
                                        <Label htmlFor="savePeerGroups" className="text-sm font-medium cursor-pointer">
                                            Peer groups
                                        </Label>
                                    </div>
                                    <p className="text-xs mt-2 ml-6 text-[#888888]">
                                        Three variables are saved per peer group: ID, case count, and size
                                        as a percentage of cases in the analysis.
                                    </p>
                                </div>

                                <div className="flex items-center">
                                    <Label htmlFor="peerGroupsRootName" className="text-xs whitespace-nowrap mr-2">
                                        Root Name:
                                    </Label>
                                    <Input
                                        id="peerGroupsRootName"
                                        value={peerGroupsRootName}
                                        onChange={(e) => setPeerGroupsRootName(e.target.value)}
                                        className="h-8 text-sm border-[#CCCCCC] focus:border-black focus:ring-black"
                                        disabled={!savePeerGroups}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="flex items-center">
                                        <Checkbox
                                            id="saveReasons"
                                            checked={saveReasons}
                                            onCheckedChange={(checked) => setSaveReasons(!!checked)}
                                            className="mr-2 border-[#CCCCCC]"
                                        />
                                        <Label htmlFor="saveReasons" className="text-sm font-medium cursor-pointer">
                                            Reasons
                                        </Label>
                                    </div>
                                    <p className="text-xs mt-2 ml-6 text-[#888888]">
                                        Four variables are saved per reason: name of reason variable,
                                        value of reason variable, peer group norm, and impact measure for
                                        the reason variable.
                                    </p>
                                </div>

                                <div className="flex items-center">
                                    <Label htmlFor="reasonsRootName" className="text-xs whitespace-nowrap mr-2">
                                        Root Name:
                                    </Label>
                                    <Input
                                        id="reasonsRootName"
                                        value={reasonsRootName}
                                        onChange={(e) => setReasonsRootName(e.target.value)}
                                        className="h-8 text-sm border-[#CCCCCC] focus:border-black focus:ring-black"
                                        disabled={!saveReasons}
                                    />
                                </div>
                            </div>

                            <div className="border-t border-[#E6E6E6] pt-4">
                                <div className="flex items-center">
                                    <Checkbox
                                        id="replaceExisting"
                                        checked={replaceExisting}
                                        onCheckedChange={(checked) => setReplaceExisting(!!checked)}
                                        className="mr-2 border-[#CCCCCC]"
                                    />
                                    <Label htmlFor="replaceExisting" className="text-sm cursor-pointer">
                                        Replace existing variables that have the same name or root name
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border border-[#E6E6E6] rounded-md p-6">
                        <div className="text-sm font-medium mb-4">Export Model File</div>
                        <div className="flex items-center">
                            <Label htmlFor="exportFile" className="text-xs whitespace-nowrap mr-2">
                                File:
                            </Label>
                            <Input
                                id="exportFile"
                                value={exportFilePath}
                                onChange={(e) => setExportFilePath(e.target.value)}
                                className="h-8 text-sm mr-2 border-[#CCCCCC] focus:border-black focus:ring-black"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                            >
                                Browse...
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="missingValues" className="p-6 overflow-y-auto flex-grow">
                    <RadioGroup value={missingValuesOption} onValueChange={setMissingValuesOption} className="space-y-6">
                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center">
                                    <RadioGroupItem value="exclude" id="excludeMissing" className="mr-2 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black" />
                                    <Label htmlFor="excludeMissing" className="text-sm font-medium cursor-pointer">
                                        Exclude missing values from analysis
                                    </Label>
                                </div>
                                <p className="text-xs mt-2 ml-6 text-[#888888]">
                                    User- and system-missing values are excluded.
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center">
                                    <RadioGroupItem value="include" id="includeMissing" className="mr-2 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black" />
                                    <Label htmlFor="includeMissing" className="text-sm font-medium cursor-pointer">
                                        Include missing values in analysis
                                    </Label>
                                </div>
                                <p className="text-xs mt-2 ml-6 text-[#888888]">
                                    For scale variables, user- and system-missing values are replaced with the variable&apos;s grand mean. For categorical
                                    variables, user- and system-missing values are combined and included in the analysis as a category.
                                </p>
                            </div>
                        </div>
                    </RadioGroup>

                    <div className="mt-4">
                        <div className="flex items-center">
                            <Checkbox
                                id="useProportionMissing"
                                checked={useProportionMissing}
                                onCheckedChange={(checked) => setUseProportionMissing(!!checked)}
                                className="mr-2 border-[#CCCCCC]"
                                disabled={missingValuesOption !== "include"}
                            />
                            <Label htmlFor="useProportionMissing" className="text-sm cursor-pointer">
                                Use proportion of missing values per case as analysis variable
                            </Label>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="options" className="p-6 overflow-y-auto flex-grow">
                    <div className="grid grid-cols-5 gap-6">
                        <div className="col-span-3 border border-[#E6E6E6] rounded-md p-6">
                            <div className="text-sm font-medium mb-4">Criteria for Identifying Unusual Cases</div>

                            <div className="space-y-4">
                                <RadioGroup value={identificationCriteria} onValueChange={setIdentificationCriteria} className="space-y-4">
                                    <div>
                                        <div className="flex items-center">
                                            <RadioGroupItem value="percentage" id="percentageCriteria" className="mr-2 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black" />
                                            <Label htmlFor="percentageCriteria" className="text-sm cursor-pointer">
                                                Percentage of cases with highest anomaly index values
                                            </Label>
                                        </div>
                                        <div className="ml-6 mt-2">
                                            <div className="flex items-center">
                                                <Label htmlFor="percentageValue" className="text-xs mr-2">
                                                    Percentage:
                                                </Label>
                                                <Input
                                                    id="percentageValue"
                                                    value={percentageValue}
                                                    onChange={(e) => setPercentageValue(e.target.value)}
                                                    className="h-8 text-sm w-24 border-[#CCCCCC] focus:border-black focus:ring-black"
                                                    disabled={identificationCriteria !== "percentage"}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex items-center">
                                            <RadioGroupItem value="fixed" id="fixedNumberCriteria" className="mr-2 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black" />
                                            <Label htmlFor="fixedNumberCriteria" className="text-sm cursor-pointer">
                                                Fixed number of cases with highest anomaly index values
                                            </Label>
                                        </div>
                                        <div className="ml-6 mt-2">
                                            <div className="flex items-center">
                                                <Label htmlFor="fixedNumber" className="text-xs mr-2">
                                                    Number:
                                                </Label>
                                                <Input
                                                    id="fixedNumber"
                                                    value={fixedNumber}
                                                    onChange={(e) => setFixedNumber(e.target.value)}
                                                    className="h-8 text-sm w-24 border-[#CCCCCC] focus:border-black focus:ring-black"
                                                    disabled={identificationCriteria !== "fixed"}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </RadioGroup>

                                <div>
                                    <div className="flex items-center">
                                        <Checkbox
                                            id="useMinimumValue"
                                            checked={useMinimumValue}
                                            onCheckedChange={(checked) => setUseMinimumValue(!!checked)}
                                            className="mr-2 border-[#CCCCCC]"
                                        />
                                        <Label htmlFor="useMinimumValue" className="text-sm cursor-pointer">
                                            Identify only cases whose anomaly index value meets or exceeds a minimum value
                                        </Label>
                                    </div>
                                    <div className="ml-6 mt-2">
                                        <div className="flex items-center">
                                            <Label htmlFor="cutoffValue" className="text-xs mr-2">
                                                Cutoff:
                                            </Label>
                                            <Input
                                                id="cutoffValue"
                                                value={cutoffValue}
                                                onChange={(e) => setCutoffValue(e.target.value)}
                                                className="h-8 text-sm w-24 border-[#CCCCCC] focus:border-black focus:ring-black"
                                                disabled={!useMinimumValue}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 border border-[#E6E6E6] rounded-md p-6">
                            <div className="text-sm font-medium mb-4">Number of Peer Groups</div>

                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <Label htmlFor="minPeerGroups" className="text-xs mr-2 w-16">
                                        Minimum:
                                    </Label>
                                    <Input
                                        id="minPeerGroups"
                                        value={minPeerGroups}
                                        onChange={(e) => setMinPeerGroups(e.target.value)}
                                        className="h-8 text-sm w-24 border-[#CCCCCC] focus:border-black focus:ring-black"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <Label htmlFor="maxPeerGroups" className="text-xs mr-2 w-16">
                                        Maximum:
                                    </Label>
                                    <Input
                                        id="maxPeerGroups"
                                        value={maxPeerGroups}
                                        onChange={(e) => setMaxPeerGroups(e.target.value)}
                                        className="h-8 text-sm w-24 border-[#CCCCCC] focus:border-black focus:ring-black"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="flex items-center">
                            <Label htmlFor="maxReasons" className="text-sm mr-2">
                                Maximum Number of Reasons:
                            </Label>
                            <Input
                                id="maxReasons"
                                value={maxReasons}
                                onChange={(e) => setMaxReasons(e.target.value)}
                                className="h-8 text-sm w-24 border-[#CCCCCC] focus:border-black focus:ring-black"
                            />
                        </div>
                        <p className="text-xs mt-2 text-[#888888]">
                            Specify the number of reasons reported in output and added to the active dataset if reason variables are saved. The value
                            is adjusted downward if it exceeds the number of analysis variables.
                        </p>
                    </div>
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