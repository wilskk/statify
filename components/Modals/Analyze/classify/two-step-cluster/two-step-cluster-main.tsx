import { useState, useEffect } from "react";
import {
    TwoStepClusterContainerProps,
    TwoStepClusterMainType,
    TwoStepClusterType,
} from "@/models/classify/two-step-cluster/two-step-cluster";
import { TwoStepClusterDefault } from "@/constants/classify/two-step-cluster/two-step-cluster-default";
import { TwoStepClusterDialog } from "@/components/Modals/Analyze/classify/two-step-cluster/dialog";
import { TwoStepClusterOptions } from "@/components/Modals/Analyze/classify/two-step-cluster/options";
import { TwoStepClusterOutput } from "@/components/Modals/Analyze/classify/two-step-cluster/output";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useModal } from "@/hooks/useModal";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { analyzeTwoStepCluster } from "@/services/analyze/classify/two-step-cluster/two-step-cluster-analysis";
import { saveFormData, getFormData, clearFormData } from "@/hooks/useIndexedDB";

export const TwoStepClusterContainer = ({
    onClose,
}: TwoStepClusterContainerProps) => {
    const variables = useVariableStore((state) => state.variables);
    const dataVariables = useDataStore((state) => state.data);
    const tempVariables = variables.map((variables) => variables.name);

    const [formData, setFormData] = useState<TwoStepClusterType>({
        ...TwoStepClusterDefault,
    });
    const [isMainOpen, setIsMainOpen] = useState(true);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [isOutputOpen, setIsOutputOpen] = useState(false);

    const { closeModal } = useModal();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await getFormData("TwoStepCluster");
                if (savedData) {
                    const { id, ...formDataWithoutId } = savedData;
                    setFormData(formDataWithoutId);
                } else {
                    setFormData({ ...TwoStepClusterDefault });
                }
            } catch (error) {
                console.error("Failed to load form data:", error);
            }
        };

        loadFormData();
    }, []);

    useEffect(() => {
        if (formData.main) {
            const usedVariables = [
                ...(formData.main.CategoricalVar || []),
                ...(formData.main.ContinousVar || []),
            ].filter(Boolean);

            const updatedVariables = tempVariables.filter(
                (variable) => !usedVariables.includes(variable)
            );
            setFormData((prev) => ({
                ...prev,
                options: {
                    ...prev.options,
                    SrcVar: formData.main.ContinousVar
                        ? [...formData.main.ContinousVar]
                        : [],
                },
                output: {
                    ...prev.output,
                    SrcVar: updatedVariables ? [...updatedVariables] : [],
                },
            }));
        }
    }, [formData.main]);

    const updateFormData = <T extends keyof typeof formData>(
        section: T,
        field: keyof (typeof formData)[T],
        value: unknown
    ) => {
        setFormData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            },
        }));
    };

    const executeTwoStepCluster = async (mainData: TwoStepClusterMainType) => {
        try {
            const newFormData = {
                ...formData,
                main: mainData,
            };

            await saveFormData("TwoStepCluster", newFormData);

            await analyzeTwoStepCluster({
                configData: newFormData,
                dataVariables: dataVariables,
                variables: variables,
                addLog,
                addAnalytic,
                addStatistic,
            });
        } catch (error) {
            console.error(error);
        }

        closeModal();
        onClose();
    };

    const resetFormData = async () => {
        try {
            await clearFormData("TwoStepCluster");
            setFormData({ ...TwoStepClusterDefault });
        } catch (error) {
            console.error("Failed to clear form data:", error);
        }
    };

    const handleClose = () => {
        closeModal();
        onClose();
    };

    return (
        <Dialog open={isMainOpen} onOpenChange={handleClose}>
            <DialogTitle></DialogTitle>
            <DialogContent>
                <TwoStepClusterDialog
                    isMainOpen={isMainOpen}
                    setIsMainOpen={setIsMainOpen}
                    setIsOptionsOpen={setIsOptionsOpen}
                    setIsOutputOpen={setIsOutputOpen}
                    updateFormData={(field, value) =>
                        updateFormData("main", field, value)
                    }
                    data={formData.main}
                    globalVariables={tempVariables}
                    onContinue={(mainData) => executeTwoStepCluster(mainData)}
                    onReset={resetFormData}
                />

                {/* Options */}
                <TwoStepClusterOptions
                    isOptionsOpen={isOptionsOpen}
                    setIsOptionsOpen={setIsOptionsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("options", field, value)
                    }
                    data={formData.options}
                />

                {/* Output */}
                <TwoStepClusterOutput
                    isOutputOpen={isOutputOpen}
                    setIsOutputOpen={setIsOutputOpen}
                    updateFormData={(field, value) =>
                        updateFormData("output", field, value)
                    }
                    data={formData.output}
                />
            </DialogContent>
        </Dialog>
    );
};
