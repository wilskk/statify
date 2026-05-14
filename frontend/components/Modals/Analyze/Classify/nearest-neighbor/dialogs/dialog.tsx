import React, { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useVariableStore } from "@/stores/useVariableStore";
import type { KNNDialogProps } from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor";

import { useModal } from "@/hooks/useModal";
import type { Variable } from "@/types/Variable";

import VariableListManager from "@/components/Common/VariableListManager";
import type { TargetListConfig } from "@/components/Common/VariableListManager";

export const KNNDialog = ({
  updateFormData,
  data,
  externalErrors,
}: KNNDialogProps) => {
  const [highlightedVariable, setHighlightedVariable] = useState<{
    id: string;
    source: string;
  } | null>(null);

  const { closeModal } = useModal();

  const variables = useVariableStore((state) => state.variables);

  const allVariables = variables;

  const targetVar = data.TargetVar ? [data.TargetVar] : [];
  const featureVars = data.FeatureVar || [];
  const focalVars = data.FocalCaseIdenVar ? [data.FocalCaseIdenVar] : [];
  const caseLabelVars = data.CaseIdenVar ? [data.CaseIdenVar] : [];

  const variableMap = useMemo(() => {
    return new Map(allVariables.map((v) => [v.name, v]));
  }, [allVariables]);

  const availableVars = useMemo(() => {
    const used = new Set([
      data.TargetVar,
      ...(data.FeatureVar || []),
      data.FocalCaseIdenVar,
      data.CaseIdenVar,
    ]);

    return allVariables.filter((v) => !used.has(v.name));
  }, [allVariables, data]);

  const isScale = (v: Variable) => v.measure === "scale";
  const isCategorical = (v: Variable) =>
    v.measure === "nominal" || v.measure === "ordinal";
  const isNumericVariable = (v: Variable) =>
    [
      "NUMERIC",
      "COMMA",
      "DOT",
      "SCIENTIFIC",
      "DOLLAR",
      "RESTRICTED_NUMERIC",
    ].includes(v.type ?? "");

  const handleMoveVariable = (
    variable: Variable,
    fromListId: string,
    toListId: string,
  ) => {
    if (toListId === "TargetVar") {
      updateFormData("TargetVar", variable.name);
    }

    if (toListId === "FeatureVar") {
      if (!featureVars.includes(variable.name)) {
        updateFormData("FeatureVar", [...featureVars, variable.name]);
      }
    }

    if (toListId === "FocalCaseIdenVar") {
      if (isNumericVariable(variable)) {
        updateFormData("FocalCaseIdenVar", variable.name);
      }
    }

    if (toListId === "CaseIdenVar") {
      updateFormData("CaseIdenVar", variable.name);
    }

    // =========================
    // REMOVE
    // =========================
    if (fromListId === "FeatureVar") {
      updateFormData(
        "FeatureVar",
        featureVars.filter((v) => v !== variable.name),
      );
    }

    if (fromListId === "TargetVar") {
      updateFormData("TargetVar", null);
    }

    if (fromListId === "FocalCaseIdenVar") {
      updateFormData("FocalCaseIdenVar", null);
    }

    if (fromListId === "CaseIdenVar") {
      updateFormData("CaseIdenVar", null);
    }
  };

  const handleReorderVariable = (listId: string, newVariables: Variable[]) => {
    if (listId === "FeatureVar") {
      updateFormData(
        "FeatureVar",
        newVariables.map((v) => v.name),
      );
    }
  };

  const errors = externalErrors ?? [];

  const mapToVariables = (names: string[]) =>
    names
      .map((name) => variableMap.get(name))
      .filter((v): v is Variable => Boolean(v));

  const targetListsConfig: TargetListConfig[] = useMemo(
    () => [
      {
        id: "TargetVar",
        title: "Target:",
        variables: mapToVariables(targetVar),
        maxItems: 1,
        height: "80px",
      },
      {
        id: "FeatureVar",
        title: "Features:",
        variables: mapToVariables(featureVars),
        height: "200px",
      },
      {
        id: "FocalCaseIdenVar",
        title: "Focal Case Identifier (Optional):",
        variables: mapToVariables(focalVars),
        maxItems: 1,
        height: "80px",
        allowedTypes: [
          "NUMERIC",
          "COMMA",
          "DOT",
          "SCIENTIFIC",
          "DOLLAR",
          "RESTRICTED_NUMERIC",
        ],
      },
      {
        id: "CaseIdenVar",
        title: "Case Label (Optional):",
        variables: mapToVariables(caseLabelVars),
        maxItems: 1,
        height: "80px",
      },
    ],
    [targetVar, featureVars, focalVars, caseLabelVars, variableMap],
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
        <div className="flex items-start gap-2 rounded-md border bg-muted/50 p-3 text-sm">
          <Info className="w-12 h-12 mt-0.5 text-blue-500" />
          <p>
            A target is required for KNN classification.
          </p>
        </div>

        <ResizablePanelGroup
          direction="horizontal"
          className="h-full min-h-[550px] w-full max-w-2xl rounded-lg border"
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
                renderListFooter={(listId) => {
                  if (listId !== "FeatureVar") return null;

                  return (
                    <div className="mt-2 px-1">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="normalize"
                          checked={data.NormCovar ?? true}
                          onChange={(e) =>
                            updateFormData("NormCovar", e.target.checked)
                          }
                        />
                        <label htmlFor="normalize" className="text-sm">
                          Normalize scale features
                        </label>
                      </div>
                    </div>
                  );
                }}
              />
              <div className="mt-3 space-y-1">
                {errors.map((err, i) => (
                  <div key={i} className="text-xs text-red-500">
                    {err}
                  </div>
                ))}

                {errors.length === 0 && (
                  <div className="text-xs text-muted-foreground">
                    Select variables for analysis.
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};
