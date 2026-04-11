"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type {
    KMedoidsClusterIterateProps,
    KMedoidsClusterIterateType,
} from "@/components/Modals/Analyze/Classify/k-medoids-cluster/types/k-medoids-cluster";
import {
    KMedoidsMethod,
    InitialMedoidsStrategy,
} from "@/components/Modals/Analyze/Classify/k-medoids-cluster/types/k-medoids-cluster";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { HelpCircle, AlertTriangle } from "lucide-react";
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { useDataStore } from "@/stores/useDataStore";

/**
 * ========================================
 * ITERATE DIALOG
 * ========================================
 * Konfigurasi parameter algoritma K-Medoids:
 * - Metode (PAM/CLARA/CLARANS)
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
    
    const dataCount = useDataStore((state) => state.data.length);
    
    // Performance warning logic
    const n_init = iterateState.NumberOfInitializations || 10;
    const showPerformanceWarning = 
        (dataCount > 500 && n_init > 5) || 
        (dataCount > 1000 && n_init > 3) ||
        (dataCount > 2000);

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
        // Validasi MaximumIterations
        if (iterateState.MaximumIterations && iterateState.MaximumIterations < 1) {
            toast.warning("Maximum iterations must be >= 1.");
            return;
        }
        
        // Validasi NumberOfInitializations
        if (iterateState.NumberOfInitializations && iterateState.NumberOfInitializations < 1) {
            toast.warning("Number of initializations must be >= 1.");
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
        
        // Validasi CLARANS parameters (jika method = CLARANS)
        if (iterateState.Method === KMedoidsMethod.CLARANS) {
            if (iterateState.NumLocal && iterateState.NumLocal < 1) {
                toast.warning("Number of local minima must be >= 1.");
                return;
            }
            if (iterateState.MaxNeighbor && iterateState.MaxNeighbor < 1) {
                toast.warning("Maximum neighbors must be >= 1.");
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
                {/* ========== PERFORMANCE WARNING ========== */}
                {showPerformanceWarning && (
                    <Alert variant="default" className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                        <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-300">
                            <strong>Performance Notice:</strong> Large dataset detected ({dataCount} cases).
                            {dataCount > 1000 && n_init > 3 ? (
                                <span> Consider reducing <strong>Number of Initializations</strong> to 1-3 for faster execution.</span>
                            ) : (
                                <span> Clustering may take several seconds. Algorithm runs in background (UI stays responsive).</span>
                            )}
                            {iterateState.Method === KMedoidsMethod.PAM && dataCount > 1000 && (
                                <span> For n &gt; 1000, consider using <strong>CLARA</strong> method instead.</span>
                            )}
                        </AlertDescription>
                    </Alert>
                )}
                
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

                {/* ========== INITIAL MEDOIDS STRATEGY ========== */}
                <div className="flex flex-col gap-2 border-b pb-4">
                    <div className="flex items-center gap-2">
                        <Label className="font-bold">Initial Medoids Selection</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                    <p className="text-xs">
                                        <strong>Random:</strong> Random selection (default)<br/>
                                        <strong>K-Means++:</strong> Smart initialization, better convergence<br/>
                                        <strong>First K:</strong> First k data points (reproducible)<br/>
                                        <strong>User Defined:</strong> Manual selection (advanced)
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
                            <SelectValue placeholder="Select initial strategy" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={InitialMedoidsStrategy.Random}>
                                Random Selection
                            </SelectItem>
                            <SelectItem value={InitialMedoidsStrategy.KMeansPlusPlus}>
                                K-Means++ (Smart Initialization)
                            </SelectItem>
                            <SelectItem value={InitialMedoidsStrategy.FirstK}>
                                First K Data Points
                            </SelectItem>
                            <SelectItem value={InitialMedoidsStrategy.UserDefined}>
                                User Defined (Manual)
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* ========== GENERAL ITERATION PARAMETERS ========== */}
                <div className="flex flex-col gap-3 border-b pb-4">
                    <div className="flex items-center gap-2">
                        <Label className="font-bold">Iteration Parameters</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                    <p className="text-xs">
                                        Control how the algorithm iterates and converges to a solution.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>Maximum Iterations:</Label>
                            <Input
                                type="number"
                                value={iterateState.MaximumIterations || ""}
                                min={1}
                                placeholder="300"
                                onChange={(e) =>
                                    handleChange("MaximumIterations", Number(e.target.value))
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Max iterations before stopping (default: 300)
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Convergence Tolerance:</Label>
                            <Input
                                type="number"
                                value={iterateState.ConvergenceCriterion ?? ""}
                                min={0}
                                step={0.0001}
                                placeholder="0"
                                onChange={(e) =>
                                    handleChange("ConvergenceCriterion", Number(e.target.value))
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Stop if cost change &lt; threshold (default: 0)
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Random Seed:</Label>
                            <Input
                                type="number"
                                value={iterateState.RandomSeed ?? ""}
                                placeholder="Random"
                                onChange={(e) =>
                                    handleChange("RandomSeed", e.target.value === "" ? null : Number(e.target.value))
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                For reproducibility (leave empty for random)
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Number of Initializations:</Label>
                            <Input
                                type="number"
                                value={iterateState.NumberOfInitializations || ""}
                                min={1}
                                placeholder="10"
                                onChange={(e) =>
                                    handleChange("NumberOfInitializations", Number(e.target.value))
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Run multiple times, keep best result (default: 10). Higher values = better results but slower. Use 1-3 for large datasets.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ========== STANDARDIZE ========== */}
                <div className="flex flex-col gap-2 border-b pb-4">
                    <Label className="font-bold">Data Standardization</Label>
                    <div className="flex items-start gap-3 pt-1">
                        <Checkbox
                            id="standardize"
                            checked={!!iterateState.Standardize}
                            onCheckedChange={(v) => handleChange("Standardize", !!v)}
                        />
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="standardize" className="cursor-pointer">
                                Standardize variables (setara <code className="text-xs bg-muted px-1 rounded">stand=TRUE</code> di R)
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Setiap variabel dikurangi mean-nya lalu dibagi mean absolute deviation-nya
                                sebelum menghitung jarak. Aktifkan agar total cost sebanding dengan
                                output <code className="bg-muted px-1 rounded">pam()</code> R.
                            </p>
                        </div>
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

                {/* ========== CLARANS-SPECIFIC PARAMETERS ========== */}
                {iterateState.Method === KMedoidsMethod.CLARANS && (
                    <div className="flex flex-col gap-3 border-b pb-4 bg-muted/30 p-3 rounded">
                        <div className="flex items-center gap-2">
                            <Label className="font-bold">CLARANS Parameters</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-sm">
                                        <p className="text-xs">
                                            CLARANS uses randomized local search to find optimal clustering.
                                            Higher values improve quality but increase computation time.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <Label>Number of Local Minima:</Label>
                            <Input
                                type="number"
                                value={iterateState.NumLocal || ""}
                                min={1}
                                placeholder="2"
                                onChange={(e) =>
                                    handleChange("NumLocal", Number(e.target.value))
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Number of local minima to search (default: 2)
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <Label>Maximum Neighbors:</Label>
                            <Input
                                type="number"
                                value={iterateState.MaxNeighbor ?? ""}
                                min={1}
                                placeholder="Auto: max(250, 1.25% of n×(k-1))"
                                onChange={(e) =>
                                    handleChange("MaxNeighbor", e.target.value === "" ? null : Number(e.target.value))
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Max neighbors to check per search (leave empty for auto calculation)
                            </p>
                        </div>
                    </div>
                )}
            </div>
            

        </div>
    );
};
