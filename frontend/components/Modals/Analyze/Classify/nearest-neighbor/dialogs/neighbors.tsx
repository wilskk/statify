<<<<<<< HEAD
import React, {useEffect, useState} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";
import {
    KNNNeighborsProps,
    KNNNeighborsType,
} from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup,} from "@/components/ui/resizable";
import {Label} from "@/components/ui/label";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Input} from "@/components/ui/input";
import {CheckedState} from "@radix-ui/react-checkbox";
import {Checkbox} from "@/components/ui/checkbox";

export const KNNNeighbors = ({
    isNeighborsOpen,
    setIsNeighborsOpen,
    updateFormData,
    data,
}: KNNNeighborsProps) => {
    const [neighborsState, setNeighborsState] = useState<KNNNeighborsType>({
        ...data,
    });
    const [isContinueDisabled, setIsContinueDisabled] = useState(false);

    useEffect(() => {
        if (isNeighborsOpen) {
            setNeighborsState({ ...data });
        }
    }, [isNeighborsOpen, data]);

    const handleChange = (
        field: keyof KNNNeighborsType,
        value: CheckedState | number | boolean | string | null
    ) => {
        setNeighborsState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleSpecifyGrp = (value: string) => {
        setNeighborsState((prevState) => ({
            ...prevState,
            Specify: value === "Specify",
            AutoSelection: value === "AutoSelection",
        }));
    };

    const handleDistanceGrp = (value: string) => {
        setNeighborsState((prevState) => ({
            ...prevState,
            MetricEucli: value === "MetricEucli",
            MetricManhattan: value === "MetricManhattan",
        }));
    };

    const handlePredictionsGrp = (value: string) => {
        setNeighborsState((prevState) => ({
            ...prevState,
            PredictionsMean: value === "PredictionsMean",
            PredictionsMedian: value === "PredictionsMedian",
        }));
    };

    const handleContinue = () => {
        Object.entries(neighborsState).forEach(([key, value]) => {
            updateFormData(key as keyof KNNNeighborsType, value);
        });
        setIsNeighborsOpen(false);
    };

    return (
        <>
            {/* Neighbors Dialog */}
            <Dialog open={isNeighborsOpen} onOpenChange={setIsNeighborsOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            Nearest Neighbor Analysis: Neighbors
                        </DialogTitle>
                    </DialogHeader>
                    <Separator />
                    <ResizablePanelGroup
                        direction="vertical"
                        className="min-h-[400px] max-w-xl rounded-lg border md:min-w-[200px]"
                    >
                        <ResizablePanel defaultSize={53}>
                            <RadioGroup
                                value={
                                    neighborsState.Specify
                                        ? "Specify"
                                        : "AutoSelection"
                                }
                                onValueChange={handleSpecifyGrp}
                            >
                                <div className="flex flex-col gap-2 p-2">
                                    <Label className="font-bold">
                                        Number of Nearest Neighbors (k)
                                    </Label>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem
                                                value="Specify"
                                                id="Specify"
                                            />
                                            <Label htmlFor="Specify">
                                                Specify Fixed K
                                            </Label>
                                        </div>
                                        <div className="flex flex-col space-x-2 pl-4">
                                            <div className="flex items-center space-x-2 pl-2">
                                                <Label className="w-[75px]">
                                                    k:
                                                </Label>
                                                <div className="w-[75px]">
                                                    <Input
                                                        id="SpecifyK"
                                                        type="number"
                                                        placeholder=""
                                                        value={
                                                            neighborsState.SpecifyK ??
                                                            ""
                                                        }
                                                        disabled={
                                                            !neighborsState.Specify
                                                        }
                                                        onChange={(e) =>
                                                            handleChange(
                                                                "SpecifyK",
                                                                Number(
                                                                    e.target
                                                                        .value
                                                                )
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem
                                                value="AutoSelection"
                                                id="AutoSelection"
                                            />
                                            <Label htmlFor="AutoSelection">
                                                Automatically Select K
                                            </Label>
                                        </div>
                                        <div className="flex flex-col space-x-2 pl-4 gap-1">
                                            <div className="flex items-center space-x-2 pl-2">
                                                <Label className="w-[75px]">
                                                    Minimum:
                                                </Label>
                                                <div className="w-[75px]">
                                                    <Input
                                                        id="MinK"
                                                        type="number"
                                                        placeholder=""
                                                        value={
                                                            neighborsState.MinK ??
                                                            ""
                                                        }
                                                        disabled={
                                                            !neighborsState.AutoSelection
                                                        }
                                                        onChange={(e) =>
                                                            handleChange(
                                                                "MinK",
                                                                Number(
                                                                    e.target
                                                                        .value
                                                                )
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Label className="w-[75px]">
                                                    Maximum:
                                                </Label>
                                                <div className="w-[75px]">
                                                    <Input
                                                        id="MaxK"
                                                        type="number"
                                                        placeholder=""
                                                        value={
                                                            neighborsState.MaxK ??
                                                            ""
                                                        }
                                                        disabled={
                                                            !neighborsState.AutoSelection
                                                        }
                                                        onChange={(e) =>
                                                            handleChange(
                                                                "MaxK",
                                                                Number(
                                                                    e.target
                                                                        .value
                                                                )
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </RadioGroup>
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={27}>
                            <RadioGroup
                                value={
                                    neighborsState.MetricEucli
                                        ? "MetricEucli"
                                        : "MetricManhattan"
                                }
                                onValueChange={handleDistanceGrp}
                            >
                                <div className="flex flex-col gap-2 p-2">
                                    <Label className="font-bold">
                                        Distance Computation
                                    </Label>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="MetricEucli"
                                            id="MetricEucli"
                                        />
                                        <Label htmlFor="MetricEucli">
                                            Euclidean Metric
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="MetricManhattan"
                                            id="MetricManhattan"
                                        />
                                        <Label htmlFor="MetricManhattan">
                                            Manhattan Metric
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="Weight"
                                            checked={neighborsState.Weight}
                                            onCheckedChange={(checked) =>
                                                handleChange("Weight", checked)
                                            }
                                        />
                                        <label
                                            htmlFor="Weight"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Weight Features by importance when
                                            computing distances
                                        </label>
                                    </div>
                                </div>
                            </RadioGroup>
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={20}>
                            <RadioGroup
                                value={
                                    neighborsState.PredictionsMean
                                        ? "PredictionsMean"
                                        : "PredictionsMedian"
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
                    <DialogFooter className="sm:justify-start">
                        <Button
                            disabled={isContinueDisabled}
                            type="button"
                            onClick={handleContinue}
                        >
                            Continue
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsNeighborsOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="button" variant="secondary">
                            Help
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
=======
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type {
  KNNNeighborsProps,
  KNNNeighborsType,
} from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Checkbox } from "@/components/ui/checkbox";

export const KNNNeighbors = ({
  isNeighborsOpen,
  setIsNeighborsOpen,
  updateFormData,
  data,
}: KNNNeighborsProps) => {
  const [neighborsState, setNeighborsState] = useState<KNNNeighborsType>({
    ...data,
  });
  const [isContinueDisabled, setIsContinueDisabled] = useState(false);

  useEffect(() => {
    if (isNeighborsOpen) {
      setNeighborsState({ ...data });
    }
  }, [isNeighborsOpen, data]);

  const handleChange = (
    field: keyof KNNNeighborsType,
    value: CheckedState | number | boolean | string | null,
  ) => {
    setNeighborsState((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  const handleSpecifyGrp = (value: string) => {
    setNeighborsState((prevState) => ({
      ...prevState,
      Specify: value === "Specify",
      AutoSelection: value === "AutoSelection",
    }));
  };

  const handleDistanceGrp = (value: string) => {
    setNeighborsState((prevState) => ({
      ...prevState,
      MetricEucli: value === "MetricEucli",
      MetricCityBlock: value === "MetricCityBlock",
    }));
  };

  const handlePredictionsGrp = (value: string) => {
    setNeighborsState((prevState) => ({
      ...prevState,
      PredictionsMean: value === "PredictionsMean",
      PredictionsMedian: value === "PredictionsMedian",
    }));
  };

  const handleContinue = () => {
    Object.entries(neighborsState).forEach(([key, value]) => {
      updateFormData(key as keyof KNNNeighborsType, value);
    });
    setIsNeighborsOpen(false);
  };

  if (!isNeighborsOpen) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-start gap-2 p-4">
          <ResizablePanelGroup
            direction="vertical"
            className="min-h-[450px] max-w-md rounded-lg border md:min-w-[200px]"
          >
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
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Specify" id="Specify" />
                        <Label htmlFor="Specify">Specify Fixed K</Label>
                      </div>
                      <div className="flex flex-col space-x-2 pl-4">
                        <div className="flex items-center space-x-2 pl-2">
                          <Label className="w-[75px]">k:</Label>
                          <div className="w-[75px]">
                            <Input
                              id="SpecifyK"
                              type="number"
                              placeholder=""
                              value={neighborsState.SpecifyK ?? ""}
                              disabled={!neighborsState.Specify}
                              onChange={(e) =>
                                handleChange("SpecifyK", Number(e.target.value))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="AutoSelection"
                          id="AutoSelection"
                        />
                        <Label htmlFor="AutoSelection">
                          Automatically Select K
                        </Label>
                      </div>
                      <div className="flex flex-col space-x-2 pl-4 gap-1">
                        <div className="flex items-center space-x-2 pl-2">
                          <Label className="w-[75px]">Minimum:</Label>
                          <div className="w-[75px]">
                            <Input
                              id="MinK"
                              type="number"
                              placeholder=""
                              value={neighborsState.MinK ?? ""}
                              disabled={!neighborsState.AutoSelection}
                              onChange={(e) =>
                                handleChange("MinK", Number(e.target.value))
                              }
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label className="w-[75px]">Maximum:</Label>
                          <div className="w-[75px]">
                            <Input
                              id="MaxK"
                              type="number"
                              placeholder=""
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
                  </div>
                </RadioGroup>
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={30}>
              <RadioGroup
                value={
                  neighborsState.MetricEucli ? "MetricEucli" : "MetricCityBlock"
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
                      value="MetricCityBlock"
                      id="MetricCityBlock"
                    />
                    <Label htmlFor="MetricCityBlock">City Block Metric</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="Weight"
                      checked={neighborsState.Weight}
                      onCheckedChange={(checked) =>
                        handleChange("Weight", checked)
                      }
                    />
                    <label
                      htmlFor="Weight"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Weight Features by importance when computing distances
                    </label>
                  </div>
                </div>
              </RadioGroup>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={20}>
              <RadioGroup
                value={
                  neighborsState.PredictionsMean
                    ? "PredictionsMean"
                    : "PredictionsMedian"
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
      <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
        <div>
          {/* <TooltipProvider>
                                                            <Tooltip>
                                                              <TooltipTrigger asChild>
                                                                <Button
                                                                  variant="ghost"
                                                                  size="icon"
                                                                  onClick={startTour}
                                                                  className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                                                                >
                                                                  <HelpCircle className="h-4 w-4" />
                                                                </Button>
                                                              </TooltipTrigger>
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
            onClick={() => setIsNeighborsOpen(false)}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button
            id="knn-neighbors-continue-button"
            disabled={isContinueDisabled}
            type="button"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
};
