import React, { useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";

import type {
  KNNNeighborsProps,
  KNNNeighborsType,
} from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor";

export const KNNNeighbors = ({
  updateFormData,
  data,
  hasTarget,
  targetType,
}: KNNNeighborsProps) => {
  const [neighborsState, setNeighborsState] = useState<KNNNeighborsType>({
    ...data,
  });

  useEffect(() => {
    setNeighborsState({ ...data });
  }, [data]);

  useEffect(() => {
    if (!neighborsState.AutoSelection) {
      if (neighborsState.MinK !== null) updateFormData("MinK", null);
      if (neighborsState.MaxK !== null) updateFormData("MaxK", null);
    }
  }, [
    neighborsState.AutoSelection,
    neighborsState.MinK,
    neighborsState.MaxK,
    updateFormData,
  ]);

  useEffect(() => {
    if (!hasTarget) {
      handleChange("AutoSelection", false);
      handleChange("Specify", true);
      handleChange("Weight", false);
    }
  }, [hasTarget]);

  useEffect(() => {
    if (targetType !== "scale") {
      handleChange("PredictionsMean", false);
      handleChange("PredictionsMedian", false);
    } else if (!neighborsState.PredictionsMean && !neighborsState.PredictionsMedian) {
      handleChange("PredictionsMean", true);
    }
  }, [targetType, neighborsState.PredictionsMean, neighborsState.PredictionsMedian]);

  const handleChange = (
    field: keyof KNNNeighborsType,
    value: CheckedState | number | boolean | string | null,
  ) => {
    setNeighborsState((prev) => ({
      ...prev,
      [field]: value,
    }));

    updateFormData(field, value as any);
  };

  const handleSpecifyGrp = (value: string) => {
    const isAutoSelection = value === "AutoSelection";
    const newState = {
      Specify: value === "Specify",
      AutoSelection: isAutoSelection,
      MinK: isAutoSelection ? (neighborsState.MinK ?? 3) : null,
      MaxK: isAutoSelection ? (neighborsState.MaxK ?? 5) : null,
    };

    setNeighborsState((prev) => ({
      ...prev,
      ...newState,
    }));

    updateFormData("Specify", newState.Specify);
    updateFormData("AutoSelection", newState.AutoSelection);
    updateFormData("MinK", newState.MinK);
    updateFormData("MaxK", newState.MaxK);
  };

  const handleDistanceGrp = (value: string) => {
    const newState = {
      MetricEucli: value === "MetricEucli",
      MetricManhattan: value === "MetricManhattan",
    };

    setNeighborsState((prev) => ({
      ...prev,
      ...newState,
    }));

    updateFormData("MetricEucli", newState.MetricEucli);
    updateFormData("MetricManhattan", newState.MetricManhattan);
  };

  const handlePredictionsGrp = (value: string) => {
    const newState = {
      PredictionsMean: value === "PredictionsMean",
      PredictionsMedian: value === "PredictionsMedian",
    };

    setNeighborsState((prev) => ({
      ...prev,
      ...newState,
    }));

    updateFormData("PredictionsMean", newState.PredictionsMean);
    updateFormData("PredictionsMedian", newState.PredictionsMedian);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col items-start gap-2 p-4">
          <ResizablePanelGroup
            direction="vertical"
            className="h-full min-h-[450px] max-w-md rounded-lg border md:min-w-[200px]"
          >
            {/* K Selection */}
            <ResizablePanel defaultSize={50}>
              <div className="flex flex-col gap-2 w-full p-2">
                <RadioGroup
                  value={neighborsState.Specify ? "Specify" : "AutoSelection"}
                  onValueChange={handleSpecifyGrp}
                >
                  <div className="flex flex-col gap-2 p-2">
                    <Label className="font-bold">
                      Number of Nearest Neighbors (k)
                    </Label>

                    {/* Fixed K */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Specify" id="Specify" />
                        <Label htmlFor="Specify">Specify Fixed K</Label>
                      </div>

                      <div className="flex items-center space-x-2 pl-6">
                        <Label className="w-[75px]">k:</Label>
                        <Input
                          type="number"
                          className="w-[80px]"
                          value={neighborsState.SpecifyK ?? ""}
                          disabled={!neighborsState.Specify}
                          onChange={(e) =>
                            handleChange("SpecifyK", Number(e.target.value))
                          }
                        />
                      </div>
                    </div>

                    {/* Auto K */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="AutoSelection"
                          id="AutoSelection"
                          disabled={!hasTarget}
                        />
                        <Label htmlFor="AutoSelection">
                          Automatically Select K
                        </Label>
                      </div>

                      <div className="flex flex-col gap-2 pl-6">
                        <div className="flex items-center space-x-2">
                          <Label className="w-[75px]">Minimum:</Label>
                          <Input
                            type="number"
                            className="w-[80px]"
                            value={neighborsState.MinK ?? ""}
                            disabled={
                              !neighborsState.AutoSelection || !hasTarget
                            }
                            onChange={(e) =>
                              handleChange("MinK", Number(e.target.value))
                            }
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Label className="w-[75px]">Maximum:</Label>
                          <Input
                            type="number"
                            className="w-[80px]"
                            value={neighborsState.MaxK ?? ""}
                            disabled={!neighborsState.AutoSelection}
                            onChange={(e) =>
                              handleChange("MaxK", Number(e.target.value))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Distance */}
            <ResizablePanel defaultSize={30}>
              <RadioGroup
                value={
                  neighborsState.MetricEucli ? "MetricEucli" : "MetricManhattan"
                }
                onValueChange={handleDistanceGrp}
              >
                <div className="flex flex-col gap-2 p-2">
                  <Label className="font-bold">Distance Computation</Label>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MetricEucli" id="MetricEucli" />
                    <Label htmlFor="MetricEucli">Euclidean Metric</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="MetricManhattan"
                      id="MetricManhattan"
                    />
                    <Label htmlFor="MetricManhattan">
                      Manhattan (City Block) Metric
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={neighborsState.Weight}
                      disabled={!hasTarget}
                      onCheckedChange={(checked) =>
                        handleChange("Weight", checked)
                      }
                    />
                    <Label>
                      Weight neighbors by inverse distance
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </ResizablePanel>

            <ResizableHandle />

            {/* Prediction */}
            <ResizablePanel defaultSize={20}>
              <RadioGroup
                disabled={targetType !== "scale"}
                value={
                  neighborsState.PredictionsMedian
                    ? "PredictionsMedian"
                    : "PredictionsMean"
                }
                onValueChange={handlePredictionsGrp}
              >
                <div className="flex flex-col gap-2 p-2">
                  <Label className="font-bold">
                    Predictions for Scale Target
                  </Label>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="PredictionsMean"
                      id="PredictionsMean"
                    />
                    <Label htmlFor="PredictionsMean">
                      Mean of nearest neighbors values
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="PredictionsMedian"
                      id="PredictionsMedian"
                    />
                    <Label htmlFor="PredictionsMedian">
                      Median of nearest neighbors values
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
};
