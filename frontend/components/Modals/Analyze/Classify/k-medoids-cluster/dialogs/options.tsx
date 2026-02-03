"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type {
    KMedoidsClusterOptionsProps,
    KMedoidsClusterOptionsType,
} from "@/components/Modals/Analyze/Classify/k-medoids-cluster/types/k-medoids-cluster";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const KMedoidsClusterOptions = ({
    updateFormData,
    data,
}: KMedoidsClusterOptionsProps) => {
    const [optionsState, setOptionsState] = useState<KMedoidsClusterOptionsType>({
        ...data,
    });

    useEffect(() => {
        setOptionsState({ ...data });
    }, [data]);

    const handleChange = (
        field: keyof KMedoidsClusterOptionsType,
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
            updateFormData(key as keyof KMedoidsClusterOptionsType, value);
        });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 flex-grow">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label className="font-bold">Statistics</Label>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="InitialCluster"
                                checked={optionsState.InitialCluster}
                                onCheckedChange={(checked) =>
                                    handleChange("InitialCluster", checked)
                                }
                            />
                            <label
                                htmlFor="InitialCluster"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Initial medoids
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="ClusterInfo"
                                checked={optionsState.ClusterInfo}
                                onCheckedChange={(checked) =>
                                    handleChange("ClusterInfo", checked)
                                }
                            />
                            <label
                                htmlFor="ClusterInfo"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Cluster information for each case
                            </label>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Note: K-Medoids uses evaluation metrics (Silhouette, etc.) 
                            instead of ANOVA. See Evaluation tab.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label className="font-bold">Plots</Label>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="ClusterPlot"
                                checked={optionsState.ClusterPlot}
                                disabled={true}
                                onCheckedChange={(checked) =>
                                    handleChange("ClusterPlot", checked)
                                }
                            />
                            <label
                                htmlFor="ClusterPlot"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Cluster plot (Disabled)
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label className="font-bold">Missing Values</Label>
                        <RadioGroup
                            value={
                                optionsState.ExcludeListWise
                                    ? "ExcludeListWise"
                                    : "ExcludePairWise"
                            }
                            onValueChange={handleMissGrp}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="ExcludeListWise"
                                    id="ExcludeListWise"
                                />
                                <Label htmlFor="ExcludeListWise">
                                    Exclude cases listwise
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="ExcludePairWise"
                                    id="ExcludePairWise"
                                />
                                <Label htmlFor="ExcludePairWise">
                                    Exclude cases pairwise
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            </div>
        </div>
    );
};
