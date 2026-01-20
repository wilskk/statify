"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle } from "lucide-react";
import { KMedoidsClusterDefault } from "@/components/Modals/Analyze/Classify/k-medoids-cluster/constants/k-medoids-cluster-default";
import type {
    KMedoidsClusterContainerProps,
    KMedoidsClusterMainType,
    KMedoidsClusterType,
    KMedoidsClusterIterateType,
    KMedoidsClusterResultsType,
    KMedoidsClusterEvaluationType,
    KMedoidsClusterSaveType,
    KMedoidsClusterOptionsType,
} from "@/components/Modals/Analyze/Classify/k-medoids-cluster/types/k-medoids-cluster";
import { KMedoidsClusterDialog } from "@/components/Modals/Analyze/Classify/k-medoids-cluster/dialogs/dialog";
import { KMedoidsClusterIterate } from "@/components/Modals/Analyze/Classify/k-medoids-cluster/dialogs/iterate";
import { KMedoidsClusterResults } from "@/components/Modals/Analyze/Classify/k-medoids-cluster/dialogs/results";
import { KMedoidsClusterEvaluation } from "@/components/Modals/Analyze/Classify/k-medoids-cluster/dialogs/evaluation";
import { KMedoidsClusterSave } from "@/components/Modals/Analyze/Classify/k-medoids-cluster/dialogs/save";
import { KMedoidsClusterOptions } from "@/components/Modals/Analyze/Classify/k-medoids-cluster/dialogs/options";
import { useModal } from "@/hooks/useModal";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { analyzeKMedoidsCluster } from "@/components/Modals/Analyze/Classify/k-medoids-cluster/services/k-medoids-cluster-analysis";
import { clearFormData, getFormData, saveFormData } from "@/hooks/useIndexedDB";
import { toast } from "sonner";

export const KMedoidsClusterContainer = ({
    onClose,
}: KMedoidsClusterContainerProps) => {
    const variables = useVariableStore((state) => state.variables);
    const dataVariables = useDataStore((state) => state.data);
    const tempVariables = useMemo(
        () => variables.map((variable) => variable.name),
        [variables]
    );

    const [formData, setFormData] = useState<KMedoidsClusterType>({
        ...KMedoidsClusterDefault,
    });
    const [activeTab, setActiveTab] = useState("variables");

    const { closeModal } = useModal();

    useEffect(() => {
        const loadFormData = async () => {
            const savedData = await getFormData("KMedoidsCluster");
            if (savedData) {
                const { id, ...formDataWithoutId } = savedData;
                setFormData(formDataWithoutId);
            } else {
                setFormData({ ...KMedoidsClusterDefault });
            }
        };

        toast.promise(loadFormData, {
            loading: "Loading K-Medoids Cluster settings...",
            success: () => {
                return "K-Medoids Cluster settings loaded successfully.";
            },
            error: (err) => {
                return (
                    <span>
                        An error occurred while loading settings.
                        <br />
                        Error: {String(err)}
                    </span>
                );
            },
        });
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

    const executeKMedoidsCluster = async (mainData: KMedoidsClusterMainType) => {
        closeModal();
        onClose();

        const promise = async () => {
            const newFormData = {
                ...formData,
                main: mainData,
            };

            await saveFormData("KMedoidsCluster", newFormData);

            await analyzeKMedoidsCluster({
                configData: newFormData,
                dataVariables,
                variables,
            });
        };

        toast.promise(promise, {
            loading: "Running K-Medoids Cluster analysis...",
            success: () => {
                return "K-Medoids Cluster analysis has been completed successfully.";
            },
            error: (err) => {
                return (
                    <span>
                        An error occurred during K-Medoids Cluster analysis.
                        <br />
                        Error: {String(err)}
                    </span>
                );
            },
        });
    };

    const resetFormData = async () => {
        try {
            setFormData({ ...KMedoidsClusterDefault });
            await clearFormData("KMedoidsCluster");
            toast.success("Form data cleared successfully");
        } catch (error) {
            toast.error("Failed to clear form data:", error ?? "");
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex-grow px-6 overflow-y-auto min-h-0">
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full h-full flex flex-col"
                >
                    <TabsList className="grid w-full grid-cols-6 flex-shrink-0">
                        <TabsTrigger value="variables">Variables</TabsTrigger>
                        <TabsTrigger value="iterate">Iterate</TabsTrigger>
                        <TabsTrigger value="results">Results</TabsTrigger>
                        <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                        <TabsTrigger value="save">Save</TabsTrigger>
                        <TabsTrigger value="options">Options</TabsTrigger>
                    </TabsList>

                    <div className="flex-grow min-h-0 overflow-hidden">
                        <TabsContent
                            value="variables"
                            className="h-full mt-0"
                        >
                            <KMedoidsClusterDialog
                                data={formData.main}
                                globalVariables={tempVariables}
                                updateFormData={(field, value) =>
                                    updateFormData("main", field, value)
                                }
                            />
                        </TabsContent>

                        <TabsContent
                            value="iterate"
                            className="h-full mt-0"
                        >
                            <KMedoidsClusterIterate
                                data={formData.iterate}
                                updateFormData={(field, value) =>
                                    updateFormData("iterate", field, value)
                                }
                            />
                        </TabsContent>

                        <TabsContent
                            value="results"
                            className="h-full mt-0"
                        >
                            <KMedoidsClusterResults
                                data={formData.results}
                                updateFormData={(field, value) =>
                                    updateFormData("results", field, value)
                                }
                            />
                        </TabsContent>

                        <TabsContent
                            value="evaluation"
                            className="h-full mt-0"
                        >
                            <KMedoidsClusterEvaluation
                                data={formData.evaluation}
                                updateFormData={(field, value) =>
                                    updateFormData("evaluation", field, value)
                                }
                            />
                        </TabsContent>

                        <TabsContent
                            value="save"
                            className="h-full mt-0"
                        >
                            <KMedoidsClusterSave
                                data={formData.save}
                                updateFormData={(field, value) =>
                                    updateFormData("save", field, value)
                                }
                            />
                        </TabsContent>

                        <TabsContent
                            value="options"
                            className="h-full mt-0"
                        >
                            <KMedoidsClusterOptions
                                data={formData.options}
                                updateFormData={(field, value) =>
                                    updateFormData("options", field, value)
                                }
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div className="flex items-center text-muted-foreground">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                                >
                                    <HelpCircle className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p className="text-xs">Help</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="flex items-center space-x-4">
                    <Button
                        onClick={() => executeKMedoidsCluster(formData.main)}
                        disabled={!formData.main.TargetVar || formData.main.TargetVar.length === 0}
                    >
                        OK
                    </Button>
                    <Button
                        variant="outline"
                        onClick={resetFormData}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            closeModal();
                            onClose();
                        }}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default KMedoidsClusterContainer;