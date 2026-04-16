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
import { KNNOptions } from "@/components/Modals/Analyze/Classify/nearest-neighbor/dialogs/options";

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

export const KNNContainer = ({ onClose }: KNNContainerProps) => {
  const variables = useVariableStore((state) => state.variables);
  const dataVariables = useDataStore((state) => state.data);

  const tempVariables = useMemo(
    () => variables.map((variable) => variable.name),
    [variables],
  );

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
        setFormData(formDataWithoutId);
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
    if (formData.main.FeatureVar) {
      setFormData((prev) => ({
        ...prev,
        features: {
          ...prev.features,
          ForwardSelection: prev.main.FeatureVar
            ? [...prev.main.FeatureVar]
            : [],
        },
        partition: {
          ...prev.partition,
          SrcVar: prev.main.FeatureVar ? [...prev.main.FeatureVar] : [],
        },
      }));
    }
  }, [formData.main.FeatureVar]);

  const updateFormData = <T extends keyof typeof formData>(
    section: T,
    field: keyof (typeof formData)[T],
    value: unknown,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const executeKNN = async (mainData: KNNMainType) => {
    closeModal();
    onClose();

    const promise = async () => {
      const newFormData = {
        ...formData,
        main: mainData,
      };

      await saveFormData("NearestNeighbor", newFormData);

      await analyzeKNN({
        configData: newFormData,
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow px-6 min-h-0">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-7 flex-shrink-0">
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

            <TabsTrigger value="options" className="min-w-0">
              <span className="truncate block w-full">Options</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-grow min-h-0">
            <TabsContent value="variables" className="h-full min-h-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden flex-col">
              <KNNDialog
                data={formData.main}
                globalVariables={tempVariables}
                updateFormData={(field, value) =>
                  updateFormData("main", field, value)
                }
              />
            </TabsContent>

            <TabsContent value="neighbors" className="h-full min-h-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden flex">
              <KNNNeighbors
                data={formData.neighbors}
                updateFormData={(field, value) =>
                  updateFormData("neighbors", field, value)
                }
              />
            </TabsContent>

            <TabsContent value="features" className="h-full min-h-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden flex-col">
              <KNNFeatures
                data={formData.features}
                updateFormData={(field, value) =>
                  updateFormData("features", field, value)
                }
              />
            </TabsContent>

            <TabsContent value="partition" className="h-full min-h-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden flex-col">
              <KNNPartition
                data={formData.partition}
                updateFormData={(field, value) =>
                  updateFormData("partition", field, value)
                }
              />
            </TabsContent>

            <TabsContent value="save" className="h-full min-h-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden flex-col">
              <KNNSave
                data={formData.save}
                updateFormData={(field, value) =>
                  updateFormData("save", field, value)
                }
              />
            </TabsContent>

            <TabsContent value="output" className="h-full min-h-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden flex-col">
              <KNNOutput
                data={formData.output}
                updateFormData={(field, value) =>
                  updateFormData("output", field, value)
                }
              />
            </TabsContent>

            <TabsContent value="options" className="h-full min-h-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden flex-col">
              <KNNOptions
                data={formData.options}
                updateFormData={(field, value) =>
                  updateFormData("options", field, value)
                }
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="px-6 py-3 border-t border-border flex items-center justify-end gap-4 bg-secondary">
        <Button
          onClick={() => executeKNN(formData.main)}
          disabled={!formData.main.TargetVar}
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
