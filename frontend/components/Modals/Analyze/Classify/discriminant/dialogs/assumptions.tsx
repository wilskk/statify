import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Label } from "@/components/ui/label";
import type { DiscriminantAssumptionsType } from "@/components/Modals/Analyze/Classify/discriminant/types/discriminant";

type Props = {
    updateFormData: (field: keyof DiscriminantAssumptionsType, value: boolean) => void;
    data: DiscriminantAssumptionsType;
};

const ASSUMPTION_OPTIONS: {
    field: keyof DiscriminantAssumptionsType;
    label: string;
    description: string;
}[] = [
    {
        field: "Multicollinearity",
        label: "Multikolinearitas (Tolerance / VIF)", 
        description:
            "Nilai tolerance dan VIF untuk tiap variabel bebas. Menandai variabel yang terlalu kuat saling berkorelasi.",
    },
    {
        field: "MultivariateNormality",
        label: "Normalitas multivariat (uji Henze-Zirkler)",
        description:
            "Uji Henze–Zirkler untuk normalitas multivariat pada keseluruhan data — asumsi normalitas formal pada analisis diskriminan.",
    },
    {
        field: "UnivariateNormality",
        label: "Normalitas univariat (uji Anderson-Darling)",
        description:
            "Uji Anderson–Darling untuk normalitas tiap variabel bebas pada keseluruhan data.",
    },
];

export const DiscriminantAssumptions = ({ updateFormData, data }: Props) => {
    const assumptionsState = data;

    const handleChange =
        (field: keyof DiscriminantAssumptionsType) => (checked: CheckedState) => {
            updateFormData(field, checked === true);
        };

    return (
        <div className="flex flex-col gap-3">
            <Label className="font-bold">Assumptions Test</Label>
            <p className="text-xs text-muted-foreground">
                Here is the assumptions that need to be reached so the 
                discriminant analysis will be valid.
            </p>
            <div className="flex flex-col gap-3 rounded-lg border p-3">
                {ASSUMPTION_OPTIONS.map((opt) => (
                    <div key={opt.field} className="flex items-start space-x-2">
                        <Checkbox
                            id={opt.field}
                            checked={assumptionsState[opt.field]}
                            onCheckedChange={handleChange(opt.field)}
                            className="mt-1"
                        />
                        <div className="flex flex-col">
                            <label
                                htmlFor={opt.field}
                                className="text-sm font-medium leading-none"
                            >
                                {opt.label}
                            </label>
                            <span className="text-xs text-muted-foreground">
                                {opt.description}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
