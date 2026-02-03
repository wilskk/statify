"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type {
    KMedoidsClusterIterateProps,
    KMedoidsClusterIterateType,
} from "@/components/Modals/Analyze/Classify/k-medoids-cluster/types/k-medoids-cluster";
import {
    KMedoidsMethod,
    DistanceMetric,
    InitialMedoidsStrategy,
} from "@/components/Modals/Analyze/Classify/k-medoids-cluster/types/k-medoids-cluster";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { HelpCircle } from "lucide-react";
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";

/**
 * ========================================
 * ITERATE DIALOG
 * ========================================
 * Konfigurasi parameter algoritma K-Medoids:
 * - Metode (PAM/CLARA/CLARANS)
 * - Distance metric
 * - Initial medoids strategy
 * - Iteration & convergence parameters
 */
export const KMedoidsClusterIterate = ({
    updateFormData,
    data,
}: KMedoidsClusterIterateProps) => {
    const [iterateState, setIterateState] = useState<KMedoidsClusterIterateType>({
        ...data,
    });

    useEffect(() => {
        setIterateState({ ...data });
    }, [data]);

    const handleChange = (
        field: keyof KMedoidsClusterIterateType,
        value: number | boolean | string | null
    ) => {
        setIterateState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleContinue = () => {
        // Validasi Maximum Iterations
        if (
            iterateState.MaximumIterations == null ||
            iterateState.MaximumIterations < 1 ||
            iterateState.MaximumIterations > 999
        ) {
            toast.warning("Maximum iterations must be between 1 and 999.");
            return;
        }
        
        // Validasi Convergence Criterion
        if (
            iterateState.ConvergenceCriterion == null ||
            iterateState.ConvergenceCriterion < 0
        ) {
            toast.warning("Convergence criterion must be >= 0.");
            return;
        }
        
        // Validasi CLARA parameters (jika method = CLARA)
        if (iterateState.Method === KMedoidsMethod.CLARA) {
            if (iterateState.SampleSize && iterateState.SampleSize < 10) {
                toast.warning("CLARA sample size must be >= 10.");
                return;
            }
            if (iterateState.NumSamples && iterateState.NumSamples < 1) {
                toast.warning("Number of samples must be >= 1.");
                return;
            }
        }
        
        Object.entries(iterateState).forEach(([key, value]) => {
            updateFormData(key as keyof KMedoidsClusterIterateType, value);
        });
    };

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="space-y-6">
                {/* ========== K-MEDOIDS METHOD ========== */}
                <div className="flex flex-col gap-2 border-b pb-4">
                    <div className="flex items-center gap-2">
                        <Label className="font-bold">K-Medoids Method</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p className="text-xs">
                                        <strong>PAM:</strong> Optimal quality, O(n²), small data<br/>
                                        <strong>CLARA:</strong> Sampling, faster, large data<br/>
                                        <strong>CLARANS:</strong> Hybrid approach
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <Select
                        value={iterateState.Method}
                        onValueChange={(value) =>
                            handleChange("Method", value as KMedoidsMethod)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={KMedoidsMethod.PAM}>
                                PAM (Partitioning Around Medoids)
                            </SelectItem>
                            <SelectItem value={KMedoidsMethod.CLARA}>
                                CLARA (Large Datasets)
                            </SelectItem>
                            <SelectItem value={KMedoidsMethod.CLARANS}>
                                CLARANS (Randomized Search)
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* ========== DISTANCE METRIC ========== */}
                <div className="flex flex-col gap-2 border-b pb-4">
                    <div className="flex items-center gap-2">
                        <Label className="font-bold">Distance Measure</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p className="text-xs">
                                        <strong>Euclidean:</strong> Geometric distance, magnitude-sensitive<br/>
                                        <strong>Manhattan:</strong> City-block, more robust to outliers
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <RadioGroup
                        value={iterateState.DistanceMetric}
                        onValueChange={(value) =>
                            handleChange("DistanceMetric", value as DistanceMetric)
                        }
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value={DistanceMetric.Euclidean} id="euclidean" />
                            <Label htmlFor="euclidean">Euclidean distance</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value={DistanceMetric.Manhattan} id="manhattan" />
                            <Label htmlFor="manhattan">Manhattan distance (City-block)</Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* ========== INITIAL MEDOIDS STRATEGY ========== */}
                <div className="flex flex-col gap-2 border-b pb-4">
                    <div className="flex items-center gap-2">
                        <Label className="font-bold">Initial Medoids Strategy</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p className="text-xs">
                                        Strategi pemilihan medoid awal mempengaruhi konvergensi dan hasil akhir
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <Select
                        value={iterateState.InitialStrategy}
                        onValueChange={(value) =>
                            handleChange("InitialStrategy", value as InitialMedoidsStrategy)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select strategy" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={InitialMedoidsStrategy.Random}>
                                Random selection
                            </SelectItem>
                            <SelectItem value={InitialMedoidsStrategy.KMeansPlusPlus}>
                                K-Means++ (smart initialization)
                            </SelectItem>
                            <SelectItem value={InitialMedoidsStrategy.FirstK}>
                                First K data points
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* ========== ITERATION PARAMETERS ========== */}
                <div className="flex flex-col gap-3 border-b pb-4">
                    <Label className="font-bold">Iteration & Convergence</Label>
                    
                    <div className="flex flex-col gap-2">
                        <Label>Maximum Iterations:</Label>
                        <Input
                            type="number"
                            value={iterateState.MaximumIterations || ""}
                            min={1}
                            max={999}
                            onChange={(e) =>
                                handleChange("MaximumIterations", Number(e.target.value))
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            Stop after this many iterations (PAM default: 300)
                        </p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <Label>Convergence Criterion:</Label>
                        <Input
                            type="number"
                            value={iterateState.ConvergenceCriterion || ""}
                            min={0}
                            step={0.0001}
                            onChange={(e) =>
                                handleChange("ConvergenceCriterion", Number(e.target.value))
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            Stop if improvement in cost &lt; this value (0 = any improvement)
                        </p>
                    </div>
                </div>

                {/* ========== CLARA-SPECIFIC PARAMETERS ========== */}
                {iterateState.Method === KMedoidsMethod.CLARA && (
                    <div className="flex flex-col gap-3 border-b pb-4 bg-muted/30 p-3 rounded">
                        <Label className="font-bold">CLARA Parameters</Label>
                        
                        <div className="flex flex-col gap-2">
                            <Label>Sample Size:</Label>
                            <Input
                                type="number"
                                value={iterateState.SampleSize || ""}
                                min={10}
                                placeholder="Auto: 40 + 2k"
                                onChange={(e) =>
                                    handleChange("SampleSize", Number(e.target.value))
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Size of random sample (leave empty for auto: 40 + 2k)
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <Label>Number of Samples:</Label>
                            <Input
                                type="number"
                                value={iterateState.NumSamples || ""}
                                min={1}
                                max={20}
                                onChange={(e) =>
                                    handleChange("NumSamples", Number(e.target.value))
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                How many sampling iterations (default: 5)
                            </p>
                        </div>
                    </div>
                )}
            </div>
            

        </div>
    );
};
