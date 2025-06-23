import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    KMeansClusterSaveProps,
    KMeansClusterSaveType,
} from "@/components/Modals/Analyze/Classify/k-means-cluster/types/k-means-cluster";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";

export const KMeansClusterSave = ({
    isSaveOpen,
    setIsSaveOpen,
    updateFormData,
    data,
}: KMeansClusterSaveProps) => {
    const [saveState, setSaveState] = useState<KMeansClusterSaveType>({
        ...data,
    });
    const [isContinueDisabled, setIsContinueDisabled] = useState(false);

    useEffect(() => {
        if (isSaveOpen) {
            setSaveState({ ...data });
        }
    }, [isSaveOpen, data]);

    const handleChange = (
        field: keyof KMeansClusterSaveType,
        value: CheckedState | number | boolean | string | null
    ) => {
        setSaveState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleContinue = () => {
        Object.entries(saveState).forEach(([key, value]) => {
            updateFormData(key as keyof KMeansClusterSaveType, value);
        });
        setIsSaveOpen(false);
    };

    if (!isSaveOpen) return null;

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col items-start gap-2 p-4">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="ClusterMembership"
                        checked={saveState.ClusterMembership}
                        onCheckedChange={(checked) =>
                            handleChange("ClusterMembership", checked)
                        }
                    />
                    <label
                        htmlFor="ClusterMembership"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Cluster Membership
                    </label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="DistanceClusterCenter"
                        checked={saveState.DistanceClusterCenter}
                        onCheckedChange={(checked) =>
                            handleChange("DistanceClusterCenter", checked)
                        }
                    />
                    <label
                        htmlFor="DistanceClusterCenter"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Distance from Cluster Center
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
                    onClick={() => setIsSaveOpen(false)}
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
