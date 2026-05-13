"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KNNDialog } from "@/components/Modals/Analyze/Classify/nearest-neighbor/dialogs/dialog";
import { KNNNeighbors } from "@/components/Modals/Analyze/Classify/nearest-neighbor/dialogs/neighbors";
import { KNNFeatures } from "@/components/Modals/Analyze/Classify/nearest-neighbor/dialogs/features";
import { KNNPartition } from "@/components/Modals/Analyze/Classify/nearest-neighbor/dialogs/partition";
import { KNNSave } from "@/components/Modals/Analyze/Classify/nearest-neighbor/dialogs/save";
import { KNNOutput } from "@/components/Modals/Analyze/Classify/nearest-neighbor/dialogs/output";

import type {
  KNNContainerProps,
  KNNMainType,
  KNNType,
} from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor";

import { KNNDefault } from "@/components/Modals/Analyze/Classify/nearest-neighbor/constants/nearest-neighbor-default";

import { useModal } from "@/hooks/useModal";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";

import { analyzeKNN } from "@/components/Modals/Analyze/Classify/nearest-neighbor/services/nearest-neighbor-analysis";
import { clearFormData, getFormData, saveFormData } from "@/hooks/useIndexedDB";

import { toast } from "sonner";

const stripRemovedConfig = (data: KNNType & { options?: unknown }): KNNType => {
  const { options, ...config } = data;
  return config;
};

