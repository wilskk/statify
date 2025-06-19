import { useState, useEffect, useMemo } from "react";
import {
    UnivariateContainerProps,
    UnivariateMainType,
    UnivariateType,
} from "@/models/general-linear-model/univariate/univariate";
import { UnivariateDefault } from "@/constants/general-linear-model/univariate/univariate-default";
import { UnivariateDialog } from "@/components/Modals/Analyze/general-linear-model/univariate/dialog";
import { UnivariateModel } from "@/components/Modals/Analyze/general-linear-model/univariate/model";
import { UnivariateContrast } from "@/components/Modals/Analyze/general-linear-model/univariate/contrast";
import { UnivariatePlots } from "@/components/Modals/Analyze/general-linear-model/univariate/plots";
import { UnivariatePostHoc } from "@/components/Modals/Analyze/general-linear-model/univariate/posthoc";
import { UnivariateEMMeans } from "@/components/Modals/Analyze/general-linear-model/univariate/emmeans";
import { UnivariateSave } from "@/components/Modals/Analyze/general-linear-model/univariate/save";
import { UnivariateOptions } from "@/components/Modals/Analyze/general-linear-model/univariate/options";
import { UnivariateBootstrap } from "@/components/Modals/Analyze/general-linear-model/univariate/bootstrap";
import { useModal } from "@/hooks/useModal";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { analyzeUnivariate } from "@/services/analyze/general-linear-model/univariate/univariate-analysis";
import { saveFormData, getFormData, clearFormData } from "@/hooks/useIndexedDB";

