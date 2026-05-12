import { useState } from "react";
import { DiscriminantDialog } from "@/components/Modals/Analyze/Classify/discriminant/dialogs/dialog-unused";
import { DiscriminantDefineRange } from "@/components/Modals/Analyze/Classify/discriminant/dialogs/define-range";
import { DiscriminantSetValue } from "@/components/Modals/Analyze/Classify/discriminant/dialogs/set-value";
import { DiscriminantStatistics } from "@/components/Modals/Analyze/Classify/discriminant/dialogs/statistics";
import { DiscriminantMethod } from "@/components/Modals/Analyze/Classify/discriminant/dialogs/method";
import { DiscriminantClassify } from "@/components/Modals/Analyze/Classify/discriminant/dialogs/classify";
import { DiscriminantSave } from "@/components/Modals/Analyze/Classify/discriminant/dialogs/save";
import { DiscriminantBootstrap } from "@/components/Modals/Analyze/Classify/discriminant/dialogs/bootstrap";
import type { DiscriminantContainerProps } from "@/components/Modals/Analyze/Classify/discriminant/types/discriminant";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useDiscriminantState } from "@/components/Modals/Analyze/Classify/discriminant/hooks/useDiscriminantState";

export const DiscriminantContainer = ({ onClose }: DiscriminantContainerProps) => {
    const variables = useVariableStore((state) => state.variables);
    const dataVariables = useDataStore((state) => state.data);

    const {
        formData,
        updateFormData,
        executeAnalysis,
        resetFormData,
        isLoading,
        error,
    } = useDiscriminantState(variables, dataVariables);

    // Main dialog open/close state
    const [isMainOpen, setIsMainOpen] = useState(true);

    // Sub-dialog open/close state
    const [isDefineRangeOpen, setIsDefineRangeOpen] = useState(false);
    const [isSetValueOpen, setIsSetValueOpen] = useState(false);
    const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
    const [isMethodOpen, setIsMethodOpen] = useState(false);
    const [isClassifyOpen, setIsClassifyOpen] = useState(false);
    const [isSaveOpen, setIsSaveOpen] = useState(false);
    const [isBootstrapOpen, setIsBootstrapOpen] = useState(false);

    const handleContinue = async () => {
        setIsMainOpen(false);
        await executeAnalysis(formData.main);
        onClose();
    };

    return (
        <>
            <DiscriminantDialog
                isMainOpen={isMainOpen}
                setIsMainOpen={setIsMainOpen}
                setIsDefineRangeOpen={setIsDefineRangeOpen}
                setIsSetValueOpen={setIsSetValueOpen}
                setIsStatisticsOpen={setIsStatisticsOpen}
                setIsMethodOpen={setIsMethodOpen}
                setIsClassifyOpen={setIsClassifyOpen}
                setIsSaveOpen={setIsSaveOpen}
                setIsBootstrapOpen={setIsBootstrapOpen}
                updateFormData={(field, value) =>
                    updateFormData("main", field, value)
                }
                data={formData.main}
                globalVariables={variables.map((v) => v.name)}
                onContinue={handleContinue}
                onReset={resetFormData}
                onClose={onClose}
                isLoading={isLoading}
                error={error}
            />

            <DiscriminantDefineRange
                isDefineRangeOpen={isDefineRangeOpen}
                setIsDefineRangeOpen={setIsDefineRangeOpen}
                updateFormData={(field, value) =>
                    updateFormData("defineRange", field, value)
                }
                data={formData.defineRange}
            />

            <DiscriminantSetValue
                isSetValueOpen={isSetValueOpen}
                setIsSetValueOpen={setIsSetValueOpen}
                updateFormData={(field, value) =>
                    updateFormData("setValue", field, value)
                }
                data={formData.setValue}
            />

            <DiscriminantStatistics
                isStatisticsOpen={isStatisticsOpen}
                setIsStatisticsOpen={setIsStatisticsOpen}
                updateFormData={(field, value) =>
                    updateFormData("statistics", field, value)
                }
                data={formData.statistics}
            />

            <DiscriminantMethod
                isMethodOpen={isMethodOpen}
                setIsMethodOpen={setIsMethodOpen}
                updateFormData={(field, value) =>
                    updateFormData("method", field, value)
                }
                data={formData.method}
            />

            <DiscriminantClassify
                isClassifyOpen={isClassifyOpen}
                setIsClassifyOpen={setIsClassifyOpen}
                updateFormData={(field, value) =>
                    updateFormData("classify", field, value)
                }
                data={formData.classify}
            />

            <DiscriminantSave
                isSaveOpen={isSaveOpen}
                setIsSaveOpen={setIsSaveOpen}
                updateFormData={(field, value) =>
                    updateFormData("save", field, value)
                }
                data={formData.save}
            />

            <DiscriminantBootstrap
                isBootstrapOpen={isBootstrapOpen}
                setIsBootstrapOpen={setIsBootstrapOpen}
                updateFormData={(field, value) =>
                    updateFormData("bootstrap", field, value)
                }
                data={formData.bootstrap}
            />
        </>
    );
};