export const KNNContainer = ({ onClose }: KNNContainerProps) => {
  const variables = useVariableStore((state) => state.variables);
  const dataVariables = useDataStore((state) => state.data);

  const [formData, setFormData] = useState<KNNType>({
    ...KNNDefault,
  });

  const [activeTab, setActiveTab] = useState("variables");

  const { closeModal } = useModal();

  useEffect(() => {
    const loadFormData = async () => {
      const savedData = await getFormData("NearestNeighbor");

      if (savedData) {
        const { id, ...formDataWithoutId } = savedData;
        setFormData(stripRemovedConfig(formDataWithoutId));
      } else {
        setFormData({ ...KNNDefault });
      }
    };

    toast.promise(loadFormData, {
      loading: "Loading KNN settings...",
      success: "KNN settings loaded successfully.",
      error: "Failed to load KNN settings.",
    });
  }, []);

  useEffect(() => {
    const featureVars = formData.main.FeatureVar ?? [];

    setFormData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        ForwardSelection: featureVars,
      },
    }));
  }, [formData.main.FeatureVar]);

  const updateFormData = (
    section: keyof KNNType,
    field: string,
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const executeKNN = async () => {
    closeModal();
    onClose();

    const promise = async () => {
      const configData = stripRemovedConfig(formData);

      await saveFormData("NearestNeighbor", configData);

      await analyzeKNN({
        configData,
        dataVariables,
        variables,
      });
    };

    toast.promise(promise, {
      loading: "Running KNN analysis...",
      success: "KNN analysis completed successfully.",
      error: "An error occurred during KNN analysis.",
    });
  };

  const resetFormData = async () => {
    try {
      setFormData({ ...KNNDefault });
      await clearFormData("NearestNeighbor");

      toast.success("Form data cleared successfully");
    } catch {
      toast.error("Failed to clear form data");
    }
  };

  const variableMap = useMemo(() => {
    return new Map(variables.map((v) => [v.name, v]));
  }, [variables]);

  const availableVariables = useMemo(() => {
    const used = new Set([
      formData.main.TargetVar,
      ...(formData.main.FeatureVar || []),
      formData.main.FocalCaseIdenVar,
      formData.main.CaseIdenVar,
    ]);

    return variables.filter((v) => !used.has(v.name)).map((v) => v.name);
  }, [variables, formData.main]);

  const targetVariable = formData.main.TargetVar
    ? variableMap.get(formData.main.TargetVar)
    : null;

  const hasTarget = !!targetVariable;

  const targetType =
    targetVariable && targetVariable.measure !== "unknown"
      ? targetVariable.measure // scale | nominal | ordinal
      : null;

  const isAutoK = formData.neighbors.AutoSelection;
  const isFeatureSelectionActive = formData.features.PerformSelection;

  const validation = useMemo(() => {
    const errors: string[] = [];

    const featureVars = formData.main.FeatureVar ?? [];

    if (!formData.main.TargetVar) {
      errors.push("A target variable is required for KNN classification.");
    }

    if (featureVars.length === 0) {
      errors.push("At least one feature variable is required.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [formData.main]);

  const validateFeatureSelection = () => {
    const f = formData.features;

    if (!f.PerformSelection) return null;

    const forwardCount = (f.ForwardSelection ?? []).filter(
      (v) => !(f.ForcedEntryVar ?? []).includes(v),
    ).length;
    if (f.MaxReached && (!f.MaxToSelect || f.MaxToSelect <= 0)) {
      return "Enter a positive integer for the number of features to select.";
    }

    if (
      f.MaxReached &&
      f.MaxToSelect !== null &&
      f.MaxToSelect > forwardCount
    ) {
      return "The number of features to select must be less than or equal to the number of features to evaluate (the number of features in the Forward Selection list).";
    }

    return null;
  };

  const featureError = validateFeatureSelection();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow px-6 min-h-0">
        <Tabs
          value={activeTab}
          onValueChange={(nextTab) => {
            const error = validateFeatureSelection();

            if (error) {
              toast.error(error);
              return;
            }
            setActiveTab(nextTab);
          }}
          className="w-full h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-6 flex-shrink-0">
            <TabsTrigger value="variables" className="min-w-0">
              <span className="truncate block w-full">Variables</span>
            </TabsTrigger>

            <TabsTrigger value="neighbors" className="min-w-0">
              <span className="truncate block w-full">Neighbors</span>
            </TabsTrigger>

            <TabsTrigger value="features" className="min-w-0">
              <span className="truncate block w-full">Features</span>
            </TabsTrigger>

            <TabsTrigger value="partition" className="min-w-0">
              <span className="truncate block w-full">Partition</span>
            </TabsTrigger>

            <TabsTrigger value="save" className="min-w-0">
              <span className="truncate block w-full">Save</span>
            </TabsTrigger>

            <TabsTrigger value="output" className="min-w-0">
              <span className="truncate block w-full">Output</span>
            </TabsTrigger>

          </TabsList>

          <div className="flex-grow min-h-0">
            <TabsContent
              value="variables"
              className="h-full min-h-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden flex-col"
            >
              <KNNDialog
                data={formData.main}
                updateFormData={(field, value) =>
                  updateFormData("main", field, value)
                }
                externalErrors={validation.errors}
              />
            </TabsContent>

            <TabsContent
              value="neighbors"
              className="h-full min-h-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden flex"
            >
              <KNNNeighbors
                data={formData.neighbors}
                updateFormData={(field, value) =>
                  updateFormData("neighbors", field, value)
                }
                hasTarget={hasTarget}
                targetType={targetType}
              />
            </TabsContent>

            <TabsContent
              value="features"
              className="h-full min-h-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden flex-col"
            >
              <KNNFeatures
                data={formData.features}
                updateFormData={(field, value) =>
                  updateFormData("features", field, value)
                }
                hasTarget={hasTarget}
              />
            </TabsContent>

            <TabsContent
              value="partition"
              className="h-full min-h-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden flex-col"
            >
              <KNNPartition
                data={formData.partition}
                updateFormData={(field, value) =>
                  updateFormData("partition", field, value)
                }
                availableVariables={availableVariables}
                isAutoK={isAutoK}
                isFeatureSelectionActive={isFeatureSelectionActive}
              />
            </TabsContent>

            <TabsContent
              value="save"
              className="h-full min-h-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden flex-col"
            >
              <KNNSave
                data={formData.save}
                updateFormData={(field, value) =>
                  updateFormData("save", field, value)
                }
                hasTarget={hasTarget}
                targetType={targetType}
                isAutoK={isAutoK}
                isFeatureSelectionActive={isFeatureSelectionActive}
                featureCount={(formData.main.FeatureVar ?? []).length}
              />
            </TabsContent>

            <TabsContent
              value="output"
              className="h-full min-h-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden flex-col"
            >
              <KNNOutput
                data={formData.output}
                updateFormData={(field, value) =>
                  updateFormData("output", field, value)
                }
                focalCaseVar={formData.main.FocalCaseIdenVar}
                isAutoK={isAutoK}
                isFeatureSelectionActive={isFeatureSelectionActive}
              />
            </TabsContent>

          </div>
        </Tabs>
      </div>

      <div className="px-6 py-3 border-t border-border flex items-center justify-end gap-4 bg-secondary">
        <Button
          onClick={() => {
            const error = validateFeatureSelection();

            if (error) {
              toast.error(error);
              return;
            }

            executeKNN();
          }}
          disabled={!validation.isValid}
        >
          OK
        </Button>

        <Button variant="outline" onClick={resetFormData}>
          Reset
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            closeModal();
            onClose();
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default KNNContainer;
