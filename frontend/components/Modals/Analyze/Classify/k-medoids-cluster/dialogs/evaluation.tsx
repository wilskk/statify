"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type {
    KMedoidsClusterEvaluationProps,
    KMedoidsClusterEvaluationType,
} from "@/components/Modals/Analyze/Classify/k-medoids-cluster/types/k-medoids-cluster";
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Label } from "@/components/ui/label";
import { HelpCircle, AlertCircle } from "lucide-react";
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * ========================================
 * EVALUATION DIALOG
 * ========================================
 * Metrik evaluasi kualitas clustering:
 * - Silhouette Coefficient (WAJIB - pengganti ANOVA)
 * - Davies-Bouldin Index (Optional)
 * - Dunn Index (Optional)
 * - Silhouette Plot (Visualization)
 */
export const KMedoidsClusterEvaluation = ({
    updateFormData,
    data,
}: KMedoidsClusterEvaluationProps) => {
    const [evaluationState, setEvaluationState] = useState<KMedoidsClusterEvaluationType>({
        ...data,
    });

    useEffect(() => {
        setEvaluationState({ ...data });
    }, [data]);

    const handleChange = (
        field: keyof KMedoidsClusterEvaluationType,
        value: CheckedState | boolean | null
    ) => {
        setEvaluationState((prevState) => ({
            ...prevState,
            [field]: value === true,
        }));
    };

    const handleContinue = () => {
        Object.entries(evaluationState).forEach(([key, value]) => {
            updateFormData(key as keyof KMedoidsClusterEvaluationType, value);
        });

    };

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="space-y-4">
                <div className="w-full">
                    <Label className="font-bold text-base mb-2 block">
                        Cluster Quality Evaluation
                    </Label>
                    <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            <strong>Note:</strong> K-Medoids menggunakan evaluation metrics untuk menilai kualitas clustering, 
                            bukan ANOVA seperti K-Means (karena medoid adalah data point aktual, bukan centroid).
                        </AlertDescription>
                    </Alert>
                </div>

                {/* ========== PRIMARY METRIC (WAJIB) ========== */}
                <div className="flex flex-col gap-3 w-full border-b pb-4">
                    <div className="flex items-center gap-2">
                        <Label className="font-semibold">Primary Metric (Recommended)</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                    <p className="text-xs">
                                        Silhouette adalah metrik standar untuk clustering. 
                                        Menggantikan ANOVA table di K-Means SPSS.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="ComputeSilhouette"
                            checked={evaluationState.ComputeSilhouette}
                            onCheckedChange={(checked) =>
                                handleChange("ComputeSilhouette", checked)
                            }
                        />
                        <div className="flex-1">
                            <label
                                htmlFor="ComputeSilhouette"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Silhouette Coefficient
                            </label>
                            <div className="mt-1 space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    Range: <strong>-1 to +1</strong> (higher is better)
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    • <strong>&gt; 0.7:</strong> Strong structure<br/>
                                    • <strong>0.5 - 0.7:</strong> Reasonable structure<br/>
                                    • <strong>0.25 - 0.5:</strong> Weak structure<br/>
                                    • <strong>&lt; 0.25:</strong> No substantial structure
                                </p>
                                <p className="text-xs text-muted-foreground font-semibold mt-2">
                                    ⭐ Recommended: Always enable for cluster validation
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start space-x-2 ml-6">
                        <Checkbox
                            id="ShowSilhouettePlot"
                            checked={evaluationState.ShowSilhouettePlot}
                            disabled={!evaluationState.ComputeSilhouette}
                            onCheckedChange={(checked) =>
                                handleChange("ShowSilhouettePlot", checked)
                            }
                        />
                        <div className="flex-1">
                            <label
                                htmlFor="ShowSilhouettePlot"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Show Silhouette Plot
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Visual representation of silhouette values per case.
                                Helps identify misclassified cases (negative values).
                            </p>
                        </div>
                    </div>
                </div>

                {/* ========== ADDITIONAL METRICS (OPTIONAL) ========== */}
                <div className="flex flex-col gap-3 w-full">
                    <div className="flex items-center gap-2">
                        <Label className="font-semibold">Additional Metrics (Optional)</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                    <p className="text-xs">
                                        Metrik tambahan untuk analisis lebih mendalam.
                                        Tidak wajib, tapi berguna untuk penelitian.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="ComputeDaviesBouldin"
                            checked={evaluationState.ComputeDaviesBouldin}
                            onCheckedChange={(checked) =>
                                handleChange("ComputeDaviesBouldin", checked)
                            }
                        />
                        <div className="flex-1">
                            <label
                                htmlFor="ComputeDaviesBouldin"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Davies-Bouldin Index
                            </label>
                            <div className="mt-1 space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    Range: <strong>0 to ∞</strong> (lower is better)
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Measures average similarity ratio between clusters.
                                    Good clusters: low intra-cluster similarity, high inter-cluster separation.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="ComputeDunnIndex"
                            checked={evaluationState.ComputeDunnIndex}
                            onCheckedChange={(checked) =>
                                handleChange("ComputeDunnIndex", checked)
                            }
                        />
                        <div className="flex-1">
                            <label
                                htmlFor="ComputeDunnIndex"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Dunn Index
                            </label>
                            <div className="mt-1 space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    Range: <strong>0 to ∞</strong> (higher is better)
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Ratio of minimum inter-cluster distance to maximum intra-cluster distance.
                                    Good for identifying well-separated clusters.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========== INFO BOX ========== */}
                <div className="w-full bg-muted/50 p-3 rounded text-xs">
                    <p className="font-semibold mb-1">📊 Statistical Interpretation:</p>
                    <p className="text-muted-foreground">
                        These metrics help determine optimal k and validate clustering quality.
                        Use multiple metrics for robust evaluation. Compare results across different k values.
                    </p>
                </div>
            </div>
            

        </div>
    );
};
