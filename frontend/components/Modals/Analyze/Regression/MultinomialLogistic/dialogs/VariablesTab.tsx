"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ChevronRight,
    Ruler,
    Shapes,
    BarChartHorizontal,
    Info
} from "lucide-react";
import type { Variable } from "@/types/Variable";
import { cn } from "@/lib/utils";

interface VariablesTabProps {
    variables: Variable[];
    options: {
        dependent: Variable | null;
        factors: Variable[];
        covariates: Variable[];
    };
    setOptions: React.Dispatch<React.SetStateAction<any>>;
}

export const VariablesTab: React.FC<VariablesTabProps> = ({
    variables,
    options,
    setOptions,
}) => {
    const [selectedVar, setSelectedVar] = useState<Variable | null>(null);

    const availableVariables = variables.filter(
        (v) =>
            v.id !== options.dependent?.id &&
            !options.factors.some((f) => f.id === v.id) &&
            !options.covariates.some((c) => c.id === v.id)
    );

    const handleSelect = (v: Variable) => {
        setSelectedVar(selectedVar?.id === v.id ? null : v);
    };

    // Fungsi pemindahan variabel
    const moveToDependent = () => {
        if (!selectedVar) return;
        setOptions((prev: any) => ({ ...prev, dependent: selectedVar }));
        setSelectedVar(null);
    };

    const moveToFactors = () => {
        if (!selectedVar) return;
        setOptions((prev: any) => ({ ...prev, factors: [...prev.factors, selectedVar] }));
        setSelectedVar(null);
    };

    const moveToCovariates = () => {
        if (!selectedVar) return;
        setOptions((prev: any) => ({ ...prev, covariates: [...prev.covariates, selectedVar] }));
        setSelectedVar(null);
    };

    const removeFromList = (id: string, key: "factors" | "covariates" | "dependent") => {
        setOptions((prev: any) => ({
            ...prev,
            [key]: key === "dependent" ? null : prev[key].filter((v: Variable) => v.id !== id),
        }));
    };

    const getVariableIcon = (measure: string) => {
        switch (measure?.toLowerCase()) {
            case "scale": return <Ruler className="h-4 w-4 text-blue-500" />;
            case "ordinal": return <BarChartHorizontal className="h-4 w-4 text-orange-500" />;
            case "nominal": return <Shapes className="h-4 w-4 text-green-500" />;
            default: return <Ruler className="h-4 w-4 opacity-50" />;
        }
    };

    return (
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 h-full max-h-[440px] overflow-hidden p-1">

            {/* 1. Source List (Kiri) */}
            <div className="flex flex-col border rounded-md bg-card overflow-hidden h-full">
                <div className="p-2 border-b bg-muted/30 text-[10px] font-bold uppercase flex items-center justify-between shrink-0">
                    Variables
                    <Info className="h-3 w-3 opacity-40" />
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {availableVariables.map((v) => (
                            <div
                                key={v.id}
                                onClick={() => handleSelect(v)}
                                className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-xs transition-colors",
                                    selectedVar?.id === v.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                                )}
                            >
                                {getVariableIcon(v.measure || "")}
                                <span className="truncate">{v.name}</span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* 2. Middle Column & 3. Target Lists (Digabung untuk sinkronisasi posisi) */}
            <div className="col-span-2 grid grid-cols-[40px_1fr] gap-y-3 items-start">

                {/* --- Row 1: Dependent --- */}
                <div className="flex items-center justify-center h-[70px]">
                    <Button
                        variant="outline" size="icon" className="h-7 w-7"
                        onClick={moveToDependent} disabled={!selectedVar}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="border rounded-md bg-card h-[70px] overflow-hidden flex flex-col">
                    <div className="p-1.5 border-b bg-muted/20 text-[9px] font-bold uppercase">Dependent Variable</div>
                    <div className="p-1.5 flex-1">
                        {options.dependent && (
                            <div
                                onDoubleClick={() => removeFromList(options.dependent!.id, "dependent")}
                                className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded-sm text-xs border border-primary/20"
                            >
                                {getVariableIcon(options.dependent.measure || "")}
                                <span className="truncate font-medium">{options.dependent.name}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Row 2: Factors --- */}
                <div className="flex items-center justify-center h-[145px]">
                    <Button
                        variant="outline" size="icon" className="h-7 w-7"
                        onClick={moveToFactors} disabled={!selectedVar}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex flex-col border rounded-md bg-card overflow-hidden h-[145px]">
                    <div className="p-1.5 border-b bg-muted/20 text-[9px] font-bold uppercase text-orange-600">Factors (Fixed)</div>
                    <ScrollArea className="flex-1">
                        <div className="p-1.5 space-y-1">
                            {options.factors.map((f) => (
                                <div
                                    key={f.id}
                                    onDoubleClick={() => removeFromList(f.id, "factors")}
                                    className="flex items-center gap-2 px-2 py-0.5 hover:bg-accent rounded-sm text-xs cursor-default"
                                >
                                    {getVariableIcon(f.measure || "")}
                                    <span className="truncate">{f.name}</span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* --- Row 3: Covariates --- */}
                <div className="flex items-center justify-center h-[145px]">
                    <Button
                        variant="outline" size="icon" className="h-7 w-7"
                        onClick={moveToCovariates} disabled={!selectedVar}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex flex-col border rounded-md bg-card overflow-hidden h-[145px]">
                    <div className="p-1.5 border-b bg-muted/20 text-[9px] font-bold uppercase text-blue-600">Covariates</div>
                    <ScrollArea className="flex-1">
                        <div className="p-1.5 space-y-1">
                            {options.covariates.map((c) => (
                                <div
                                    key={c.id}
                                    onDoubleClick={() => removeFromList(c.id, "covariates")}
                                    className="flex items-center gap-2 px-2 py-0.5 hover:bg-accent rounded-sm text-xs cursor-default"
                                >
                                    {getVariableIcon(c.measure || "")}
                                    <span className="truncate">{c.name}</span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
};