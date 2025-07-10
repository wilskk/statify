import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    KMeansClusterIterateProps,
    KMeansClusterIterateType,
} from "@/components/Modals/Analyze/Classify/k-means-cluster/types/k-means-cluster";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckedState } from "@radix-ui/react-checkbox";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

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
        if (
            iterateState.MaximumIterations == null ||
            iterateState.MaximumIterations < 1 ||
            iterateState.MaximumIterations > 999
        ) {
            toast.warning("Maximum iterations must be between 1 and 1000.");
            return;
        }
        if (
            iterateState.ConvergenceCriterion == null ||
            iterateState.ConvergenceCriterion < 0 ||
            iterateState.ConvergenceCriterion > 1
        ) {
            toast.warning(
                "Convergence criterion must be greater or equal than 0 and less than or equal to 1."
            );
            return;
        }
        Object.entries(iterateState).forEach(([key, value]) => {
            updateFormData(key as keyof KMeansClusterIterateType, value);
        });
        setIsIterateOpen(false);
    };

    if (!isIterateOpen) return null;

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col items-start gap-2 p-4 flex-grow">
                <div className="flex flex-row items-center gap-2">
                    <Label className="w-[290px]">Maximum Iteration: </Label>
                    <Input
                        id="MaximumIterations"
                        type="number"
                        value={iterateState.MaximumIterations ?? 0}
                        min={1}
                        max={999}
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
                        value={iterateState.ConvergenceCriterion ?? 0}
                        min={0}
                        max={1}
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
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div>
                    <Button type="button" variant="ghost">
                        Help
                    </Button>
                </div>
                <div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsIterateOpen(false)}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button
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
