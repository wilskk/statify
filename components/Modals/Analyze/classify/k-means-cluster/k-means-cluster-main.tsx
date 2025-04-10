import { useState, useEffect } from "react";
import { KMeansClusterDefault } from "@/constants/classify/k-means-cluster/k-means-cluster-default";
import {
    KMeansClusterContainerProps,
    KMeansClusterMainType,
    KMeansClusterType,
} from "@/models/classify/k-means-cluster/k-means-cluster";
import { KMeansClusterDialog } from "@/components/Modals/Analyze/classify/k-means-cluster/dialog";
import { KMeansClusterIterate } from "@/components/Modals/Analyze/classify/k-means-cluster/iterate";
import { KMeansClusterSave } from "@/components/Modals/Analyze/classify/k-means-cluster/save";
import { KMeansClusterOptions } from "@/components/Modals/Analyze/classify/k-means-cluster/options";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useModal } from "@/hooks/useModal";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { analyzeKMeansCluster } from "@/services/analyze/classify/k-means-cluster/k-means-cluster-analysis";
import { saveFormData, getFormData, clearFormData } from "@/hooks/useIndexedDB";

export const KMeansClusterContainer = ({
    onClose,
}: KMeansClusterContainerProps) => {
    const variables = useVariableStore((state) => state.variables);
    const dataVariables = useDataStore((state) => state.data);
    const tempVariables = variables.map((variables) => variables.name);

    const [formData, setFormData] = useState<KMeansClusterType>({
        ...KMeansClusterDefault,
    });
    const [isMainOpen, setIsMainOpen] = useState(true);
    const [isIterateOpen, setIsIterateOpen] = useState(false);
    const [isSaveOpen, setIsSaveOpen] = useState(false);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);

    const { closeModal } = useModal();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

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

            await analyzeKMeansCluster({
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

    return (
        <Dialog open={isMainOpen} onOpenChange={handleClose}>
            <DialogTitle></DialogTitle>
            <DialogContent>
                <KMeansClusterDialog
                    isMainOpen={isMainOpen}
                    setIsMainOpen={setIsMainOpen}
                    setIsIterateOpen={setIsIterateOpen}
                    setIsSaveOpen={setIsSaveOpen}
                    setIsOptionsOpen={setIsOptionsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("main", field, value)
                    }
                    data={formData.main}
                    globalVariables={tempVariables}
                    onContinue={(mainData) => executeKMeansCluster(mainData)}
                    onReset={resetFormData}
                />

                {/* Iterate */}
                <KMeansClusterIterate
                    isIterateOpen={isIterateOpen}
                    setIsIterateOpen={setIsIterateOpen}
                    updateFormData={(field, value) =>
                        updateFormData("iterate", field, value)
                    }
                    data={formData.iterate}
                />

                {/* Save */}
                <KMeansClusterSave
                    isSaveOpen={isSaveOpen}
                    setIsSaveOpen={setIsSaveOpen}
                    updateFormData={(field, value) =>
                        updateFormData("save", field, value)
                    }
                    data={formData.save}
                />

                {/* Options */}
                <KMeansClusterOptions
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
