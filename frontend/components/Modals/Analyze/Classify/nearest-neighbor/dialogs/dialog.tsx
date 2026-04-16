import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import type {
  KNNDialogProps,
  KNNMainType,
} from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor";

import { useModal } from "@/hooks/useModal";
import type { Variable } from "@/types/Variable";

import VariableListManager from "@/components/Common/VariableListManager";
import type { TargetListConfig } from "@/components/Common/VariableListManager";

export const KNNDialog = ({
  updateFormData,
  data,
  globalVariables,
}: KNNDialogProps) => {
  const [mainState, setMainState] = useState<KNNMainType>({ ...data });

  const [availableVars, setAvailableVars] = useState<Variable[]>([]);
  const [featureVars, setFeatureVars] = useState<Variable[]>([]);
  const [targetVar, setTargetVar] = useState<Variable[]>([]);
  const [focalVars, setFocalVars] = useState<Variable[]>([]);
  const [caseLabelVars, setCaseLabelVars] = useState<Variable[]>([]);

  const [highlightedVariable, setHighlightedVariable] = useState<{
    id: string;
    source: string;
  } | null>(null);

  const { closeModal } = useModal();

  useEffect(() => {
    setMainState({ ...data });
  }, [data]);

  useEffect(() => {
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
  }, [globalVariables]);

  const listStateSetters: Record<
    string,
    React.Dispatch<React.SetStateAction<Variable[]>>
  > = {
    available: setAvailableVars,
    TargetVar: setTargetVar,
    FeatureVar: setFeatureVars,
    FocalCaseIdenVar: setFocalVars,
    CaseIdenVar: setCaseLabelVars,
  };

  const handleReorderVariable = useCallback(
    (listId: string, newVariables: Variable[]) => {
      const setter = listStateSetters[listId];
      if (setter) setter(newVariables);
    },
    [],
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
      if (toListId === "TargetVar") {
        toSetter([variable]);
      } else {
        toSetter((prev) => [...prev, variable]);
      }
    }
  };

  useEffect(() => {
    const newState: KNNMainType = {
      ...mainState,
      TargetVar: targetVar[0]?.name || null,
      FeatureVar: featureVars.map((v) => v.name),
      FocalCaseIdenVar: focalVars[0]?.name || null,
      CaseIdenVar: caseLabelVars[0]?.name || null,
    };

    setMainState(newState);

    Object.entries(newState).forEach(([key, value]) => {
      updateFormData(key as keyof KNNMainType, value);
    });
  }, [targetVar, featureVars, focalVars, caseLabelVars]);

  const targetListsConfig: TargetListConfig[] = useMemo(
    () => [
      {
        id: "TargetVar",
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

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full min-h-[550px] w-full max-w-2xl rounded-lg border md:min-w-[200px]"
        >
          <ResizablePanel defaultSize={100}>
            <div className="p-2 h-full min-h-0">
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
        </ResizablePanelGroup>
      </div>
    </div>
  );
};
