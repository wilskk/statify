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
  KNNOptionsProps,
  KNNOptionsType,
} from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const KNNOptions = ({
  isOptionsOpen,
  setIsOptionsOpen,
  updateFormData,
  data,
}: KNNOptionsProps) => {
  const [optionsState, setOptionsState] = useState<KNNOptionsType>({
    ...data,
  });
  const [isContinueDisabled, setIsContinueDisabled] = useState(false);

  useEffect(() => {
    if (isOptionsOpen) {
      setOptionsState({ ...data });
    }
  }, [isOptionsOpen, data]);

  const handleTreatGrp = (value: string) => {
    setOptionsState((prevState) => ({
      ...prevState,
      Exclude: value === "Exclude",
      Include: value === "Include",
    }));
  };

  const handleContinue = () => {
    Object.entries(optionsState).forEach(([key, value]) => {
      updateFormData(key as keyof KNNOptionsType, value);
    });
    setIsOptionsOpen(false);
  };

  if (!isOptionsOpen) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-start gap-2 p-4">
          <ResizablePanelGroup
            direction="vertical"
            className="min-h-[150px] max-w-sm rounded-lg border md:min-w-[150px]"
          >
            <ResizablePanel defaultSize={100}>
              <div className="flex flex-col gap-2 p-2">
                <Label className="font-bold">User-Missing Values</Label>
                <div className="flex flex-col gap-2">
                  <RadioGroup
                    value={optionsState.Exclude ? "Exclude" : "Include"}
                    onValueChange={handleTreatGrp}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Exclude" id="Exclude" />
                        <Label className="w-[175px]" htmlFor="Exclude">
                          Exclude
                        </Label>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Include" id="Include" />
                        <Label className="w-[175px]" htmlFor="Include">
                          Include
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
                <div className="text-sm text-justify">
                  User-missing values for scale variables are always excluded.
                </div>
              </div>
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
            onClick={() => setIsOptionsOpen(false)}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button
            id="knn-options-continue-button"
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
};
