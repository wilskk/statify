<<<<<<< HEAD
import React, {useEffect, useState} from "react";
import {Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup,} from "@/components/ui/resizable";
import {Separator} from "@/components/ui/separator";
import {
    HierClusDialogProps,
    HierClusMainType,
} from "@/components/Modals/Analyze/Classify/hierarchical-cluster/types/hierarchical-cluster";
import {Label} from "@/components/ui/label";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {CheckedState} from "@radix-ui/react-checkbox";
import {Checkbox} from "@/components/ui/checkbox";
import {Badge} from "@/components/ui/badge";
import {ScrollArea} from "@/components/ui/scroll-area";
import {useModal} from "@/hooks/useModal";

export const HierClusDialog = ({
    isMainOpen,
    setIsMainOpen,
    setIsStatisticsOpen,
    setIsPlotsOpen,
    setIsSaveOpen,
    setIsMethodOpen,
    updateFormData,
    data,
    globalVariables,
    onContinue,
    onReset,
}: HierClusDialogProps) => {
    const [mainState, setMainState] = useState<HierClusMainType>({ ...data });
    const [availableVariables, setAvailableVariables] = useState<string[]>([]);

    const { closeModal } = useModal();

    useEffect(() => {
        setMainState({ ...data });
    }, [data]);

    useEffect(() => {
        const usedVariables = [
            ...(mainState.Variables || []),
            mainState.LabelCases,
        ].filter(Boolean);

        const updatedVariables = globalVariables.filter(
            (variable) => !usedVariables.includes(variable)
        );
        setAvailableVariables(updatedVariables);
    }, [mainState, globalVariables]);

    const handleChange = (
        field: keyof HierClusMainType,
        value: CheckedState | boolean | string | null
    ) => {
        setMainState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleDrop = (target: string, variable: string) => {
        setMainState((prev) => {
            const updatedState = { ...prev };
            if (target === "LabelCases") {
                updatedState.LabelCases = variable;
            } else if (target === "Variables") {
                updatedState.Variables = [
                    ...(updatedState.Variables || []),
                    variable,
                ];
            }
            return updatedState;
        });
    };

    const handleRemoveVariable = (target: string, variable?: string) => {
        setMainState((prev) => {
            const updatedState = { ...prev };
            if (target === "LabelCases") {
                updatedState.LabelCases = "";
            } else if (target === "Variables") {
                updatedState.Variables = (updatedState.Variables || []).filter(
                    (item) => item !== variable
                );
            }
            return updatedState;
        });
    };

    const handleClusterGrp = (value: string) => {
        setMainState((prev) => ({
            ...prev,
            ClusterCases: value === "ClusterCases",
            ClusterVar: value === "ClusterVar",
        }));
    };

    const handleContinue = () => {
        Object.entries(mainState).forEach(([key, value]) => {
            updateFormData(key as keyof HierClusMainType, value);
        });

        setIsMainOpen(false);

        onContinue(mainState);
    };

    const openDialog =
        (setter: React.Dispatch<React.SetStateAction<boolean>>) => () => {
            Object.entries(mainState).forEach(([key, value]) => {
                updateFormData(key as keyof HierClusMainType, value);
            });
            setter(true);
        };

    const handleDialog = () => {
        setIsMainOpen(false);
        closeModal();
    };

    return (
        <>
            {/* Main Dialog */}
            <Dialog open={isMainOpen} onOpenChange={handleDialog}>
                {/* <DialogTrigger asChild>
                    <Button variant="outline">Hierarchical Cluster</Button>
                </DialogTrigger> */}
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Hierarchical Cluster Analysis</DialogTitle>
                    </DialogHeader>
                    <Separator />
                    <div className="flex items-center space-x-2">
                        <ResizablePanelGroup
                            direction="horizontal"
                            className="min-h-[425px] rounded-lg border md:min-w-[200px]"
                        >
                            {/* Variable List */}
                            <ResizablePanel defaultSize={25}>
                                <ScrollArea>
                                    <div className="flex flex-col gap-1 justify-start items-start h-[425px] w-full p-2">
                                        {availableVariables.map(
                                            (
                                                variable: string,
                                                index: number
                                            ) => (
                                                <Badge
                                                    key={index}
                                                    className="w-full text-start text-sm font-light p-2 cursor-pointer"
                                                    variant="outline"
                                                    draggable
                                                    onDragStart={(e) =>
                                                        e.dataTransfer.setData(
                                                            "text",
                                                            variable
                                                        )
                                                    }
                                                >
                                                    {variable}
                                                </Badge>
                                            )
                                        )}
                                    </div>
                                </ScrollArea>
                            </ResizablePanel>
                            <ResizableHandle withHandle />

                            {/* Defining Variable */}
                            <ResizablePanel defaultSize={55}>
                                <div className="flex flex-col h-full w-full items-start justify-start gap-6 p-2">
                                    <div
                                        className="flex flex-col w-full gap-2"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            const variable =
                                                e.dataTransfer.getData("text");
                                            handleDrop("Variables", variable);
                                        }}
                                    >
                                        <Label className="font-bold">
                                            Variable(s):
                                        </Label>
                                        <div className="w-full h-[190px] p-2 border rounded overflow-hidden">
                                            <ScrollArea>
                                                <div className="w-full h-[175px]">
                                                    {mainState.Variables &&
                                                    mainState.Variables.length >
                                                        0 ? (
                                                        <div className="flex flex-col gap-1">
                                                            {mainState.Variables.map(
                                                                (
                                                                    variable,
                                                                    index
                                                                ) => (
                                                                    <Badge
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="text-start text-sm font-light p-2 cursor-pointer"
                                                                        variant="outline"
                                                                        onClick={() =>
                                                                            handleRemoveVariable(
                                                                                "Variables",
                                                                                variable
                                                                            )
                                                                        }
                                                                    >
                                                                        {
                                                                            variable
                                                                        }
                                                                    </Badge>
                                                                )
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm font-light text-gray-500">
                                                            Drop variables here.
                                                        </span>
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                        <input
                                            type="hidden"
                                            value={mainState.Variables ?? ""}
                                            name="Independents"
                                        />
                                    </div>
                                    <div className="flex flex-col w-full gap-2">
                                        <div>
                                            <Label className="font-bold">
                                                Label Cases by:
                                            </Label>
                                            <div className="flex items-center space-x-2">
                                                <div
                                                    className="w-full min-h-[40px] p-2 border rounded"
                                                    onDrop={(e) => {
                                                        handleDrop(
                                                            "LabelCases",
                                                            e.dataTransfer.getData(
                                                                "text"
                                                            )
                                                        );
                                                    }}
                                                    onDragOver={(e) =>
                                                        e.preventDefault()
                                                    }
                                                >
                                                    {mainState.LabelCases ? (
                                                        <Badge
                                                            className="text-start text-sm font-light p-2 cursor-pointer"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleRemoveVariable(
                                                                    "LabelCases"
                                                                )
                                                            }
                                                        >
                                                            {
                                                                mainState.LabelCases
                                                            }
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-sm font-light text-gray-500">
                                                            Drop variables here.
                                                        </span>
                                                    )}
                                                </div>
                                                <input
                                                    type="hidden"
                                                    value={
                                                        mainState.LabelCases ??
                                                        ""
                                                    }
                                                    name="LabelCases"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="font-bold">
                                                Cluster
                                            </Label>
                                            <RadioGroup
                                                defaultValue="ClusterCases"
                                                value={
                                                    mainState.ClusterCases
                                                        ? "ClusterCases"
                                                        : mainState.ClusterVar
                                                        ? "ClusterVar"
                                                        : "ClusterCases"
                                                }
                                                onValueChange={handleClusterGrp}
                                            >
                                                <div className="flex flex-row gap-2">
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem
                                                            value="ClusterCases"
                                                            id="ClusterCases"
                                                        />
                                                        <Label htmlFor="ClusterCases">
                                                            Cases
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem
                                                            value="ClusterVar"
                                                            id="ClusterVar"
                                                        />
                                                        <Label htmlFor="ClusterVar">
                                                            Variables
                                                        </Label>
                                                    </div>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <Label className="font-bold">
                                                Display
                                            </Label>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="DispStats"
                                                    checked={
                                                        mainState.DispStats
                                                    }
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "DispStats",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="DispStats"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Statistics
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="DispPlots"
                                                    checked={
                                                        mainState.DispPlots
                                                    }
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleChange(
                                                            "DispPlots",
                                                            checked
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor="DispPlots"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Plots
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ResizablePanel>

                            {/* Tools Area */}
                            <ResizablePanel defaultSize={20}>
                                <div className="flex flex-col h-full items-start justify-start gap-1 p-2">
                                    <Button
                                        className="w-full"
                                        type="button"
                                        variant="secondary"
                                        onClick={openDialog(
                                            setIsStatisticsOpen
                                        )}
                                    >
                                        Statistics...
                                    </Button>
                                    <Button
                                        className="w-full"
                                        type="button"
                                        variant="secondary"
                                        onClick={openDialog(setIsPlotsOpen)}
                                    >
                                        Plots...
                                    </Button>
                                    <Button
                                        className="w-full"
                                        type="button"
                                        variant="secondary"
                                        onClick={openDialog(setIsMethodOpen)}
                                    >
                                        Method...
                                    </Button>
                                    <Button
                                        className="w-full"
                                        type="button"
                                        variant="secondary"
                                        onClick={openDialog(setIsSaveOpen)}
                                    >
                                        Save...
                                    </Button>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                    <DialogFooter className="sm:justify-start">
                        <Button type="button" onClick={handleContinue}>
                            OK
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onReset}
                        >
                            Reset
                        </Button>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="button" variant="secondary">
                            Help
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
=======
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { HelpCircle } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type {
  HierClusDialogProps,
  HierClusMainType,
} from "@/components/Modals/Analyze/Classify/hierarchical-cluster/types/hierarchical-cluster";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useModal } from "@/hooks/useModal";
import { toast } from "sonner";
import type { TargetListConfig } from "@/components/Common/VariableListManager";
import VariableListManager from "@/components/Common/VariableListManager";
import { TourPopup } from "@/components/Common/TourComponents";
import type { Variable } from "@/types/Variable";
// import { useTourGuide } from "../hooks/useTourGuide";
// import { dialogTourSteps } from "../hooks/tourConfig";

export const HierClusDialog = ({
  isMainOpen,
  setIsMainOpen,
  setIsStatisticsOpen,
  setIsSaveOpen,
  setIsPlotsOpen,
  setIsMethodOpen,
  updateFormData,
  data,
  globalVariables,
  onContinue,
  onReset,
}: HierClusDialogProps) => {
  const [mainState, setMainState] = useState<HierClusMainType>({
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

  // const {
  //     tourActive,
  //     currentStep,
  //     tourSteps,
  //     currentTargetElement,
  //     startTour,
  //     nextStep,
  //     prevStep,
  //     endTour,
  // } = useTourGuide(dialogTourSteps);

  // useEffect(() => {
  //     if (tourActive) {
  //         const currentTourStep = tourSteps[currentStep];
  //         if (currentTourStep.targetId === "kmeans-number-of-clusters") {
  //             setOpenAccordion("item-1");
  //         }
  //     }
  // }, [tourActive, currentStep, tourSteps]);

  const { closeModal } = useModal();

  const listStateSetters: Record<
    string,
    React.Dispatch<React.SetStateAction<Variable[]>>
  > = useMemo(
    () => ({
      available: setAvailableVars,
      Variables: setTargetVars,
      LabelCases: setCaseVars,
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
      [...(data.Variables || []), data.LabelCases].filter(Boolean)
    );

    const varsMap = new Map(allVariables.map((v) => [v.name, v]));

    setTargetVars(
      (data.Variables || [])
        .map((name) => varsMap.get(name))
        .filter(Boolean) as Variable[]
    );

    setCaseVars(
      data.LabelCases
        ? ([varsMap.get(data.LabelCases)].filter(Boolean) as Variable[])
        : []
    );

    setAvailableVars(allVariables.filter((v) => !initialUsedNames.has(v.name)));
  }, [data, globalVariables]);

  useEffect(() => {
    setMainState((prevState) => ({
      ...prevState,
      Variables: targetVars.map((v) => v.name),
      LabelCases: caseVars[0]?.name || null,
    }));
  }, [targetVars, caseVars]);

  const handleChange = (
    field: keyof HierClusMainType,
    value: CheckedState | number | boolean | string | string[] | null
  ) => {
    setMainState((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  const targetListsConfig: TargetListConfig[] = useMemo(
    () => [
      {
        id: "Variables",
        title: "Variables:",
        variables: targetVars,
        height: "225px",
        containerId: "hierclus-variables",
      },
      {
        id: "LabelCases",
        title: "Label Cases by:",
        variables: caseVars,
        height: "auto",
        maxItems: 1,
        containerId: "hierclus-label-cases",
      },
    ],
    [targetVars, caseVars]
  );

  const handleMoveVariable = useCallback(
    (variable: Variable, fromListId: string, toListId: string) => {
      const fromSetter = listStateSetters[fromListId];
      const toSetter = listStateSetters[toListId];
      const toListConfig = targetListsConfig.find((l) => l.id === toListId);

      if (fromSetter) {
        fromSetter((prev) => prev.filter((v) => v.name !== variable.name));
      }

      if (toSetter) {
        if (toListConfig?.maxItems === 1) {
          toSetter((prev) => {
            if (prev.length > 0) {
              const existingVar = prev[0];
              setAvailableVars((avail) => [...avail, existingVar]);
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

  const handleMethodGrp = (value: string) => {
    setMainState((prevState) => ({
      ...prevState,
      IterateClassify: value === "IterateClassify",
      ClassifyOnly: value === "ClassifyOnly",
    }));
  };

  const handleReadGrp = (value: string) => {
    setMainState((prevState) => ({
      ...prevState,
      OpenDataset: value === "OpenDataset",
      ExternalDatafile: value === "ExternalDatafile",
    }));
  };

  const handleWriteGrp = (value: string) => {
    setMainState((prevState) => ({
      ...prevState,
      NewDataset: value === "NewDataset",
      DataFile: value === "DataFile",
    }));
  };

  const handleContinue = () => {
    if (targetVars.length === 0) {
      toast.warning("Please select at least one variable.");
      return;
    }

    Object.entries(mainState).forEach(([key, value]) => {
      updateFormData(key as keyof HierClusMainType, value);
    });

    setIsMainOpen(false);
    onContinue(mainState);
  };

  const openDialog =
    (setter: React.Dispatch<React.SetStateAction<boolean>>) => () => {
      Object.entries(mainState).forEach(([key, value]) => {
        updateFormData(key as keyof HierClusMainType, value);
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
      {/* <AnimatePresence>
        {tourActive &&
          tourSteps.length > 0 &&
          currentStep < tourSteps.length && (
            <TourPopup
              step={tourSteps[currentStep]}
              currentStep={currentStep}
              totalSteps={tourSteps.length}
              onNext={nextStep}
              onPrev={prevStep}
              onClose={endTour}
              targetElement={currentTargetElement}
            />
          )}
      </AnimatePresence> */}
      <div className="flex flex-col items-center gap-2 p-4 flex-grow">
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[350px] rounded-lg border md:min-w-[200px]"
        >
          <ResizablePanel defaultSize={75}>
            <div id="hierclus-available-variables" className="p-2 h-full">
              <VariableListManager
                availableVariables={availableVars}
                targetLists={targetListsConfig}
                variableIdKey="name"
                highlightedVariable={highlightedVariable}
                setHighlightedVariable={setHighlightedVariable}
                onMoveVariable={handleMoveVariable}
                onReorderVariable={handleReorderVariable}
                showArrowButtons={true}
                availableListHeight="310px"
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25}>
            <div className="flex flex-col h-full w-full items-center justify-start gap-1 p-2">
              <Button
                className="w-full truncate"
                type="button"
                variant="outline"
                onClick={openDialog(setIsStatisticsOpen)}
              >
                Statistics
              </Button>
              <Button
                className="w-full truncate"
                type="button"
                variant="outline"
                onClick={openDialog(setIsPlotsOpen)}
              >
                Plots
              </Button>
              <Button
                className="w-full truncate"
                type="button"
                variant="outline"
                onClick={openDialog(setIsMethodOpen)}
              >
                Method
              </Button>
              <Button
                className="w-full truncate"
                type="button"
                variant="outline"
                onClick={openDialog(setIsSaveOpen)}
              >
                Save
              </Button>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* <Button
                  variant="ghost"
                  size="icon"
                  onClick={startTour}
                  className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button> */}
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Start feature tour</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="mr-2"
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDialog}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button id="hierclus-ok-button" type="button" onClick={handleContinue}>
            OK
          </Button>
        </div>
      </div>
    </div>
  );
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
};
