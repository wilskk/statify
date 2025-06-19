import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    KMeansClusterIterateProps,
    KMeansClusterIterateType,
} from "@/models/classify/k-means-cluster/k-means-cluster";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckedState } from "@radix-ui/react-checkbox";
import { Checkbox } from "@/components/ui/checkbox";

export const KMeansClusterIterate = ({
    isIterateOpen,
    setIsIterateOpen,
    updateFormData,
    data,
}: KMeansClusterIterateProps) => {
    const [iterateState, setIterateState] = useState<KMeansClusterIterateType>({
        ...data,
    });
    const [isContinueDisabled, setIsContinueDisabled] = useState(false);

    useEffect(() => {
        if (isIterateOpen) {
            setIterateState({ ...data });
        }
    }, [isIterateOpen, data]);

    const handleChange = (
        field: keyof KMeansClusterIterateType,
        value: CheckedState | number | boolean | string | null
    ) => {
        setIterateState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleContinue = () => {
        Object.entries(iterateState).forEach(([key, value]) => {
            updateFormData(key as keyof KMeansClusterIterateType, value);
        });
        setIsIterateOpen(false);
    };

    if (!isIterateOpen) return null;

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col items-start gap-2 p-4">
                <div className="flex flex-row items-center gap-2">
                    <Label className="w-[300px]">Maximum Iteration: </Label>
                    <Input
                        id="MaximumIterations"
                        type="number"
                        value={iterateState.MaximumIterations ?? ""}
                        onChange={(e) =>
                            handleChange(
                                "MaximumIterations",
                                Number(e.target.value)
                            )
                        }
                        placeholder=""
                    />
                </div>
                <div className="flex flex-row items-center gap-2">
                    <Label className="w-[300px]">Convergence Criterion: </Label>
                    <Input
                        id="ConvergenceCriterion"
                        type="number"
                        value={iterateState.ConvergenceCriterion ?? ""}
                        onChange={(e) =>
                            handleChange(
                                "ConvergenceCriterion",
                                Number(e.target.value)
                            )
                        }
                        placeholder=""
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="UseRunningMeans"
                        checked={iterateState.UseRunningMeans}
                        onCheckedChange={(checked) =>
                            handleChange("UseRunningMeans", checked)
                        }
                    />
                    <label
                        htmlFor="UseRunningMeans"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Use Running Means
                    </label>
                </div>
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
                    onClick={() => setIsIterateOpen(false)}
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
