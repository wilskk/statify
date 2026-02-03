<<<<<<< HEAD
import React, {useEffect, useState} from "react";
import {Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup,} from "@/components/ui/resizable";
import {Separator} from "@/components/ui/separator";
import {
    KNNDialogProps,
    KNNMainType,
} from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor";
import {Label} from "@/components/ui/label";
import {Checkbox} from "@/components/ui/checkbox";
import {CheckedState} from "@radix-ui/react-checkbox";
import {Badge} from "@/components/ui/badge";
import {ScrollArea} from "@/components/ui/scroll-area";
import {useModal} from "@/hooks/useModal";

export const KNNDialog = ({
    isMainOpen,
    setIsMainOpen,
    setIsNeighborsOpen,
    setIsFeaturesOpen,
    setIsPartitionOpen,
    setIsSaveOpen,
    setIsOutputOpen,
    setIsOptionsOpen,
    updateFormData,
    data,
    globalVariables,
    onContinue,
    onReset,
}: KNNDialogProps) => {
    const [mainState, setMainState] = useState<KNNMainType>({ ...data });
    const [availableVariables, setAvailableVariables] = useState<string[]>([]);

    const { closeModal } = useModal();

    useEffect(() => {
        setMainState({ ...data });
    }, [data]);

    useEffect(() => {
        const usedVariables = [
            mainState.DepVar,
            ...(mainState.FeatureVar || []),
            mainState.FocalCaseIdenVar,
            mainState.CaseIdenVar,
        ].filter(Boolean);

        const updatedVariables = globalVariables.filter(
            (variable) => !usedVariables.includes(variable)
        );
        setAvailableVariables(updatedVariables);
    }, [mainState, globalVariables]);

    const handleChange = (
        field: keyof KNNMainType,
        value: CheckedState | number | boolean | string | null
    ) => {
        setMainState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleDrop = (target: string, variable: string) => {
        setMainState((prev) => {
            const updatedState = { ...prev };
            if (target === "DepVar") {
                updatedState.DepVar = variable;
            } else if (target === "FeatureVar") {
                updatedState.FeatureVar = [
                    ...(updatedState.FeatureVar || []),
                    variable,
                ];
            } else if (target === "FocalCaseIdenVar") {
                updatedState.FocalCaseIdenVar = variable;
            } else if (target === "CaseIdenVar") {
                updatedState.CaseIdenVar = variable;
            }
            return updatedState;
        });
    };

    const handleRemoveVariable = (target: string, variable?: string) => {
        setMainState((prev) => {
            const updatedState = { ...prev };
            if (target === "DepVar") {
                updatedState.DepVar = "";
            } else if (target === "FeatureVar") {
                updatedState.FeatureVar = (
                    updatedState.FeatureVar || []
                ).filter((item) => item !== variable);
            } else if (target === "FocalCaseIdenVar") {
                updatedState.FocalCaseIdenVar = "";
            } else if (target === "CaseIdenVar") {
                updatedState.CaseIdenVar = "";
            }
            return updatedState;
        });
    };

    const handleContinue = () => {
        Object.entries(mainState).forEach(([key, value]) => {
            updateFormData(key as keyof KNNMainType, value);
        });

        setIsMainOpen(false);

        onContinue(mainState);
    };

    const openDialog =
        (setter: React.Dispatch<React.SetStateAction<boolean>>) => () => {
            Object.entries(mainState).forEach(([key, value]) => {
                updateFormData(key as keyof KNNMainType, value);
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
                    <Button variant="outline">Nearest Neighbor</Button>
                </DialogTrigger> */}
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Nearest Neighbor Analysis</DialogTitle>
                    </DialogHeader>
                    <Separator />
                    <div className="flex items-center space-x-2">
                        <ResizablePanelGroup
                            direction="horizontal"
                            className="min-h-[400px] rounded-lg border md:min-w-[200px]"
                        >
                            {/* Variable List */}
                            <ResizablePanel defaultSize={25}>
                                <ScrollArea>
                                    <div className="flex flex-col gap-1 justify-start items-start h-[450px] w-full p-2">
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
                                <div className="flex flex-col h-full w-full items-start justify-start gap-3 p-2">
                                    <div className="flex flex-col w-full gap-1">
                                        <Label className="font-bold">
                                            Target (Optional):
                                        </Label>
                                        <div className="flex items-center space-x-2">
                                            <div
                                                className="w-full min-h-[40px] p-2 border rounded"
                                                onDrop={(e) => {
                                                    handleDrop(
                                                        "DepVar",
                                                        e.dataTransfer.getData(
                                                            "text"
                                                        )
                                                    );
                                                }}
                                                onDragOver={(e) =>
                                                    e.preventDefault()
                                                }
                                            >
                                                {mainState.DepVar ? (
                                                    <Badge
                                                        className="text-start text-sm font-light p-2 cursor-pointer"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleRemoveVariable(
                                                                "DepVar"
                                                            )
                                                        }
                                                    >
                                                        {mainState.DepVar}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-sm font-light text-gray-500">
                                                        Drop variables here.
                                                    </span>
                                                )}
                                            </div>
                                            <input
                                                type="hidden"
                                                value={mainState.DepVar ?? ""}
                                                name="DepVar"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col w-full gap-1">
                                        <div
                                            className="flex flex-col w-full gap-2"
                                            onDragOver={(e) =>
                                                e.preventDefault()
                                            }
                                            onDrop={(e) => {
                                                const variable =
                                                    e.dataTransfer.getData(
                                                        "text"
                                                    );
                                                handleDrop(
                                                    "FeatureVar",
                                                    variable
                                                );
                                            }}
                                        >
                                            <Label className="font-bold">
                                                Features:
                                            </Label>
                                            <div className="w-full h-[175px] p-2 border rounded overflow-hidden">
                                                <ScrollArea>
                                                    <div className="w-full h-[155px]">
                                                        {mainState.FeatureVar &&
                                                        mainState.FeatureVar
                                                            .length > 0 ? (
                                                            <div className="flex flex-col gap-1">
                                                                {mainState.FeatureVar.map(
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
                                                                                    "FeatureVar",
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
                                                                Drop variables
                                                                here.
                                                            </span>
                                                        )}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                            <input
                                                type="hidden"
                                                value={
                                                    mainState.FeatureVar ?? ""
                                                }
                                                name="Independents"
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="NormCovar"
                                                checked={mainState.NormCovar}
                                                onCheckedChange={(checked) =>
                                                    handleChange(
                                                        "NormCovar",
                                                        checked
                                                    )
                                                }
                                            />
                                            <label
                                                htmlFor="NormCovar"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Normalize Scale Features
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex flex-col w-full gap-1">
                                        <Label className="font-bold">
                                            Focal Case Identifier (Optional):
                                        </Label>
                                        <div className="flex items-center space-x-2">
                                            <div
                                                className="w-full min-h-[40px] p-2 border rounded"
                                                onDrop={(e) => {
                                                    handleDrop(
                                                        "FocalCaseIdenVar",
                                                        e.dataTransfer.getData(
                                                            "text"
                                                        )
                                                    );
                                                }}
                                                onDragOver={(e) =>
                                                    e.preventDefault()
                                                }
                                            >
                                                {mainState.FocalCaseIdenVar ? (
                                                    <Badge
                                                        className="text-start text-sm font-light p-2 cursor-pointer"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleRemoveVariable(
                                                                "FocalCaseIdenVar"
                                                            )
                                                        }
                                                    >
                                                        {
                                                            mainState.FocalCaseIdenVar
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
                                                    mainState.FocalCaseIdenVar ??
                                                    ""
                                                }
                                                name="FocalCaseIdenVar"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col w-full gap-1">
                                        <Label className="font-bold">
                                            Case Label (Optional):
                                        </Label>
                                        <div className="flex items-center space-x-2">
                                            <div
                                                className="w-full min-h-[40px] p-2 border rounded"
                                                onDrop={(e) => {
                                                    handleDrop(
                                                        "CaseIdenVar",
                                                        e.dataTransfer.getData(
                                                            "text"
                                                        )
                                                    );
                                                }}
                                                onDragOver={(e) =>
                                                    e.preventDefault()
                                                }
                                            >
                                                {mainState.CaseIdenVar ? (
                                                    <Badge
                                                        className="text-start text-sm font-light p-2 cursor-pointer"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleRemoveVariable(
                                                                "CaseIdenVar"
                                                            )
                                                        }
                                                    >
                                                        {mainState.CaseIdenVar}
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
                                                    mainState.CaseIdenVar ?? ""
                                                }
                                                name="CaseIdenVar"
                                            />
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
                                        onClick={openDialog(setIsNeighborsOpen)}
                                    >
                                        Neighbors...
                                    </Button>
                                    <Button
                                        className="w-full"
                                        type="button"
                                        variant="secondary"
                                        disabled={
                                            mainState.DepVar === "" ||
                                            mainState.DepVar === null
                                        }
                                        onClick={openDialog(setIsFeaturesOpen)}
                                    >
                                        Features...
                                    </Button>
                                    <Button
                                        className="w-full"
                                        type="button"
                                        variant="secondary"
                                        onClick={openDialog(setIsPartitionOpen)}
                                    >
                                        Partitions...
                                    </Button>
                                    <Button
                                        className="w-full"
                                        type="button"
                                        variant="secondary"
                                        onClick={openDialog(setIsSaveOpen)}
                                    >
                                        Save...
                                    </Button>
                                    <Button
                                        className="w-full"
                                        type="button"
                                        variant="secondary"
                                        onClick={openDialog(setIsOutputOpen)}
                                    >
                                        Output...
                                    </Button>
                                    <Button
                                        className="w-full"
                                        type="button"
                                        variant="secondary"
                                        onClick={openDialog(setIsOptionsOpen)}
                                    >
                                        Options...
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
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import type {
  KNNDialogProps,
  KNNMainType,
} from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useModal } from "@/hooks/useModal";
import type { Variable } from "@/types/Variable";
import VariableListManager from "@/components/Common/VariableListManager";
import type { TargetListConfig } from "@/components/Common/VariableListManager";

export const KNNDialog = ({
  isMainOpen,
  setIsMainOpen,
  setIsNeighborsOpen,
  setIsFeaturesOpen,
  setIsPartitionOpen,
  setIsSaveOpen,
  setIsOutputOpen,
  setIsOptionsOpen,
  updateFormData,
  data,
  globalVariables,
  onContinue,
  onReset,
}: KNNDialogProps) => {
  const [mainState, setMainState] = useState<KNNMainType>({ ...data });
  const [availableVars, setAvailableVars] = useState<Variable[]>([]);
  const [featureVars, setFeatureVars] = useState<Variable[]>([]);
  const [targetVar, setTargetVar] = useState<Variable[]>([]);
  const [highlightedVariable, setHighlightedVariable] = useState<{
    id: string;
    source: string;
  } | null>(null);
  const [focalVars, setFocalVars] = useState<Variable[]>([]);
  const [caseLabelVars, setCaseLabelVars] = useState<Variable[]>([]);

  const { closeModal } = useModal();

  useEffect(() => {
    setMainState({ ...data });
  }, [data]);

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

    setAvailableVars(allVariables);
  }, [data, globalVariables]);

  const handleChange = (
    field: keyof KNNMainType,
    value: CheckedState | number | boolean | string | null,
  ) => {
    setMainState((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  useEffect(() => {
    setMainState((prev) => ({
      ...prev,
      DepVar: targetVar[0]?.name || null,
      FeatureVar: featureVars.map((v) => v.name),
      FocalCaseIdenVar: focalVars[0]?.name || null,
      CaseIdenVar: caseLabelVars[0]?.name || null,
    }));
  }, [targetVar, featureVars, focalVars, caseLabelVars]);

  const handleDrop = (target: string, variable: string) => {
    setMainState((prev) => {
      const updatedState = { ...prev };
      if (target === "DepVar") {
        updatedState.DepVar = variable;
      } else if (target === "FeatureVar") {
        updatedState.FeatureVar = [
          ...(updatedState.FeatureVar || []),
          variable,
        ];
      } else if (target === "FocalCaseIdenVar") {
        updatedState.FocalCaseIdenVar = variable;
      } else if (target === "CaseIdenVar") {
        updatedState.CaseIdenVar = variable;
      }
      return updatedState;
    });
  };

  const handleRemoveVariable = (target: string, variable?: string) => {
    setMainState((prev) => {
      const updatedState = { ...prev };
      if (target === "DepVar") {
        updatedState.DepVar = "";
      } else if (target === "FeatureVar") {
        updatedState.FeatureVar = (updatedState.FeatureVar || []).filter(
          (item) => item !== variable,
        );
      } else if (target === "FocalCaseIdenVar") {
        updatedState.FocalCaseIdenVar = "";
      } else if (target === "CaseIdenVar") {
        updatedState.CaseIdenVar = "";
      }
      return updatedState;
    });
  };

  const handleContinue = () => {
    Object.entries(mainState).forEach(([key, value]) => {
      updateFormData(key as keyof KNNMainType, value);
    });

    setIsMainOpen(false);

    onContinue(mainState);
  };

  const listStateSetters: Record<
    string,
    React.Dispatch<React.SetStateAction<Variable[]>>
  > = {
    available: setAvailableVars,
    DepVar: setTargetVar,
    FeatureVar: setFeatureVars,
    FocalCaseIdenVar: setFocalVars,
    CaseIdenVar: setCaseLabelVars,
  };

  const handleReorderVariable = useCallback(
    (listId: string, newVariables: Variable[]) => {
      const setter = listStateSetters[listId];
      if (setter) {
        setter(newVariables);
      }
    },
    [listStateSetters],
  );

  const handleMoveVariable = (
    variable: Variable,
    fromListId: string,
    toListId: string,
  ) => {
    const fromSetter = listStateSetters[fromListId];
    const toSetter = listStateSetters[toListId];

    if (fromSetter) {
      fromSetter((prev) => prev.filter((v) => v.name !== variable.name));
    }

    if (toSetter) {
      if (toListId === "DepVar") {
        toSetter([variable]); // max 1
      } else {
        toSetter((prev) => [...prev, variable]);
      }
    }
  };

  const openDialog =
    (setter: React.Dispatch<React.SetStateAction<boolean>>) => () => {
      Object.entries(mainState).forEach(([key, value]) => {
        updateFormData(key as keyof KNNMainType, value);
      });
      setter(true);
    };

  const handleDialog = () => {
    setIsMainOpen(false);
    closeModal();
  };

  const targetListsConfig: TargetListConfig[] = useMemo(
    () => [
      {
        id: "DepVar",
        title: "Target (Optional):",
        variables: targetVar,
        maxItems: 1,
        height: "80px",
      },
      {
        id: "FeatureVar",
        title: "Features:",
        variables: featureVars,
        height: "200px",
      },
      {
        id: "FocalCaseIdenVar",
        title: "Focal Case Identifier (Optional):",
        variables: focalVars,
        maxItems: 1,
        height: "80px",
      },
      {
        id: "CaseIdenVar",
        title: "Case Label (Optional):",
        variables: caseLabelVars,
        maxItems: 1,
        height: "80px",
      },
    ],
    [targetVar, featureVars, focalVars, caseLabelVars],
  );

  if (!isMainOpen) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col items-center gap-2 p-4 flex-grow">
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[400px] rounded-lg border md:min-w-[200px]"
        >
          {/* Variable List */}
          <ResizablePanel defaultSize={75}>
            <div className="p-2 h-full">
              <VariableListManager
                availableVariables={availableVars}
                targetLists={targetListsConfig}
                variableIdKey="name"
                highlightedVariable={highlightedVariable}
                setHighlightedVariable={setHighlightedVariable}
                onMoveVariable={handleMoveVariable}
                onReorderVariable={handleReorderVariable}
                showArrowButtons
                availableListHeight="300px"
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Tools Area */}
          <ResizablePanel defaultSize={25}>
            <div className="flex flex-col h-full w-full items-center justify-start gap-1 p-2">
              <Button
                className="w-full truncate"
                type="button"
                variant="outline"
                onClick={openDialog(setIsNeighborsOpen)}
              >
                Neighbors
              </Button>
              <Button
                className="w-full truncate"
                type="button"
                variant="outline"
                disabled={mainState.DepVar === "" || mainState.DepVar === null}
                onClick={openDialog(setIsFeaturesOpen)}
              >
                Features
              </Button>
              <Button
                className="w-full truncate"
                type="button"
                variant="outline"
                onClick={openDialog(setIsPartitionOpen)}
              >
                Partitions
              </Button>
              <Button
                className="w-full truncate"
                type="button"
                variant="outline"
                onClick={openDialog(setIsSaveOpen)}
              >
                Save
              </Button>
              <Button
                className="w-full truncate"
                type="button"
                variant="outline"
                onClick={openDialog(setIsOutputOpen)}
              >
                Output
              </Button>
              <Button
                className="w-full truncate"
                type="button"
                variant="outline"
                onClick={openDialog(setIsOptionsOpen)}
              >
                Options
              </Button>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
        <div>
          {/* <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild> */}
          {/* <Button
                        variant="ghost"
                        size="icon"
                        onClick={startTour}
                        className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button> */}
          {/* </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Start feature tour</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider> */}
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
          <Button id="knn-ok-button" type="button" onClick={handleContinue}>
            OK
          </Button>
        </div>
      </div>
    </div>
  );
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
};
