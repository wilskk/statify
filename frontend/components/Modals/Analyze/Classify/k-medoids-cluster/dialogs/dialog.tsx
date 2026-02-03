"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type {
    KMedoidsClusterDialogProps,
    KMedoidsClusterMainType,
} from "@/components/Modals/Analyze/Classify/k-medoids-cluster/types/k-medoids-cluster";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import type { TargetListConfig } from "@/components/Common/VariableListManager";
import VariableListManager from "@/components/Common/VariableListManager";
import type { Variable } from "@/types/Variable";

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
    const [openAccordion, setOpenAccordion] = useState<string | undefined>(
        undefined
    );

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

    useEffect(() => {
        setMainState((prevState) => ({
            ...prevState,
            TargetVar: targetVars.map((v) => v.name),
            CaseTarget: caseVars[0]?.name || null,
        }));
    }, [targetVars, caseVars]);

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

            if (fromSetter) {
                fromSetter((prev) =>
                    prev.filter((v) => v.name !== variable.name)
                );
            }

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
                        return [variable];
                    });
                } else {
                    toSetter((prev) => [...prev, variable]);
                }
            }
        },
        [listStateSetters, targetListsConfig, setAvailableVars]
    );

    const handleReorderVariable = useCallback(
        (listId: string, newVariables: Variable[]) => {
            const setter = listStateSetters[listId];
            if (setter) {
                setter(newVariables);
            }
        },
        [listStateSetters]
    );

    const handleChange = (
        field: keyof KMedoidsClusterMainType,
        value: number | boolean | string | string[] | null
    ) => {
        setMainState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
        updateFormData(field, value);
    };

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="space-y-6">
                <div className="min-h-[400px]">
                    <VariableListManager
                        availableVariables={availableVars}
                        targetLists={targetListsConfig}
                        variableIdKey="name"
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        onMoveVariable={handleMoveVariable}
                        onReorderVariable={handleReorderVariable}
                        showArrowButtons={true}
                        availableListHeight="350px"
                    />
                </div>

                <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                    value={openAccordion}
                    onValueChange={setOpenAccordion}
                >
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="font-bold">
                            Medoid Configuration
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 p-4">
                                <div className="flex items-center gap-4">
                                    <Label className="w-[200px]">
                                        Number of Clusters:
                                    </Label>
                                    <Input
                                        id="kmedoids-number-of-clusters"
                                        type="number"
                                        placeholder="2"
                                        value={mainState.Cluster || ""}
                                        min={2}
                                        onChange={(e) =>
                                            handleChange(
                                                "Cluster",
                                                Number(e.target.value)
                                            )
                                        }
                                        className="w-24"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="ReadInitial"
                                            checked={mainState.ReadInitial}
                                            disabled={true}
                                        />
                                        <label
                                            htmlFor="ReadInitial"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Read initial medoids from (Disabled)
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="WriteFinal"
                                            checked={mainState.WriteFinal}
                                            disabled={true}
                                        />
                                        <label
                                            htmlFor="WriteFinal"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Write final medoids to (Disabled)
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div>
    );
};
