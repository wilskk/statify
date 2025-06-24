import { useState, useEffect, useMemo } from "react";
import { KMeansClusterDefault } from "@/components/Modals/Analyze/Classify/k-means-cluster/constants/k-means-cluster-default";
import {
    KMeansClusterContainerProps,
    KMeansClusterMainType,
    KMeansClusterType,
} from "@/components/Modals/Analyze/Classify/k-means-cluster/types/k-means-cluster";
import { KMeansClusterDialog } from "@/components/Modals/Analyze/Classify/k-means-cluster/dialogs/dialog";
import { KMeansClusterIterate } from "@/components/Modals/Analyze/Classify/k-means-cluster/dialogs/iterate";
import { KMeansClusterSave } from "@/components/Modals/Analyze/Classify/k-means-cluster/dialogs/save";
import { KMeansClusterOptions } from "@/components/Modals/Analyze/Classify/k-means-cluster/dialogs/options";
import { useModal } from "@/hooks/useModal";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { analyzeKMeansCluster } from "@/components/Modals/Analyze/Classify/k-means-cluster/services/k-means-cluster-analysis";
import { saveFormData, getFormData, clearFormData } from "@/hooks/useIndexedDB";
import { useToast } from "@/hooks/use-toast";

const KMeansClusterContainer = ({ onClose }: KMeansClusterContainerProps) => {
    const { toast } = useToast();
    const variables = useVariableStore((state) => state.variables);
    const dataVariables = useDataStore((state) => state.data);
    const tempVariables = useMemo(
        () => variables.map((variable) => variable.name),
        [variables]
    );

    const [formData, setFormData] = useState<KMeansClusterType>({
        ...KMeansClusterDefault,
    });
    const [isMainOpen, setIsMainOpen] = useState(true);
    const [isIterateOpen, setIsIterateOpen] = useState(false);
    const [isSaveOpen, setIsSaveOpen] = useState(false);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);

    const { closeModal } = useModal();

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await getFormData("KMeansCluster");
                if (savedData) {
                    const { id, ...formDataWithoutId } = savedData;
                    setFormData(formDataWithoutId);
                } else {
                    setFormData({ ...KMeansClusterDefault });
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

    const executeKMeansCluster = async (mainData: KMeansClusterMainType) => {
        try {
            const newFormData = {
                ...formData,
                main: mainData,
            };

            await saveFormData("KMeansCluster", newFormData);

            const result = await analyzeKMeansCluster({
                configData: newFormData,
                dataVariables: dataVariables,
                variables: variables,
            });

            if (result.errors.length > 0) {
                const errorMessages = result.errors;
                toast({
                    title: "K-Means Cluster Analysis Error",
                    description: (
                        <ul className="list-inside list-disc text-sm">
                            {errorMessages.map((msg, index) => (
                                <li key={index}>{msg}</li>
                            ))}
                        </ul>
                    ),
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Success! Your changes have been saved",
                    description: "K-Means analysis completed successfully.",
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "An Unknown Error Occurred",
                description:
                    "An unexpected error occurred during the analysis.",
                variant: "destructive",
            });
        } finally {
            closeModal();
            onClose();
        }
    };

    const resetFormData = async () => {
        try {
            await clearFormData("KMeansCluster");
            setFormData({ ...KMeansClusterDefault });
        } catch (error) {
            console.error("Failed to clear form data:", error);
        }
    };

    const handleClose = () => {
        closeModal();
        onClose();
    };

    const openSection = (section: "main" | "iterate" | "save" | "options") => {
        // Close all sections first
        setIsMainOpen(false);
        setIsIterateOpen(false);
        setIsSaveOpen(false);
        setIsOptionsOpen(false);

        // Open the requested section
        switch (section) {
            case "main":
                setIsMainOpen(true);
                break;
            case "iterate":
                setIsIterateOpen(true);
                break;
            case "save":
                setIsSaveOpen(true);
                break;
            case "options":
                setIsOptionsOpen(true);
                break;
        }
    };

    const handleContinue = () => {
        openSection("main");
    };

    const handleCancel = () => {
        openSection("main");
    };

    return (
        <div className="flex-grow overflow-y-auto flex flex-col h-full">
            {isMainOpen && (
                <KMeansClusterDialog
                    isMainOpen={isMainOpen}
                    setIsMainOpen={(value) =>
                        value ? openSection("main") : setIsMainOpen(false)
                    }
                    setIsIterateOpen={(value) =>
                        value ? openSection("iterate") : setIsIterateOpen(false)
                    }
                    setIsSaveOpen={(value) =>
                        value ? openSection("save") : setIsSaveOpen(false)
                    }
                    setIsOptionsOpen={(value) =>
                        value ? openSection("options") : setIsOptionsOpen(false)
                    }
                    updateFormData={(field, value) =>
                        updateFormData("main", field, value)
                    }
                    data={formData.main}
                    globalVariables={tempVariables}
                    onContinue={(mainData) => executeKMeansCluster(mainData)}
                    onReset={resetFormData}
                />
            )}

            {isIterateOpen && (
                <KMeansClusterIterate
                    isIterateOpen={isIterateOpen}
                    setIsIterateOpen={(value) =>
                        value ? openSection("iterate") : handleContinue()
                    }
                    updateFormData={(field, value) =>
                        updateFormData("iterate", field, value)
                    }
                    data={formData.iterate}
                />
            )}

            {isSaveOpen && (
                <KMeansClusterSave
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
                <KMeansClusterOptions
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
        </div>
    );
};

export default KMeansClusterContainer;