export const UnivariateContainer = ({ onClose }: UnivariateContainerProps) => {
    const variables = useVariableStore((state) => state.variables);
    const dataVariables = useDataStore((state) => state.data);
    const tempVariables = useMemo(
        () => variables.map((variable) => variable.name),
        [variables]
    );

    const [formData, setFormData] = useState<UnivariateType>({
        ...UnivariateDefault,
    });
    const [isMainOpen, setIsMainOpen] = useState(true);
    const [isModelOpen, setIsModelOpen] = useState(false);
    const [isContrastOpen, setIsContrastOpen] = useState(false);
    const [isPlotsOpen, setIsPlotsOpen] = useState(false);
    const [isPostHocOpen, setIsPostHocOpen] = useState(false);
    const [isEMMeansOpen, setIsEMMeansOpen] = useState(false);
    const [isSaveOpen, setIsSaveOpen] = useState(false);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [isBootstrapOpen, setIsBootstrapOpen] = useState(false);

    const { closeModal } = useModal();

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await getFormData("Univariate");
                if (savedData) {
                    const { id, ...formDataWithoutId } = savedData;
                    setFormData(formDataWithoutId);
                } else {
                    setFormData({ ...UnivariateDefault });
                }
            } catch (error) {
                console.error("Failed to load form data:", error);
            }
        };

        loadFormData();
    }, []);

    useEffect(() => {
        setFormData((prev) => {
            const newState = { ...prev };

            if (prev.main.FixFactor) {
                newState.posthoc = {
                    ...prev.posthoc,
                    SrcList: [...prev.main.FixFactor],
                };
            }

            const depVars = prev.main.DepVar ? [prev.main.DepVar] : [];
            const factorVars = prev.main.FixFactor
                ? [...prev.main.FixFactor]
                : [];
            const randVars = prev.main.RandFactor
                ? [...prev.main.RandFactor]
                : [];
            const covarVars = prev.main.Covar ? [...prev.main.Covar] : [];
            const wlsVars = prev.main.WlsWeight ? [prev.main.WlsWeight] : [];

            newState.model = {
                ...prev.model,
                FactorsVar: [...factorVars, ...randVars, ...covarVars],
            };

            const newBaseFactors = [...factorVars, ...randVars];
            const oldContrastFactorList = prev.contrast.FactorList || [];

            const formattingMap = new Map(
                oldContrastFactorList.map((factor: string) => [
                    factor.split(" (")[0],
                    factor,
                ])
            );

            const newContrastFactorList = newBaseFactors.map(
                (baseName) => formattingMap.get(baseName) || baseName
            );

            newState.contrast = {
                ...prev.contrast,
                FactorList: newContrastFactorList,
            };

            newState.plots = {
                ...prev.plots,
                SrcList: [...factorVars, ...randVars],
            };

            newState.emmeans = {
                ...prev.emmeans,
                SrcList: [...factorVars, ...randVars],
            };

            const usedVariables = [
                ...depVars,
                ...factorVars,
                ...randVars,
                ...covarVars,
                ...wlsVars,
            ];

            const updatedVariables = tempVariables.filter(
                (variable) => !usedVariables.includes(variable)
            );

            newState.bootstrap = {
                ...prev.bootstrap,
                Variables: updatedVariables,
            };

            return newState;
        });
    }, [
        formData.main.DepVar,
        formData.main.FixFactor,
        formData.main.RandFactor,
        formData.main.Covar,
        formData.main.WlsWeight,
        formData.plots.FixFactorVars,
        tempVariables,
    ]);

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

    const executeUnivariate = async (mainData: UnivariateMainType) => {
        try {
            const newFormData = {
                ...formData,
                main: mainData,
            };

            await saveFormData("Univariate", newFormData);

            await analyzeUnivariate({
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
            await clearFormData("Univariate");
            setFormData({ ...UnivariateDefault });
        } catch (error) {
            console.error("Failed to clear form data:", error);
        }
    };

    const handleClose = () => {
        closeModal();
        onClose();
    };

    const openSection = (
        section:
            | "main"
            | "model"
            | "contrast"
            | "plots"
            | "posthoc"
            | "emmeans"
            | "save"
            | "options"
            | "bootstrap"
    ) => {
        // Close all sections first
        setIsMainOpen(false);
        setIsModelOpen(false);
        setIsContrastOpen(false);
        setIsPlotsOpen(false);
        setIsPostHocOpen(false);
        setIsEMMeansOpen(false);
        setIsSaveOpen(false);
        setIsOptionsOpen(false);
        setIsBootstrapOpen(false);

        // Open the requested section
        switch (section) {
            case "main":
                setIsMainOpen(true);
                break;
            case "model":
                setIsModelOpen(true);
                break;
            case "contrast":
                setIsContrastOpen(true);
                break;
            case "plots":
                setIsPlotsOpen(true);
                break;
            case "posthoc":
                setIsPostHocOpen(true);
                break;
            case "emmeans":
                setIsEMMeansOpen(true);
                break;
            case "save":
                setIsSaveOpen(true);
                break;
            case "options":
                setIsOptionsOpen(true);
                break;
            case "bootstrap":
                setIsBootstrapOpen(true);
                break;
        }
    };

    const handleContinue = () => {
        openSection("main");
    };

    return (
        <div className="flex-grow overflow-y-auto flex flex-col h-full">
            {isMainOpen && (
                <UnivariateDialog
                    isMainOpen={isMainOpen}
                    setIsMainOpen={(value) =>
                        value ? openSection("main") : setIsMainOpen(false)
                    }
                    setIsModelOpen={(value) =>
                        value ? openSection("model") : setIsModelOpen(false)
                    }
                    setIsContrastOpen={(value) =>
                        value
                            ? openSection("contrast")
                            : setIsContrastOpen(false)
                    }
                    setIsPlotsOpen={(value) =>
                        value ? openSection("plots") : setIsPlotsOpen(false)
                    }
                    setIsPostHocOpen={(value) =>
                        value ? openSection("posthoc") : setIsPostHocOpen(false)
                    }
                    setIsEMMeansOpen={(value) =>
                        value ? openSection("emmeans") : setIsEMMeansOpen(false)
                    }
                    setIsSaveOpen={(value) =>
                        value ? openSection("save") : setIsSaveOpen(false)
                    }
                    setIsOptionsOpen={(value) =>
                        value ? openSection("options") : setIsOptionsOpen(false)
                    }
                    setIsBootstrapOpen={(value) =>
                        value
                            ? openSection("bootstrap")
                            : setIsBootstrapOpen(false)
                    }
                    updateFormData={(field, value) =>
                        updateFormData("main", field, value)
                    }
                    data={formData.main}
                    globalVariables={tempVariables}
                    onContinue={(mainData) => executeUnivariate(mainData)}
                    onReset={resetFormData}
                />
            )}

            {isModelOpen && (
                <UnivariateModel
                    isModelOpen={isModelOpen}
                    setIsModelOpen={(value) =>
                        value ? openSection("model") : handleContinue()
                    }
                    updateFormData={(field, value) =>
                        updateFormData("model", field, value)
                    }
                    data={formData.model}
                />
            )}

            {isContrastOpen && (
                <UnivariateContrast
                    isContrastOpen={isContrastOpen}
                    setIsContrastOpen={(value) =>
                        value ? openSection("contrast") : handleContinue()
                    }
                    updateFormData={(field, value) =>
                        updateFormData("contrast", field, value)
                    }
                    data={formData.contrast}
                />
            )}

            {isPlotsOpen && (
                <UnivariatePlots
                    isPlotsOpen={isPlotsOpen}
                    setIsPlotsOpen={(value) =>
                        value ? openSection("plots") : handleContinue()
                    }
                    updateFormData={(field, value) =>
                        updateFormData("plots", field, value)
                    }
                    data={formData.plots}
                />
            )}
            {isPostHocOpen && (
                <UnivariatePostHoc
                    isPostHocOpen={isPostHocOpen}
                    setIsPostHocOpen={(value) =>
                        value ? openSection("posthoc") : handleContinue()
                    }
                    updateFormData={(field, value) =>
                        updateFormData("posthoc", field, value)
                    }
                    data={formData.posthoc}
                />
            )}
            {isEMMeansOpen && (
                <UnivariateEMMeans
                    isEMMeansOpen={isEMMeansOpen}
                    setIsEMMeansOpen={(value) =>
                        value ? openSection("emmeans") : handleContinue()
                    }
                    updateFormData={(field, value) =>
                        updateFormData("emmeans", field, value)
                    }
                    data={formData.emmeans}
                />
            )}
            {isSaveOpen && (
                <UnivariateSave
                    isSaveOpen={isSaveOpen}
                    setIsSaveOpen={(value) =>
                        value ? openSection("save") : handleContinue()
                    }
                    updateFormData={(field, value) =>
                        updateFormData("save", field, value)
                    }
                    data={formData.save}
                />
            )}
            {isOptionsOpen && (
                <UnivariateOptions
                    isOptionsOpen={isOptionsOpen}
                    setIsOptionsOpen={(value) =>
                        value ? openSection("options") : handleContinue()
                    }
                    updateFormData={(field, value) =>
                        updateFormData("options", field, value)
                    }
                    data={formData.options}
                />
            )}
            {isBootstrapOpen && (
                <UnivariateBootstrap
                    isBootstrapOpen={isBootstrapOpen}
                    setIsBootstrapOpen={(value) =>
                        value ? openSection("bootstrap") : handleContinue()
                    }
                    updateFormData={(field, value) =>
                        updateFormData("bootstrap", field, value)
                    }
                    data={formData.bootstrap}
                />
            )}
        </div>
    );
};
