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
import { HelpCircle, AlertCircle, TrendingDown, BarChart2 } from "lucide-react";
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

                {/* ========== INFO BOX ========== */}
                <div className="w-full bg-muted/50 p-3 rounded text-xs">
                    <p className="font-semibold mb-1">📊 Statistical Interpretation:</p>
                    <p className="text-muted-foreground">
                        Silhouette Coefficient is the standard metric for validating clustering quality.
                        Compare Silhouette values across different k to determine optimal number of clusters.
                        Values closer to +1 indicate well-separated, cohesive clusters.
                    </p>
                </div>

                {/* ========== ELBOW METHOD ========== */}
                <div className="flex flex-col gap-3 w-full border-b pb-4">
                    <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        <Label className="font-semibold">Elbow Method</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                    <p className="text-xs">
                                        Elbow Method memplot total within-cluster distance (SSE/Inertia)
                                        untuk setiap nilai k. Titik "siku" pada kurva mengindikasikan k optimal:
                                        penambahan k lebih lanjut tidak memberi penurunan signifikan.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="ShowElbowPlot"
                            checked={evaluationState.ShowElbowPlot}
                            onCheckedChange={(checked) =>
                                handleChange("ShowElbowPlot", checked)
                            }
                        />
                        <div className="flex-1">
                            <label
                                htmlFor="ShowElbowPlot"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Show Elbow Plot
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Grafik SSE (Sum of Squared Errors) vs k. Identifikasi titik siku
                                sebagai indikator k optimal.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ========== OPTIMAL K CHART ========== */}
                <div className="flex flex-col gap-3 w-full border-b pb-4">
                    <div className="flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-muted-foreground" />
                        <Label className="font-semibold">Optimal k Evaluation Chart</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                    <p className="text-xs">
                                        Grafik gabungan yang menampilkan Silhouette Score dan/atau Elbow
                                        untuk setiap k dalam rentang yang ditentukan. Sangat berguna
                                        jika mode Automatic dipilih di tab Variables.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="ShowOptimalKChart"
                            checked={evaluationState.ShowOptimalKChart}
                            disabled={!evaluationState.ComputeSilhouette && !evaluationState.ShowElbowPlot}
                            onCheckedChange={(checked) =>
                                handleChange("ShowOptimalKChart", checked)
                            }
                        />
                        <div className="flex-1">
                            <label
                                htmlFor="ShowOptimalKChart"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Show Optimal k Chart
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Panel grafik evaluasi k: Silhouette bar-chart + Elbow line chart
                                dalam satu tampilan. Aktifkan minimal satu metrik di atas.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            

        </div>
    );
};
