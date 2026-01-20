"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CriteriaTabProps {
    options: {
        iterations: number;
        convergence: number;
        singularity: number;
        delta: number;
    };
    onChange: (criteria: any) => void;
}

export const CriteriaTab: React.FC<CriteriaTabProps> = ({ options, onChange }) => {

    const handleInputChange = (field: string, value: string) => {
        const numValue = parseFloat(value);
        onChange({
            ...options,
            [field]: isNaN(numValue) ? 0 : numValue,
        });
    };

    return (
        <div className="space-y-6 p-1">
            <div>
                <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
                    Iterations
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs text-xs">
                                    Pengaturan batas maksimum perulangan algoritma untuk menemukan estimasi parameter terbaik.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </h3>
                <p className="text-[11px] text-muted-foreground mb-4">
                    Kontrol proses estimasi Model Likelihood.
                </p>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {/* Maximum Iterations */}
                    <div className="space-y-2">
                        <Label htmlFor="iterations" className="text-xs">Maximum iterations:</Label>
                        <Input
                            id="iterations"
                            type="number"
                            value={options.iterations}
                            onChange={(e) => handleInputChange("iterations", e.target.value)}
                            className="h-8 text-xs"
                        />
                    </div>

                    {/* Convergence Criterion */}
                    <div className="space-y-2">
                        <Label htmlFor="convergence" className="text-xs">Convergence criterion:</Label>
                        <Input
                            id="convergence"
                            type="number"
                            step="0.000001"
                            value={options.convergence}
                            onChange={(e) => handleInputChange("convergence", e.target.value)}
                            className="h-8 text-xs"
                        />
                    </div>
                </div>
            </div>

            <Separator />

            <div>
                <h3 className="text-sm font-medium mb-4 italic text-muted-foreground/80">Tolerance & Singularity</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {/* Singularity Criterion */}
                    <div className="space-y-2">
                        <Label htmlFor="singularity" className="text-xs">Singularity criterion:</Label>
                        <Input
                            id="singularity"
                            type="number"
                            step="0.000000001"
                            value={options.singularity}
                            onChange={(e) => handleInputChange("singularity", e.target.value)}
                            className="h-8 text-xs"
                        />
                    </div>

                    {/* Cell Delta */}
                    <div className="space-y-2">
                        <Label htmlFor="delta" className="text-xs">Added to empty cells (Delta):</Label>
                        <Input
                            id="delta"
                            type="number"
                            step="0.1"
                            value={options.delta}
                            onChange={(e) => handleInputChange("delta", e.target.value)}
                            className="h-8 text-xs"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-4 p-3 bg-muted/20 border rounded-md">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <span className="font-bold uppercase mr-1">Catatan:</span>
                    Nilai default mengikuti standar industri (SPSS). Nilai konvergensi yang lebih kecil
                    meningkatkan presisi namun membutuhkan waktu komputasi Rust WASM yang lebih lama.
                </p>
            </div>
        </div>
    );
};