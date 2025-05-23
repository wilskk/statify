import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface DecompositionMethod {
    value: string;
    label: string;
}

interface TrendedMethod {
    value: string;
    label: string;
}

const decompositionMethods: DecompositionMethod[] = [
    { value: 'additive', label: 'additive' },
    { value: 'multiplicative', label: 'multiplicative' },
];

const trendedMethods: TrendedMethod[] = [
    { value: 'linear', label: 'Linear' },
    { value: 'exponential', label: 'Exponential' },
];

export function useOptionHook(
) {
    const [selectedDecompositionMethod, setSelectedDecompositionMethod] = useState<string[]>([
        'additive',
        'additive',
    ]);

    const [selectedTrendedMethod, setSelectedTrendedMethod] = useState<string[]>([
        'linear',
        'Linear'
    ]);

    function handleSelectedDecompositionMethod(method: string) {
        setSelectedDecompositionMethod([
            method,
            decompositionMethods.find(m => m.value === method)?.label || ''
        ]);
    }

    function handleSelectedTrendedMethod(method: string) {
        setSelectedTrendedMethod([
            method,
            trendedMethods.find(m => m.value === method)?.label || ''
        ]);
    }

    function inputSelectedDecompositionMethod(method: string) {
        switch (method) {
        case 'multiplicative':
            return (
                <div className="flex flex-col gap-4">
                    <Label className="w-[120px]">trend: </Label>
                    <RadioGroup
                        value={selectedTrendedMethod[0]}
                        onValueChange={(value) => handleSelectedTrendedMethod(value)}
                        className="flex flex-row gap-4"
                    >
                        {trendedMethods.map((method) => (
                            <div key={method.value} className="flex flex-row items-center space-x-2">
                                <RadioGroupItem
                                    value={method.value}
                                    id={method.value}
                                    className="w-4 h-4"
                                />
                                <label htmlFor={method.value} className="text-sm font-medium text-gray-700">
                                    {method.label}
                                </label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            );
        default:
            return (<div></div>);
        }
    }

    function resetOptions() {
        setSelectedDecompositionMethod(['additive', 'additive']);
        setSelectedTrendedMethod(['linear', 'Linear']);
    }

    return {
        selectedDecompositionMethod,
        selectedTrendedMethod,
        decompositionMethods,
        trendedMethods,
        handleSelectedDecompositionMethod,
        inputSelectedDecompositionMethod,
        resetOptions
    };
}
