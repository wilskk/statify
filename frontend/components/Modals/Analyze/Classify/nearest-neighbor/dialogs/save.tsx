import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type {
  KNNSaveProps,
  KNNSaveType,
} from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export const KNNSave = ({
  updateFormData,
  data,
  hasTarget,
  targetType,
  isAutoK,
  isFeatureSelectionActive,
  featureCount,
}: KNNSaveProps) => {
  const [saveState, setSaveState] = useState<KNNSaveType>({
    ...data,
    AutoName: true,
    CustomName: false,
    MaxCatsToSave: data.MaxCatsToSave ?? 25,
  });

  useEffect(() => {
    if (JSON.stringify(data) === JSON.stringify(saveState)) return;
    setSaveState({ ...data, MaxCatsToSave: data.MaxCatsToSave ?? 25 });
  }, [data]);

  useEffect(() => {
    if (JSON.stringify(saveState) === JSON.stringify(data)) return;
    Object.entries(saveState).forEach(([key, value]) => {
      updateFormData(key as keyof KNNSaveType, value);
    });
  }, [saveState]);

  const isCategorical = targetType === "nominal" || targetType === "ordinal";

  const noVariables = !hasTarget && featureCount === 0;
  const onlyFeatures = !hasTarget && featureCount > 0;

  // =======================
  // ENABLE LOGIC
  // =======================

  // ❌ default semua mati dulu
  let canPredict = false;
  let canProbability = false;
  let canFold = false;

  // 🔴 Kondisi 1
  if (noVariables || onlyFeatures) {
    // cuma partition
  }

  // 🟡 Kondisi 2 (scale)
  else if (hasTarget && targetType === "scale") {
    canPredict = true;
  }

  // 🟢 Kondisi 3 (categorical)
  else if (hasTarget && isCategorical) {
    canPredict = true;
    canProbability = true;
  }

  // 🔵 Kondisi 4 (AutoK override)
  if (isAutoK && !isFeatureSelectionActive) {
    canPredict = true;
    canProbability = true;
    canFold = true;
  }

  useEffect(() => {
    setSaveState((prev) => ({
      ...prev,
      HasTargetVar: canPredict ? prev.HasTargetVar : false,
      IsCateTargetVar: canProbability ? prev.IsCateTargetVar : false,
      RandomAssignToFold: canFold ? prev.RandomAssignToFold : false,
    }));
  }, [canPredict, canProbability, canFold]);

  const handleChange = (
    field: keyof KNNSaveType,
    value: CheckedState | number | boolean | string | null,
  ) => {
    setSaveState((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  const handleSavedGrp = (value: string) => {
    setSaveState((prevState) => ({
      ...prevState,
      AutoName: value === "AutoName",
      CustomName: value === "CustomName",
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-start gap-2 p-4">
          <ResizablePanelGroup
            direction="vertical"
            className="min-h-[250px] rounded-lg border md:min-w-[200px]"
          >
            <ResizablePanel defaultSize={100}>
              <RadioGroup
                value={saveState.AutoName ? "AutoName" : "CustomName"}
                onValueChange={handleSavedGrp}
              >
                <div className="flex flex-col gap-2 p-2">
                  <Label className="font-bold">Names of Saved Variables</Label>
                  <div className="flex flex-row gap-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="AutoName" id="AutoName" />
                      <Label htmlFor="AutoName">
                        Automatically generate unique names
                      </Label>
                    </div>
                  </div>
                  <div className="pl-6">
                    <p className="text-sm text-justify">
                      Select this option if you want to add a new set of saved
                      variables to your dataset each time you run a model.
                    </p>
                  </div>
                  <div className="flex flex-row gap-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="CustomName" id="CustomName" />
                      <Label htmlFor="CustomName">Use custom names</Label>
                    </div>
                  </div>
                  <div className="pl-6">
                    <p className="text-sm text-justify">
                      Specify names for the variables. If you select this
                      option, any existing variables with the same name or root
                      name are replaced each time you run a model.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
        <div className="flex flex-col gap-2 p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] text-center">Save</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Variable Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-center">
                  <Checkbox
                    id="HasTargetVar"
                    checked={saveState.HasTargetVar}
                    disabled={!canPredict}
                    onCheckedChange={(checked) =>
                      handleChange("HasTargetVar", checked)
                    }
                  />
                </TableCell>
                <TableCell>
                  <label
                    htmlFor="HasTargetVar"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Predicted Value or Category
                  </label>
                </TableCell>
                <TableCell>
                  <Input
                    value="KNN_PredictedValue"
                    disabled={
                      saveState.AutoName ||
                      !canPredict ||
                      !saveState.HasTargetVar
                    }
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center">
                  <Checkbox
                    id="IsCateTargetVar"
                    checked={saveState.IsCateTargetVar}
                    disabled={!canProbability}
                    onCheckedChange={(checked) =>
                      handleChange("IsCateTargetVar", checked)
                    }
                  />
                </TableCell>
                <TableCell>
                  <label
                    htmlFor="IsCateTargetVar"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Predicted Probability (Category Target)
                  </label>
                </TableCell>
                <TableCell>
                  <Input
                    value="KNN_Probability"
                    disabled={
                      saveState.AutoName ||
                      !canProbability ||
                      !saveState.IsCateTargetVar
                    }
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center">
                  <Checkbox
                    id="RandomAssignToPartition"
                    checked={saveState.RandomAssignToPartition}
                    disabled={false}
                    onCheckedChange={(checked) =>
                      handleChange("RandomAssignToPartition", checked)
                    }
                  />
                </TableCell>
                <TableCell>
                  <label
                    htmlFor="RandomAssignToPartition"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Training/Holdout Partition Variable
                  </label>
                </TableCell>
                <TableCell>
                  <Input
                    value="KNN_Partition"
                    disabled={
                      saveState.AutoName || !saveState.RandomAssignToPartition
                    }
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center">
                  <Checkbox
                    id="RandomAssignToFold"
                    checked={saveState.RandomAssignToFold}
                    disabled={!canFold}
                    onCheckedChange={(checked) =>
                      handleChange("RandomAssignToFold", checked)
                    }
                  />
                </TableCell>
                <TableCell>
                  <label
                    htmlFor="RandomAssignToFold"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Cross-Validation Fold Variable
                  </label>
                </TableCell>
                <TableCell>
                  <Input
                    value="KNN_Fold"
                    disabled={
                      saveState.AutoName ||
                      !canFold ||
                      !saveState.RandomAssignToFold
                    }
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="flex flex-row items-center gap-2">
            <Label className="w-[275px]" htmlFor="MaxCatsToSave">
              Maximum Number of Categories to Save:
            </Label>
            <Input
              id="MaxCatsToSave"
              type="number"
              className="w-[75px]"
              disabled={!(targetType === "nominal" || targetType === "ordinal")}
              value={saveState.MaxCatsToSave ?? ""}
              onChange={(e) =>
                handleChange("MaxCatsToSave", Number(e.target.value))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
