"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
    KMedoidsClusterDialogProps,
    KMedoidsClusterMainType,
} from "@/components/Modals/Analyze/Classify/k-medoids-cluster/types/k-medoids-cluster";
import {
    ClusterMode,
    AutoKMethod,
    DistanceMetric,
} from "@/components/Modals/Analyze/Classify/k-medoids-cluster/types/k-medoids-cluster";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { TargetListConfig } from "@/components/Common/VariableListManager";
import VariableListManager from "@/components/Common/VariableListManager";
import type { Variable } from "@/types/Variable";
import { getKMedoidsVariableIcon } from "@/components/Modals/Analyze/Classify/k-medoids-cluster/utils/iconHelper";
import { HelpCircle } from "lucide-react";
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";

export const KMedoidsClusterDialog = ({
    updateFormData,
    data,
    globalVariables,
}: KMedoidsClusterDialogProps) => {
    const [mainState, setMainState] = useState<KMedoidsClusterMainType>({
        ...data,
    });
    const [availableVars, setAvailableVars] = useState<Variable[]>([]);
    const [targetVars, setTargetVars] = useState<Variable[]>([]);
    const [caseVars, setCaseVars] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{
        id: string;
        source: string;
    } | null>(null);
    
    // Use ref to avoid re-creating callbacks when updateFormData changes
    const updateFormDataRef = useRef(updateFormData);
    useEffect(() => {
        updateFormDataRef.current = updateFormData;
    }, [updateFormData]);
    
    const listStateSetters: Record<
        string,
        React.Dispatch<React.SetStateAction<Variable[]>>
    > = useMemo(
        () => ({
            available: setAvailableVars,
            TargetVar: setTargetVars,
            CaseTarget: setCaseVars,
        }),
        [setAvailableVars, setTargetVars, setCaseVars]
    );

    useEffect(() => {
        setMainState({ ...data });
        const allVariables: Variable[] = globalVariables.map((name, index) => ({
            name,
            tempId: name,
            label: name,
            columnIndex: index,
            type: "NUMERIC",
            width: 8,
            decimals: 2,
            align: "left",
            missing: null,
            measure: "unknown",
            role: "input",
            values: [],
            columns: 0,
        }));

        const initialUsedNames = new Set(
            [...(data.TargetVar || []), data.CaseTarget].filter(Boolean)
        );

        const varsMap = new Map(allVariables.map((v) => [v.name, v]));

        setTargetVars(
            (data.TargetVar || [])
                .map((name) => varsMap.get(name))
                .filter(Boolean) as Variable[]
        );

        setCaseVars(
            data.CaseTarget
                ? ([varsMap.get(data.CaseTarget)].filter(Boolean) as Variable[])
                : []
        );

        setAvailableVars(
            allVariables.filter((v) => !initialUsedNames.has(v.name))
        );
    }, [data, globalVariables]);

    const targetListsConfig: TargetListConfig[] = useMemo(
        () => [
            {
                id: "TargetVar",
                title: "Variables:",
                variables: targetVars,
                height: "225px",
                containerId: "kmedoids-analysis-variables",
            },
            {
                id: "CaseTarget",
                title: "Label Cases by:",
                variables: caseVars,
                height: "auto",
                maxItems: 1,
                containerId: "kmedoids-label-cases-by",
            },
        ],
        [targetVars, caseVars]
    );

    const handleMoveVariable = useCallback(
        (variable: Variable, fromListId: string, toListId: string) => {
            const fromSetter = listStateSetters[fromListId];
            const toSetter = listStateSetters[toListId];
            const toListConfig = targetListsConfig.find(
                (l) => l.id === toListId
            );

            let updatedTargetVars: Variable[] | null = null;
            let updatedCaseTarget: string | null = null;
            let shouldUpdateTargetVars = false;
            let shouldUpdateCaseTarget = false;

            // Remove from source list
            if (fromSetter) {
                if (fromListId === "TargetVar") {
                    fromSetter((prev) => {
                        const newVars = prev.filter((v) => v.name !== variable.name);
                        updatedTargetVars = newVars;
                        shouldUpdateTargetVars = true;
                        return newVars;
                    });
                } else if (fromListId === "CaseTarget") {
                    fromSetter((prev) => {
                        updatedCaseTarget = null;
                        shouldUpdateCaseTarget = true;
                        return prev.filter((v) => v.name !== variable.name);
                    });
                } else {
                    fromSetter((prev) => prev.filter((v) => v.name !== variable.name));
                }
            }

            // Add to destination list
            if (toSetter) {
                if (toListConfig?.maxItems === 1) {
                    toSetter((prev) => {
                        if (prev.length > 0) {
                            const existingVar = prev[0];
                            setAvailableVars((avail) => [
                                ...avail,
                                existingVar,
                            ]);
                        }
                        if (toListId === "CaseTarget") {
                            updatedCaseTarget = variable.name;
                            shouldUpdateCaseTarget = true;
                        }
                        return [variable];
                    });
                } else {
                    if (toListId === "TargetVar") {
                        toSetter((prev) => {
                            const newVars = [...prev, variable];
                            updatedTargetVars = newVars;
                            shouldUpdateTargetVars = true;
                            return newVars;
                        });
                    } else {
                        toSetter((prev) => [...prev, variable]);
                    }
                }
            }

            // Update parent after all state updates are queued
            queueMicrotask(() => {
                if (shouldUpdateTargetVars && updatedTargetVars !== null) {
                    updateFormDataRef.current("TargetVar", updatedTargetVars.map(v => v.name));
                }
                if (shouldUpdateCaseTarget) {
                    updateFormDataRef.current("CaseTarget", updatedCaseTarget);
                }
            });
        },
        [listStateSetters, targetListsConfig, setAvailableVars]
    );

    const handleReorderVariable = useCallback(
        (listId: string, newVariables: Variable[]) => {
            const setter = listStateSetters[listId];
            if (setter) {
                setter(newVariables);
                // Update parent after state update is queued
                if (listId === "TargetVar") {
                    queueMicrotask(() => {
                        updateFormDataRef.current("TargetVar", newVariables.map(v => v.name));
                    });
                }
            }
        },
        [listStateSetters]
    );

    const handleChange = useCallback((
        field: keyof KMedoidsClusterMainType,
        value: number | boolean | string | string[] | null
    ) => {
        setMainState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
        // Update parent synchronously (not via queueMicrotask) so that
        // formData.main is always up-to-date before the OK button reads it.
        // Using queueMicrotask here caused a race: the parent's setFormData
        // was scheduled as a macro-task render, which could fire AFTER the
        // user clicked OK — resulting in stale k being sent to the worker.
        updateFormDataRef.current(field, value);
    }, []);

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="space-y-6">
                {/* Data Type Legend */}
                <div className="bg-muted/40 border rounded-md p-3">
                    <div className="flex items-center gap-4 text-xs">
                        <span className="font-semibold text-muted-foreground">Data Type Icons:</span>
                        <div className="flex items-center gap-1">
                            <span className="text-green-600 font-semibold text-xs">123</span>
                            <span className="text-muted-foreground">Numeric</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-blue-500 font-semibold text-xs">ABC</span>
                            <span className="text-muted-foreground">Categorical/String</span>
                        </div>
                    </div>
                </div>
                
                <div className="min-h-[400px]">
                    <VariableListManager
                        availableVariables={availableVars}
                        targetLists={targetListsConfig}
                        variableIdKey="name"
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        onMoveVariable={handleMoveVariable}
                        onReorderVariable={handleReorderVariable}
                        getVariableIcon={getKMedoidsVariableIcon}
                        showArrowButtons={true}
                        availableListHeight="350px"
                    />
                </div>

                <div className="w-full border rounded-md">
                    <div className="px-4 py-2 border-b bg-muted/40">
                        <Label className="font-bold">Medoid Configuration</Label>
                    </div>
                    <div className="space-y-4 p-4">

                                {/* ===== MODE SELECTOR ===== */}
                                <div className="space-y-2">
                                    <Label className="font-semibold text-sm">Number of Clusters (k)</Label>
                                    <RadioGroup
                                        value={mainState.ClusterMode}
                                        onValueChange={(val) =>
                                            handleChange("ClusterMode", val as ClusterMode)
                                        }
                                        className="flex flex-col gap-2"
                                    >
                                        {/* --- MANUAL --- */}
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value={ClusterMode.Manual} id="mode-manual" />
                                            <Label htmlFor="mode-manual" className="cursor-pointer font-normal">
                                                Manual
                                            </Label>
                                        </div>

                                        {mainState.ClusterMode === ClusterMode.Manual && (
                                            <div className="flex items-center gap-3 ml-6">
                                                <Label className="text-sm text-muted-foreground w-20">k =</Label>
                                                <Input
                                                    id="kmedoids-number-of-clusters"
                                                    type="number"
                                                    placeholder="2"
                                                    value={mainState.Cluster ?? ""}
                                                    min={2}
                                                    onChange={(e) =>
                                                        handleChange("Cluster", Number(e.target.value))
                                                    }
                                                    className="w-24"
                                                />
                                                <span className="text-xs text-muted-foreground">(min: 2)</span>
                                            </div>
                                        )}

                                        {/* --- AUTOMATIC --- */}
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value={ClusterMode.Automatic} id="mode-auto" />
                                            <Label htmlFor="mode-auto" className="cursor-pointer font-normal">
                                                Automatic (find optimal k)
                                            </Label>
                                        </div>

                                        {mainState.ClusterMode === ClusterMode.Automatic && (
                                            <div className="space-y-3 ml-6 border-l-2 border-muted pl-4">
                                                {/* Range */}
                                                <div className="flex items-center gap-3">
                                                    <Label className="text-sm text-muted-foreground w-20">k range:</Label>
                                                    <Input
                                                        id="kmedoids-auto-kmin"
                                                        type="number"
                                                        placeholder="2"
                                                        value={mainState.AutoKMin ?? ""}
                                                        min={2}
                                                        max={(mainState.AutoKMax ?? 10) - 1}
                                                        onChange={(e) =>
                                                            handleChange("AutoKMin", Number(e.target.value))
                                                        }
                                                        className="w-20"
                                                    />
                                                    <span className="text-xs text-muted-foreground">to</span>
                                                    <Input
                                                        id="kmedoids-auto-kmax"
                                                        type="number"
                                                        placeholder="10"
                                                        value={mainState.AutoKMax ?? ""}
                                                        min={(mainState.AutoKMin ?? 2) + 1}
                                                        onChange={(e) =>
                                                            handleChange("AutoKMax", Number(e.target.value))
                                                        }
                                                        className="w-20"
                                                    />
                                                </div>
                                                {/* Method */}
                                                <div className="flex items-center gap-3">
                                                    <Label className="text-sm text-muted-foreground w-20">Method:</Label>
                                                    <Select
                                                        value={mainState.AutoKMethod}
                                                        onValueChange={(val) =>
                                                            handleChange("AutoKMethod", val as AutoKMethod)
                                                        }
                                                    >
                                                        <SelectTrigger className="w-52">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value={AutoKMethod.Silhouette}>
                                                                Silhouette Score
                                                            </SelectItem>
                                                            <SelectItem value={AutoKMethod.Elbow}>
                                                                Elbow Method
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Sistem akan mengevaluasi setiap k dari kMin
                                                    hingga kMax dan memilih k dengan skor terbaik.
                                                </p>
                                            </div>
                                        )}
                                    </RadioGroup>
                                </div>

                                {/* ===== DISTANCE METRIC ===== */}
                                <div className="space-y-2 border-t pt-4">
                                    <div className="flex items-center gap-2">
                                        <Label className="font-semibold text-sm">Distance Measure</Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p className="text-xs">
                                                        <strong>Euclidean:</strong> Geometric distance, magnitude-sensitive. Best for continuous numeric data.<br/>
                                                        <strong>Manhattan:</strong> City-block distance, more robust to outliers.
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <RadioGroup
                                        value={mainState.DistanceMetric}
                                        onValueChange={(value) =>
                                            handleChange("DistanceMetric", value as DistanceMetric)
                                        }
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value={DistanceMetric.Euclidean} id="euclidean" />
                                            <Label htmlFor="euclidean" className="cursor-pointer font-normal">Euclidean distance</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value={DistanceMetric.Manhattan} id="manhattan" />
                                            <Label htmlFor="manhattan" className="cursor-pointer font-normal">Manhattan distance (City-block)</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </div>
                </div>
            </div>
        </div>
    );
};
