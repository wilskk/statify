import React, { useEffect, useState } from "react";
import type {
  KNNPartitionProps,
  KNNPartitionType,
} from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor";
import type { CheckedState } from "@radix-ui/react-checkbox";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export const KNNPartition = ({
  updateFormData,
  data,
  availableVariables,
  isAutoK,
  isFeatureSelectionActive,
}: KNNPartitionProps) => {
  const [partitionState, setPartitionState] = useState<KNNPartitionType>({
    ...data,
    UseRandomly: data.UseRandomly ?? true,
    UseVariable: data.UseVariable ?? false,
  });

  const isCrossValidationEnabled = isAutoK && !isFeatureSelectionActive;

  useEffect(() => {
    if (JSON.stringify(data) === JSON.stringify(partitionState)) return;
    setPartitionState({
      ...data,
      UseRandomly: data.UseRandomly ?? true,
      UseVariable: data.UseVariable ?? false,
    });
  }, [data]);

  const partitionMode = partitionState.UseRandomly
    ? "UseRandomly"
    : partitionState.UseVariable
      ? "UseVariable"
      : "UseRandomly";

  const foldMode = partitionState.VFoldUseRandomly
    ? "VFoldUseRandomly"
    : partitionState.VFoldUsePartitioningVar
      ? "VFoldUsePartitioningVar"
      : "VFoldUseRandomly"; // default

  useEffect(() => {
    if (isCrossValidationEnabled) {
      setPartitionState((prev) => ({
        ...prev,
        VFoldUseRandomly: prev.VFoldUseRandomly ?? true,
        VFoldUsePartitioningVar: prev.VFoldUsePartitioningVar ?? false,
        NumPartition: prev.NumPartition ?? 10, // biasanya default 10 folds
      }));
    } else if (isFeatureSelectionActive) {
      setPartitionState((prev) => ({
        ...prev,
        VFoldUseRandomly: false,
        VFoldUsePartitioningVar: false,
      }));
    }
  }, [isCrossValidationEnabled, isFeatureSelectionActive]);

  const filteredAvailableVariables = availableVariables.filter(
    (variable) =>
      variable !== partitionState.PartitioningVariable &&
      variable !== partitionState.VFoldPartitioningVariable,
  );

  useEffect(() => {
    if (JSON.stringify(partitionState) === JSON.stringify(data)) return;

    Object.entries(partitionState).forEach(([key, value]) => {
      updateFormData(key as keyof KNNPartitionType, value);
    });
  }, [partitionState]);

  const handleChange = (
    field: keyof KNNPartitionType,
    value: CheckedState | number | boolean | string | null,
  ) => {
    setPartitionState((prevState) => {
      const newState = {
        ...prevState,
        [field]: value,
      };

      //updateFormData(field, value);

      return newState;
    });
  };

  const handleDrop = (target: string, variable: string) => {
    setPartitionState((prev) => {
      const updatedState = { ...prev };

      if (target === "PartitioningVariable") {
        updatedState.PartitioningVariable = variable;
        //updateFormData("PartitioningVariable", variable);
      }

      if (target === "VFoldPartitioningVariable") {
        updatedState.VFoldPartitioningVariable = variable;
        // updateFormData("VFoldPartitioningVariable", variable);
      }

      return updatedState;
    });
  };

  const handleRemoveVariable = (target: string) => {
    setPartitionState((prev) => {
      const updatedState = { ...prev };

      if (target === "PartitioningVariable") {
        updatedState.PartitioningVariable = null;
        // updateFormData("PartitioningVariable", null);
      }

      if (target === "VFoldPartitioningVariable") {
        updatedState.VFoldPartitioningVariable = null;
        // updateFormData("VFoldPartitioningVariable", null);
      }

      return updatedState;
    });
  };

  const handlePartitionGrp = (value: string) => {
    setPartitionState((prev) => ({
      ...prev,
      UseRandomly: value === "UseRandomly",
      UseVariable: value === "UseVariable",
      PartitioningVariable:
        value === "UseVariable" ? prev.PartitioningVariable : null,
    }));
  };

  const handleFoldGrp = (value: string) => {
    const newState = {
      VFoldUseRandomly: value === "VFoldUseRandomly",
      VFoldUsePartitioningVar: value === "VFoldUsePartitioningVar",
    };

    setPartitionState((prev) => ({
      ...prev,
      ...newState,
    }));

    // updateFormData("VFoldUseRandomly", newState.VFoldUseRandomly);
    // updateFormData("VFoldUsePartitioningVar", newState.VFoldUsePartitioningVar);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-start gap-2 p-4">
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[650px] max-w-xl rounded-lg border md:min-w-[200px]"
          >
            <ResizablePanel defaultSize={40}>
              <ScrollArea>
                <div className="flex flex-col justify-start items-start h-[510px] gap-1 p-2 overflow-hidden">
                  {filteredAvailableVariables.map(
                    (variable: string, index: number) => (
                      <Badge
                        key={index}
                        className="w-full text-start text-sm font-light p-2 cursor-pointer"
                        variant="outline"
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData("text", variable)
                        }
                      >
                        {variable}
                      </Badge>
                    ),
                  )}
                </div>
              </ScrollArea>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={60}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={45}>
                  <RadioGroup
                    value={partitionMode}
                    onValueChange={handlePartitionGrp}
                  >
                    <div className="flex flex-col gap-2 p-2">
                      <Label className="font-bold">
                        Training and Holdout Partition
                      </Label>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="UseRandomly" id="UseRandomly" />
                        <Label htmlFor="UseRandomly">
                          Randomly assign cases to partition
                        </Label>
                      </div>
                      <div
                        className={`flex flex-row gap-1 pl-6 ${
                          !partitionState.UseRandomly
                            ? "opacity-50 pointer-events-none"
                            : ""
                        }`}
                      >
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="TrainingNumber">Training %:</Label>
                          <Input
                            id="TrainingNumber"
                            type="number"
                            className="min-w-2xl w-full"
                            placeholder=""
                            value={partitionState.TrainingNumber ?? 70}
                            disabled={!partitionState.UseRandomly}
                            onChange={(e) =>
                              handleChange(
                                "TrainingNumber",
                                Number(e.target.value),
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="TrainingNumber">Holdout %:</Label>
                          <Input
                            id="HoldoutNumber"
                            type="number"
                            className="min-w-2xl w-full"
                            placeholder=""
                            value={100 - (partitionState.TrainingNumber ?? 0)}
                            disabled={true}
                            onChange={() => {}}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="TotalNumber">Total %:</Label>
                          <Input
                            id="TotalNumber"
                            type="number"
                            className="min-w-2xl w-full"
                            placeholder=""
                            value={100}
                            disabled={true}
                            onChange={() => {}}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="UseVariable" id="UseVariable" />
                        <Label htmlFor="UseVariable">
                          Use variable to assign cases
                        </Label>
                      </div>
                      <div className="flex flex-row gap-1 pl-6">
                        <div className="flex flex-col gap-2 w-full">
                          <Label htmlFor="PartitioningVariable">
                            Partition Variable:
                          </Label>
                          <div className="flex w-full items-center space-x-2">
                            <div
                              className={`w-full min-h-[40px] p-2 border rounded ${
                                !partitionState.UseVariable
                                  ? "opacity-50 pointer-events-none"
                                  : ""
                              }`}
                              onDrop={(e) => {
                                handleDrop(
                                  "PartitioningVariable",
                                  e.dataTransfer.getData("text"),
                                );
                              }}
                              onDragOver={(e) => e.preventDefault()}
                            >
                              {partitionState.PartitioningVariable ? (
                                <Badge
                                  className="text-start text-sm font-light p-2 cursor-pointer"
                                  variant="outline"
                                  onClick={() =>
                                    handleRemoveVariable("PartitioningVariable")
                                  }
                                >
                                  {partitionState.PartitioningVariable}
                                </Badge>
                              ) : (
                                <span className="text-sm font-light text-gray-500">
                                  Drop variables here.
                                </span>
                              )}
                            </div>
                            <input
                              type="hidden"
                              value={partitionState.PartitioningVariable ?? ""}
                              name="PartitioningVariable"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={38}>
                  <RadioGroup
                    disabled={!isCrossValidationEnabled}
                    value={foldMode}
                    onValueChange={handleFoldGrp}
                  >
                    <div
                      className={`flex flex-col gap-2 p-2 ${
                        !isCrossValidationEnabled
                          ? "opacity-50 pointer-events-none"
                          : ""
                      }`}
                    >
                      <Label className="font-bold">
                        Cross Validation Folds
                      </Label>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="VFoldUseRandomly"
                          id="VFoldUseRandomly"
                        />
                        <Label htmlFor="VFoldUseRandomly">
                          Randomly assign cases to folds
                        </Label>
                      </div>
                      <div className="flex flex-row pl-6 gap-2">
                        <Label htmlFor="TrainingNumber">Number of Folds:</Label>
                        <Input
                          id="NumPartition"
                          type="text"
                          className="min-w-2xl w-full"
                          placeholder=""
                          value={partitionState.NumPartition ?? ""}
                          disabled={
                            !isCrossValidationEnabled ||
                            !partitionState.VFoldUseRandomly
                          }
                          onChange={(e) =>
                            handleChange("NumPartition", Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="VFoldUsePartitioningVar"
                          id="VFoldUsePartitioningVar"
                        />
                        <Label htmlFor="VFoldUsePartitioningVar">
                          Use variable to assign cases
                        </Label>
                      </div>
                      <div className="flex flex-col gap-2 pl-6 w-full">
                        <Label htmlFor="VFoldPartitioningVariable">
                          Fold Variable:
                        </Label>
                        <div className="flex w-full items-center space-x-2">
                          <div
                            className={`w-full min-h-[40px] p-2 border rounded ${
                              !isCrossValidationEnabled ||
                              !partitionState.VFoldUsePartitioningVar
                                ? "opacity-50 pointer-events-none"
                                : ""
                            }`}
                            onDrop={(e) => {
                              handleDrop(
                                "VFoldPartitioningVariable",
                                e.dataTransfer.getData("text"),
                              );
                            }}
                            onDragOver={(e) => e.preventDefault()}
                          >
                            {partitionState.VFoldPartitioningVariable ? (
                              <Badge
                                className="text-start text-sm font-light p-2 cursor-pointer"
                                variant="outline"
                                onClick={() =>
                                  handleRemoveVariable(
                                    "VFoldPartitioningVariable",
                                  )
                                }
                              >
                                {partitionState.VFoldPartitioningVariable}
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
                              partitionState.VFoldPartitioningVariable ?? ""
                            }
                            name="VFoldPartitioningVariable"
                          />
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={17}>
                  <div className="flex flex-col gap-2 p-2">
                    <Label className="font-bold">Random Number Seed</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="SetSeed"
                        checked={partitionState.SetSeed}
                        onCheckedChange={(checked) =>
                          handleChange("SetSeed", checked)
                        }
                      />
                      <label
                        htmlFor="SetSeed"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Set Seed for Mersenne Twister
                      </label>
                    </div>
                    <div className="flex flex-row items-center gap-2 pl-6 w-full">
                      <Label htmlFor="Seed">Seed:</Label>
                      <Input
                        id="Seed"
                        type="number"
                        className="min-w-2xl w-full"
                        placeholder=""
                        value={partitionState.Seed ?? ""}
                        disabled={!partitionState.SetSeed}
                        onChange={(e) =>
                          handleChange("Seed", Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
};
