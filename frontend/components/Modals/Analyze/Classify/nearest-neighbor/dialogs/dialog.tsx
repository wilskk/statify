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
};
