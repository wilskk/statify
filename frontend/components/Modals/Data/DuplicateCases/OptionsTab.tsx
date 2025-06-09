import React, { FC } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { OptionsTabProps } from "./types";

const OptionsTab: FC<OptionsTabProps> = ({
    primaryCaseIndicator,
    setPrimaryCaseIndicator,
    primaryName,
    setPrimaryName,
    sequentialCount,
    setSequentialCount,
    sequentialName,
    setSequentialName,
    moveMatchingToTop,
    setMoveMatchingToTop,
    tourActive,
    currentStep,
    tourSteps = []
}) => {
    const indicatorStepIndex = tourSteps.findIndex(step => step.targetId === 'duplicate-cases-indicator-variables');
    const moveStepIndex = tourSteps.findIndex(step => step.targetId === 'duplicate-cases-move-duplicates');

    return (
        <>
            <div 
                id="duplicate-cases-indicator-variables"
                className="border border-border rounded-md p-6 mb-6 bg-card relative"
            >
                <ActiveElementHighlight active={!!(tourActive && currentStep === indicatorStepIndex)} />
                <div className="text-sm font-medium mb-4 text-card-foreground">Variables to Create</div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center">
                                <Checkbox
                                    id="primaryIndicator"
                                    checked={primaryCaseIndicator}
                                    onCheckedChange={(checked) => setPrimaryCaseIndicator(!!checked)}
                                    className="mr-2"
                                />
                                <Label htmlFor="primaryIndicator" className="text-sm font-medium cursor-pointer text-card-foreground">
                                    Indicator of primary cases
                                </Label>
                            </div>
                            <p className="text-xs mt-2 ml-6 text-muted-foreground">
                                Creates a variable that identifies primary cases (1) and duplicate cases (0).
                            </p>
                        </div>

                        <div className="flex items-center">
                            <Label htmlFor="primaryName" className="text-xs whitespace-nowrap mr-2 text-card-foreground">
                                Name:
                            </Label>
                            <Input
                                id="primaryName"
                                value={primaryName}
                                onChange={(e) => setPrimaryName(e.target.value)}
                                className="h-8 text-sm"
                                disabled={!primaryCaseIndicator}
                            />
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center">
                                <Checkbox
                                    id="sequentialCount"
                                    checked={sequentialCount}
                                    onCheckedChange={(checked) => setSequentialCount(!!checked)}
                                    className="mr-2"
                                />
                                <Label htmlFor="sequentialCount" className="text-sm font-medium cursor-pointer text-card-foreground">
                                    Sequential count of matching cases
                                </Label>
                            </div>
                            <p className="text-xs mt-2 ml-6 text-muted-foreground">
                                Creates a variable with a sequential count of cases within each matching group.
                            </p>
                        </div>

                        <div className="flex items-center">
                            <Label htmlFor="sequentialName" className="text-xs whitespace-nowrap mr-2 text-card-foreground">
                                Name:
                            </Label>
                            <Input
                                id="sequentialName"
                                value={sequentialName}
                                onChange={(e) => setSequentialName(e.target.value)}
                                className="h-8 text-sm"
                                disabled={!sequentialCount}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div 
                id="duplicate-cases-move-duplicates"
                className="border border-border rounded-md p-6 bg-card relative"
            >
                <ActiveElementHighlight active={!!(tourActive && currentStep === moveStepIndex)} />
                <div className="text-sm font-medium mb-4 text-card-foreground">File Management</div>
                <div className="space-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="moveToTop"
                            checked={moveMatchingToTop}
                            onCheckedChange={(checked) => setMoveMatchingToTop(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="moveToTop" className="text-sm cursor-pointer text-card-foreground">
                            Move matching cases to the top of the file
                        </Label>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OptionsTab;