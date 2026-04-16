import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type {
  KNNFeaturesProps,
  KNNFeaturesType,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PopoverArrow } from "@radix-ui/react-popover";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export const KNNFeatures = ({
  updateFormData,
  data,
}: KNNFeaturesProps) => {
 
  const [availableVariables, setAvailableVariables] = useState<string[]>([]);

  useEffect(() => {
  const usedVariables = [...(data.ForcedEntryVar || [])].filter(Boolean);

  if (data.ForwardSelection !== null) {
    const updatedVariables = data.ForwardSelection.filter(
      (variable) => !usedVariables.includes(variable)
    );
    setAvailableVariables(updatedVariables);
  }
}, [data]);

const handleChange = (
  field: keyof KNNFeaturesType,
  value: CheckedState | number | boolean | string | null
) => {
  updateFormData(field, value);
};

  const handleDrop = (target: string, variable: string) => {
    updateFormData("ForcedEntryVar", [
  ...(data.ForcedEntryVar || []),
  variable,
]);

  };

const handleRemoveVariable = (target: string, variable?: string) => {
  if (target === "ForcedEntryVar") {
    const updated = (data.ForcedEntryVar || []).filter(
      (item) => item !== variable
    );

    updateFormData("ForcedEntryVar", updated);
  }
};

const handleCriterionGrp = (value: string) => {
  updateFormData("MaxReached", value === "MaxReached");
  updateFormData("BelowMin", value === "BelowMin");
};

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-start gap-2 p-4">
          <ResizablePanelGroup
            direction="vertical"
            className="min-h-[500px] max-w-2xl rounded-lg border md:min-w-[200px]"
          >
            <ResizablePanel defaultSize={60}>
              <div className="flex flex-col gap-2 p-2 w-full">
                <div className="flex flex-row items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="PerformSelection"
                      checked={data.PerformSelection}
                      onCheckedChange={(checked) =>
                        handleChange("PerformSelection", checked)
                      }
                    />
                    <label
                      htmlFor="PerformSelection"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Perform Feature Selection
                    </label>
                  </div>
                  <div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost">
                          <Info />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <PopoverArrow />
                        <div className="p-2">
                          <p className="text-sm">
                            Forward selection is used to evaluate features for
                            inclusions. To force a feature to be included in the
                            model, enter the feature name in the Forced Entry
                            box.
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <ResizablePanelGroup direction="horizontal">
                  <ResizablePanel defaultSize={50}>
                    <div className="flex flex-col h-full gap-2">
                      <Label className="font-bold">Forward Selection:</Label>
                      <div className="w-full h-[150px] p-2 border rounded overflow-hidden">
                        <ScrollArea>
                          <div className="flex flex-col h-[130px] gap-1 justify-start items-start">
                            {availableVariables.map(
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
                      </div>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={50}>
                    <div
                      className="flex flex-col w-full gap-2"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const variable = e.dataTransfer.getData("text");
                        handleDrop("ForcedEntryVar", variable);
                      }}
                    >
                      <Label className="font-bold">Forced Entry:</Label>
                      <div className="w-full h-[150px] p-2 border rounded overflow-hidden">
                        <ScrollArea>
                          <div className="w-full h-[130px]">
                            {data.ForcedEntryVar &&
                            data.ForcedEntryVar.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {data.ForcedEntryVar.map(
                                  (variable, index) => (
                                    <Badge
                                      key={index}
                                      className="text-start text-sm font-light p-2 cursor-pointer"
                                      variant="outline"
                                      onClick={() =>
                                        handleRemoveVariable(
                                          "ForcedEntryVar",
                                          variable,
                                        )
                                      }
                                    >
                                      {variable}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            ) : (
                              <span className="text-sm font-light text-gray-500">
                                Drop variables here.
                              </span>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                      <input
                        type="hidden"
                        value={data.ForcedEntryVar ?? ""}
                        name="Independents"
                      />
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40}>
              <RadioGroup
                value={data.MaxReached ? "MaxReached" : "BelowMin"}
                disabled={!data.PerformSelection}
                onValueChange={handleCriterionGrp}
              >
                <div className="flex flex-col gap-2 p-2">
                  <Label className="font-bold">Stopping Criterion</Label>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="MaxReached" id="MaxReached" />
                      <Label htmlFor="MaxReached">
                        Stop when the specified number of features is reached
                      </Label>
                    </div>
                    <div className="flex flex-col space-x-2 pl-4">
                      <div className="flex items-center space-x-2 pl-2">
                        <Label className="w-[150px]">Number to Select:</Label>
                        <div className="w-[75px]">
                          <Input
                            id="MaxToSelect"
                            type="number"
                            placeholder=""
                            value={data.MaxToSelect ?? ""}
                            disabled={!data.MaxReached}
                            onChange={(e) =>
                              handleChange(
                                "MaxToSelect",
                                Number(e.target.value),
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="BelowMin" id="BelowMin" />
                      <Label htmlFor="BelowMin">
                        Stop when the change in the absolute error ratio is less
                        than or equal to minimum
                      </Label>
                    </div>
                    <div className="flex flex-col space-x-2 pl-4 gap-1">
                      <div className="flex items-center space-x-2 pl-2">
                        <Label className="w-[150px]">Minimum Change:</Label>
                        <div className="w-[75px]">
                          <Input
                            id="MinChange"
                            type="number"
                            placeholder=""
                            value={data.MinChange ?? ""}
                            disabled={!data.BelowMin}
                            onChange={(e) =>
                              handleChange("MinChange", Number(e.target.value))
                            }
                          />
                        </div>
                      </div>
                    </div>
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
