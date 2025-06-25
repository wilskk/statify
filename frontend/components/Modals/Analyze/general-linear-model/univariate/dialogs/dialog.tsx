import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import VariableListManager, {
    TargetListConfig,
} from "@/components/Common/VariableListManager";
import type { Variable } from "@/types/Variable";
import {
    UnivariateDialogProps,
    UnivariateMainType,
} from "@/components/Modals/Analyze/general-linear-model/univariate/types/univariate";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useModal } from "@/hooks/useModal";

export const UnivariateDialog = ({
    isMainOpen,
    setIsMainOpen,
    setIsModelOpen,
    setIsContrastOpen,
    setIsPlotsOpen,
    setIsPostHocOpen,
    setIsEMMeansOpen,
    setIsSaveOpen,
    setIsOptionsOpen,
    setIsBootstrapOpen,
    updateFormData,
    data,
    globalVariables,
    onContinue,
    onReset,
}: UnivariateDialogProps) => {
    const [mainState, setMainState] = useState<UnivariateMainType>({ ...data });
    const { closeModal } = useModal();

    const [availableVars, setAvailableVars] = useState<Variable[]>([]);
    const [depVar, setDepVar] = useState<Variable[]>([]);
    const [fixFactor, setFixFactor] = useState<Variable[]>([]);
    const [randFactor, setRandFactor] = useState<Variable[]>([]);
    const [covar, setCovar] = useState<Variable[]>([]);
    const [wlsWeight, setWlsWeight] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{
        id: string;
        source: string;
    } | null>(null);

    const listStateSetters: Record<
        string,
        React.Dispatch<React.SetStateAction<Variable[]>>
    > = {
        available: setAvailableVars,
        DepVar: setDepVar,
        FixFactor: setFixFactor,
        RandFactor: setRandFactor,
        Covar: setCovar,
        WlsWeight: setWlsWeight,
    };

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
            [
                data.DepVar,
                ...(data.FixFactor || []),
                ...(data.RandFactor || []),
                ...(data.Covar || []),
                data.WlsWeight,
            ].filter(Boolean)
        );

        const varsMap = new Map(allVariables.map((v) => [v.name, v]));

        setDepVar(
            data.DepVar
                ? ([varsMap.get(data.DepVar)].filter(Boolean) as Variable[])
                : []
        );
        setFixFactor(
            (data.FixFactor || [])
                .map((name) => varsMap.get(name))
                .filter(Boolean) as Variable[]
        );
        setRandFactor(
            (data.RandFactor || [])
                .map((name) => varsMap.get(name))
                .filter(Boolean) as Variable[]
        );
        setCovar(
            (data.Covar || [])
                .map((name) => varsMap.get(name))
                .filter(Boolean) as Variable[]
        );
        setWlsWeight(
            data.WlsWeight
                ? ([varsMap.get(data.WlsWeight)].filter(Boolean) as Variable[])
                : []
        );
        setAvailableVars(
            allVariables.filter((v) => !initialUsedNames.has(v.name))
        );
    }, [data, globalVariables]);

    useEffect(() => {
        setMainState((prevState) => ({
            ...prevState,
            DepVar: depVar[0]?.name || null,
            FixFactor: fixFactor.map((v) => v.name),
            RandFactor: randFactor.map((v) => v.name),
            Covar: covar.map((v) => v.name),
            WlsWeight: wlsWeight[0]?.name || null,
        }));
    }, [depVar, fixFactor, randFactor, covar, wlsWeight]);

    const handleMoveVariable = useCallback(
        (variable: Variable, fromListId: string, toListId: string) => {
            const fromSetter = listStateSetters[fromListId];
            const toSetter = listStateSetters[toListId];
            const toListConfig = targetListsConfig.find(
                (l) => l.id === toListId
            );

            if (fromSetter) {
                fromSetter((prev) =>
                    prev.filter((v) => v.tempId !== variable.tempId)
                );
            }

            if (toSetter) {
                if (toListConfig?.maxItems === 1) {
                    toSetter((prev) => {
                        if (prev.length > 0 && listStateSetters.available) {
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
        [depVar, fixFactor, randFactor, covar, wlsWeight]
    );

    const handleReorderVariable = useCallback(
        (listId: string, newVariables: Variable[]) => {
            const setter = listStateSetters[listId];
            if (setter) {
                setter(newVariables);
            }
        },
        []
    );

    const targetListsConfig: TargetListConfig[] = [
        {
            id: "DepVar",
            title: "Dependent Variable:",
            variables: depVar,
            height: "auto",
            maxItems: 1,
        },
        {
            id: "FixFactor",
            title: "Fixed Factor(s):",
            variables: fixFactor,
            height: "100px",
        },
        {
            id: "RandFactor",
            title: "Random Factor(s):",
            variables: randFactor,
            height: "100px",
        },
        {
            id: "Covar",
            title: "Covariate(s):",
            variables: covar,
            height: "100px",
        },
        {
            id: "WlsWeight",
            title: "WLS Weight:",
            variables: wlsWeight,
            height: "auto",
            maxItems: 1,
        },
    ];

    const handleContinue = () => {
        Object.entries(mainState).forEach(([key, value]) => {
            updateFormData(key as keyof UnivariateMainType, value);
        });

        setIsMainOpen(false);
        onContinue(mainState);
    };

    const openDialog =
        (setter: React.Dispatch<React.SetStateAction<boolean>>) => () => {
            Object.entries(mainState).forEach(([key, value]) => {
                updateFormData(key as keyof UnivariateMainType, value);
            });
            setter(true);
        };

    const handleDialog = () => {
        setIsMainOpen(false);
        closeModal();
    };

    if (!isMainOpen) return null;

    return (
        <div className="flex flex-col h-full">
            <div className="p-4">
                <ResizablePanelGroup
                    direction="horizontal"
                    className="min-h-[400px] rounded-lg border md:min-w-[200px]"
                >
                    <ResizablePanel defaultSize={75}>
                        <div className="p-2 h-full">
                            <VariableListManager
                                availableVariables={availableVars}
                                targetLists={targetListsConfig}
                                variableIdKey="tempId"
                                highlightedVariable={highlightedVariable}
                                setHighlightedVariable={setHighlightedVariable}
                                onMoveVariable={handleMoveVariable}
                                onReorderVariable={handleReorderVariable}
                                showArrowButtons={true}
                                availableListHeight="450px"
                            />
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={25}>
                        <div className="flex flex-col w-full h-full items-center justify-between p-2">
                            <div className="flex flex-col gap-2 w-full">
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    onClick={openDialog(setIsModelOpen)}
                                >
                                    Model
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    onClick={openDialog(setIsContrastOpen)}
                                >
                                    Contrasts
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    onClick={openDialog(setIsPlotsOpen)}
                                >
                                    Plots
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    onClick={openDialog(setIsPostHocOpen)}
                                >
                                    Post Hoc
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    onClick={openDialog(setIsEMMeansOpen)}
                                >
                                    EM Means
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    onClick={openDialog(setIsSaveOpen)}
                                >
                                    Save
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    onClick={openDialog(setIsOptionsOpen)}
                                >
                                    Options
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    onClick={openDialog(setIsBootstrapOpen)}
                                >
                                    Bootstrap
                                </Button>
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
            <div className="flex-grow" />
            <div className="flex justify-start gap-2 p-4 border-t">
                <Button type="button" onClick={handleContinue}>
                    OK
                </Button>
                <Button type="button" variant="secondary" onClick={onReset}>
                    Reset
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleDialog}
                >
                    Cancel
                </Button>
                <Button type="button" variant="secondary">
                    Help
                </Button>
            </div>
        </div>
    );
};
