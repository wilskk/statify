"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Info } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface OptionsTabProps {
    referenceCategory: string; // "first", "last", atau value kategori tertentu
    onChange: (value: string) => void;
    dependentVariable: any; // Untuk mendapatkan daftar kategori jika ingin custom
}

export const OptionsTab: React.FC<OptionsTabProps> = ({
    referenceCategory,
    onChange,
    dependentVariable
}) => {
    return (
        <div className="space-y-6 p-1">
            {/* 1. Reference Category Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold">Reference Category</h4>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs text-xs">
                                    Kategori yang akan digunakan sebagai pembanding untuk kategori lainnya dalam model.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <RadioGroup
                    value={["first", "last"].includes(referenceCategory) ? referenceCategory : "custom"}
                    onValueChange={(val) => val !== "custom" && onChange(val)}
                    className="grid gap-3"
                >
                    <div className="flex items-center space-x-3">
                        <RadioGroupItem value="first" id="first" />
                        <Label htmlFor="first" className="text-sm font-normal">First category</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                        <RadioGroupItem value="last" id="last" />
                        <Label htmlFor="last" className="text-sm font-normal">Last category (Default)</Label>
                    </div>

                    <div className="flex items-center space-x-3">
                        <RadioGroupItem value="custom" id="custom" />
                        <Label htmlFor="custom" className="text-sm font-normal mr-2">Custom category:</Label>
                        <Select
                            disabled={!dependentVariable}
                            onValueChange={(val) => onChange(val)}
                            value={!["first", "last"].includes(referenceCategory) ? referenceCategory : ""}
                        >
                            <SelectTrigger className="w-[180px] h-8 text-xs">
                                <SelectValue placeholder="Pilih kategori..." />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Mapping kategori dari dependentVariable.values jika tersedia */}
                                {dependentVariable?.values?.map((cat: any) => (
                                    <SelectItem key={cat.value} value={String(cat.value)}>
                                        {cat.label || cat.value}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </RadioGroup>
            </div>

            <Separator />

            {/* 2. Model Opsi lainnya (Display & Algorithm) */}
            <div className="space-y-4">
                <h4 className="text-sm font-semibold">Interaction/Probability</h4>
                <div className="grid grid-cols-1 gap-4 bg-muted/20 p-3 rounded-md border border-dashed">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Intercept</p>
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" checked readOnly className="rounded border-gray-300" />
                            <span className="text-sm">Include intercept in model</span>
                        </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground italic">
                        Catatan: Estimasi parameter untuk setiap kategori dilakukan secara simultan menggunakan kernel optimasi Newton-Raphson di Rust.
                    </p>
                </div>
            </div>

            {/* Footer Alert */}
            {!dependentVariable && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start gap-3">
                    <div className="text-amber-600 mt-0.5">⚠️</div>
                    <p className="text-[11px] text-amber-700 leading-tight">
                        Pilih <strong>Dependent Variable</strong> di tab Model/Vars terlebih dahulu untuk mengaktifkan opsi kategori referensi kustom.
                    </p>
                </div>
            )}
        </div>
    );
};