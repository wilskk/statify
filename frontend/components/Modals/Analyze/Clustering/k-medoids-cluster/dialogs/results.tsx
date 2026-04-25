"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type {
    KMedoidsClusterResultsProps,
    KMedoidsClusterResultsType,
} from "@/components/Modals/Analyze/Clustering/k-medoids-cluster/types/k-medoids-cluster";
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Label } from "@/components/ui/label";
import { HelpCircle } from "lucide-react";
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";

/**
 * ========================================
 * RESULTS DIALOG
 * ========================================
 * Konfigurasi output hasil clustering:
 * - Final medoids (setara Final Cluster Centers SPSS)
 * - Cluster membership
 * - Case count per cluster
 * - Iteration history
 * - Total cost/dissimilarity
 */
export const KMedoidsClusterResults = ({
    updateFormData,
    data,
}: KMedoidsClusterResultsProps) => {
    const [resultsState, setResultsState] = useState<KMedoidsClusterResultsType>({
        ...data,
    });

    useEffect(() => {
        setResultsState({ ...data });
    }, [data]);

    const handleChange = (
        field: keyof KMedoidsClusterResultsType,
        value: CheckedState | boolean | null
    ) => {
        setResultsState((prevState) => ({
            ...prevState,
            [field]: value === true,
        }));
    };

    const handleContinue = () => {
        Object.entries(resultsState).forEach(([key, value]) => {
            updateFormData(key as keyof KMedoidsClusterResultsType, value);
        });

    };

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="space-y-4">
                <div className="w-full">
                    <Label className="font-bold text-base mb-3 block">
                        Clustering Results Output
                    </Label>
                    <p className="text-sm text-muted-foreground mb-4">
                        Select which clustering results to display in the output
                    </p>
                </div>

                {/* ========== CORE OUTPUTS (WAJIB) ========== */}
                <div className="flex flex-col gap-3 w-full border-b pb-4">
                    <Label className="font-semibold">Core Outputs (Recommended)</Label>
                    
                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="ShowFinalMedoids"
                            checked={resultsState.ShowFinalMedoids}
                            onCheckedChange={(checked) =>
                                handleChange("ShowFinalMedoids", checked)
                            }
                        />
                        <div className="flex-1">
                            <label
                                htmlFor="ShowFinalMedoids"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Final Medoids
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Display final cluster centers (actual data points). 
                                Setara dengan "Final Cluster Centers" di SPSS K-Means.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="ShowClusterMembership"
                            checked={resultsState.ShowClusterMembership}
                            onCheckedChange={(checked) =>
                                handleChange("ShowClusterMembership", checked)
                            }
                        />
                        <div className="flex-1">
                            <label
                                htmlFor="ShowClusterMembership"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Cluster Membership
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Show which cluster each case belongs to (per-case assignment).
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="ShowCaseCount"
                            checked={resultsState.ShowCaseCount}
                            onCheckedChange={(checked) =>
                                handleChange("ShowCaseCount", checked)
                            }
                        />
                        <div className="flex-1">
                            <label
                                htmlFor="ShowCaseCount"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Number of Cases per Cluster
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Summary table showing count of cases in each cluster.
                                Setara "Number of Cases in each Cluster" SPSS.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ========== ADDITIONAL OUTPUTS ========== */}
                <div className="flex flex-col gap-3 w-full">
                    <Label className="font-semibold">Additional Information (Optional)</Label>
                    
                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="ShowTotalCost"
                            checked={resultsState.ShowTotalCost}
                            onCheckedChange={(checked) =>
                                handleChange("ShowTotalCost", checked)
                            }
                        />
                        <div className="flex-1">
                            <label
                                htmlFor="ShowTotalCost"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Total Cost / Dissimilarity
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Display total within-cluster dissimilarity (sum of distances to medoids).
                                Lower is better. Useful for comparing different k values.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="ShowIterationHistory"
                            checked={resultsState.ShowIterationHistory}
                            onCheckedChange={(checked) =>
                                handleChange("ShowIterationHistory", checked)
                            }
                        />
                        <div className="flex-1">
                            <label
                                htmlFor="ShowIterationHistory"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Iteration History
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Show convergence process: medoid changes and cost improvement per iteration.
                                Setara "Iteration History" di SPSS (untuk transparency & interpretability).
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="ShowConvergenceAlgorithm"
                            checked={resultsState.ShowConvergenceAlgorithm}
                            onCheckedChange={(checked) =>
                                handleChange("ShowConvergenceAlgorithm", checked)
                            }
                        />
                        <div className="flex-1">
                            <label
                                htmlFor="ShowConvergenceAlgorithm"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Konvergensi Algoritma
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Tampilkan output konvergensi algoritma: panel status konvergensi, grafik biaya per iterasi,
                                dan tabel histori iterasi.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            

        </div>
    );
};
