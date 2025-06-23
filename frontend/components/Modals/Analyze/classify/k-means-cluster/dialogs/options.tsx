import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    KMeansClusterOptionsProps,
    KMeansClusterOptionsType,
} from "@/components/Modals/Analyze/classify/k-means-cluster/types/k-means-cluster";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const KMeansClusterOptions = ({
    isOptionsOpen,
    setIsOptionsOpen,
    updateFormData,
    data,
}: KMeansClusterOptionsProps) => {
    const [optionsState, setOptionsState] = useState<KMeansClusterOptionsType>({
        ...data,
    });
    const [isContinueDisabled, setIsContinueDisabled] = useState(false);

    useEffect(() => {
        if (isOptionsOpen) {
            setOptionsState({ ...data });
        }
    }, [isOptionsOpen, data]);

    const handleChange = (
        field: keyof KMeansClusterOptionsType,
        value: CheckedState | number | boolean | string | null
    ) => {
        setOptionsState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleMissGrp = (value: string) => {
        setOptionsState((prevState) => ({
            ...prevState,
            ExcludeListWise: value === "ExcludeListWise",
            ExcludePairWise: value === "ExcludePairWise",
        }));
    };

    const handleContinue = () => {
        Object.entries(optionsState).forEach(([key, value]) => {
            updateFormData(key as keyof KMeansClusterOptionsType, value);
        });
        setIsOptionsOpen(false);
    };

    if (!isOptionsOpen) return null;

    return (
        <div className="flex flex-col h-full">
            <div className="p-4">
                <ResizablePanelGroup
                    direction="vertical"
                    className="min-h-[175px] rounded-lg border md:min-w-[200px]"
                >
                    <ResizablePanel defaultSize={55}>
                        <div className="flex flex-col gap-1 p-2">
                            <Label className="font-bold">Statistics</Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="InitialCluster"
                                    checked={optionsState.InitialCluster}
                                    onCheckedChange={(checked: CheckedState) =>
                                        handleChange("InitialCluster", checked)
                                    }
                                />
                                <label
                                    htmlFor="InitialCluster"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Initial Cluster Centers
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="ANOVA"
                                    checked={optionsState.ANOVA}
                                    onCheckedChange={(checked: CheckedState) =>
                                        handleChange("ANOVA", checked)
                                    }
                                />
                                <label
                                    htmlFor="ANOVA"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    ANOVA
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="ClusterInfo"
                                    checked={optionsState.ClusterInfo}
                                    onCheckedChange={(checked: CheckedState) =>
                                        handleChange("ClusterInfo", checked)
                                    }
                                />
                                <label
                                    htmlFor="ClusterInfo"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Cluster Information
                                </label>
                            </div>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={45}>
                        <div className="flex flex-col h-full gap-2 p-2">
                            <Label className="font-bold">Missing Values</Label>
                            <RadioGroup
                                value={
                                    optionsState.ExcludeListWise
                                        ? "ExcludeListWise"
                                        : "ExcludePairWise"
                                }
                                onValueChange={handleMissGrp}
                            >
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="ExcludeListWise"
                                            id="ExcludeListWise"
                                        />
                                        <Label htmlFor="ExcludeListWise">
                                            Exclude Cases Listwise
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="ExcludePairWise"
                                            id="ExcludePairWise"
                                        />
                                        <Label htmlFor="ExcludePairWise">
                                            Exclude Cases Pairwise
                                        </Label>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
            <div className="flex justify-start gap-2 p-4 border-t">
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
                    onClick={() => setIsOptionsOpen(false)}
                >
                    Cancel
                </Button>
                <Button type="button" variant="secondary">
                    Help
                </Button>
            </div>
        </div>
    );
};
