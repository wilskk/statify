import {useEffect, useMemo, useState} from "react";
import {FactorDialog} from "@/components/Modals/Analyze/dimension-reduction/factor/dialogs/dialog";
import {
    FactorContainerProps,
    FactorMainType,
    FactorType,
} from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor";
import {FactorDefault} from "@/components/Modals/Analyze/dimension-reduction/factor/constants/factor-default";
import {FactorValue} from "@/components/Modals/Analyze/dimension-reduction/factor/dialogs/value";
import {FactorScores} from "@/components/Modals/Analyze/dimension-reduction/factor/dialogs/scores";
import {FactorRotation} from "@/components/Modals/Analyze/dimension-reduction/factor/dialogs/rotation";
import {FactorExtraction} from "@/components/Modals/Analyze/dimension-reduction/factor/dialogs/extraction";
import {FactorDescriptives} from "@/components/Modals/Analyze/dimension-reduction/factor/dialogs/descriptives";
import {FactorOptions} from "@/components/Modals/Analyze/dimension-reduction/factor/dialogs/options";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import {useModal} from "@/hooks/useModal";
import {useVariableStore} from "@/stores/useVariableStore";
import {useDataStore} from "@/stores/useDataStore";
import {analyzeFactor} from "@/components/Modals/Analyze/dimension-reduction/factor/services/factor-analysis";
import {clearFormData, getFormData, saveFormData} from "@/hooks/useIndexedDB";

export const FactorContainer = ({ onClose }: FactorContainerProps) => {
    const variables = useVariableStore((state) => state.variables);
    const dataVariables = useDataStore((state) => state.data);
    const tempVariables = useMemo(
        () => variables.map((variable) => variable.name),
        [variables]
    );

    const [formData, setFormData] = useState<FactorType>({ ...FactorDefault });
    const [isMainOpen, setIsMainOpen] = useState(true);
    const [isValueOpen, setIsValueOpen] = useState(false);
    const [isDescriptivesOpen, setIsDescriptivesOpen] = useState(false);
    const [isExtractionOpen, setIsExtractionOpen] = useState(false);
    const [isRotationOpen, setIsRotationOpen] = useState(false);
    const [isScoresOpen, setIsScoresOpen] = useState(false);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);

    const { closeModal } = useModal();

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await getFormData("Factor");
                if (savedData) {
                    const { id, ...formDataWithoutId } = savedData;
                    setFormData(formDataWithoutId);
                } else {
                    setFormData({ ...FactorDefault });
                }
            } catch (error) {
                console.error("Failed to load form data:", error);
            }
        };

        loadFormData();
    }, []);

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

    const executeFactor = async (mainData: FactorMainType) => {
        try {
            const newFormData = {
                ...formData,
                main: mainData,
            };

            await saveFormData("Factor", newFormData);

            await analyzeFactor({
                configData: newFormData,
                dataVariables: dataVariables,
                variables: variables,
            });
        } catch (error) {
            console.error(error);
        }

        closeModal();
        onClose();
    };

    const resetFormData = async () => {
        try {
            await clearFormData("Factor");
            setFormData({ ...FactorDefault });
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
                <FactorDialog
                    isMainOpen={isMainOpen}
                    setIsMainOpen={setIsMainOpen}
                    setIsValueOpen={setIsValueOpen}
                    setIsDescriptivesOpen={setIsDescriptivesOpen}
                    setIsExtractionOpen={setIsExtractionOpen}
                    setIsRotationOpen={setIsRotationOpen}
                    setIsScoresOpen={setIsScoresOpen}
                    setIsOptionsOpen={setIsOptionsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("main", field, value)
                    }
                    data={formData.main}
                    globalVariables={tempVariables}
                    onContinue={(mainData) => executeFactor(mainData)}
                    onReset={resetFormData}
                />

                {/* Value */}
                <FactorValue
                    isValueOpen={isValueOpen}
                    setIsValueOpen={setIsValueOpen}
                    updateFormData={(field, value) =>
                        updateFormData("value", field, value)
                    }
                    data={formData.value}
                />

                {/* Descriptives */}
                <FactorDescriptives
                    isDescriptivesOpen={isDescriptivesOpen}
                    setIsDescriptivesOpen={setIsDescriptivesOpen}
                    updateFormData={(field, value) =>
                        updateFormData("descriptives", field, value)
                    }
                    data={formData.descriptives}
                />

                {/* Extraction */}
                <FactorExtraction
                    isExtractionOpen={isExtractionOpen}
                    setIsExtractionOpen={setIsExtractionOpen}
                    updateFormData={(field, value) =>
                        updateFormData("extraction", field, value)
                    }
                    data={formData.extraction}
                />

                {/* Rotation */}
                <FactorRotation
                    isRotationOpen={isRotationOpen}
                    setIsRotationOpen={setIsRotationOpen}
                    updateFormData={(field, value) =>
                        updateFormData("rotation", field, value)
                    }
                    data={formData.rotation}
                />

                {/* Scores */}
                <FactorScores
                    isScoresOpen={isScoresOpen}
                    setIsScoresOpen={setIsScoresOpen}
                    updateFormData={(field, value) =>
                        updateFormData("scores", field, value)
                    }
                    data={formData.scores}
                />

                {/* Options */}
                <FactorOptions
                    isOptionsOpen={isOptionsOpen}
                    setIsOptionsOpen={setIsOptionsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("options", field, value)
                    }
                    data={formData.options}
                />
            </DialogContent>
        </Dialog>
    );
};
