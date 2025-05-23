import { useState } from "react";

interface PeriodOption {
    value: string;
    label: string;
    id: string;
}

interface DifferenceOption {
    value: string;
    label: string;
}

const differences: DifferenceOption[] = [
    { value: 'level', label: 'level' },
    { value: 'first-difference', label: 'first difference' },
    { value: 'second-difference', label: 'second difference' },
];

export function useOptionHook(

) {
    const [selectedDifference, setSelectedDifference] = useState<string[]>(['level', 'level']);
    const [maximumLag, setMaximumLag] = useState<number>(16);
    const [seasonally, setSeasonally] = useState<boolean>(false);

    function handleSelectedDifference (value: string){
        const difference = differences.find(d => d.value === value);
        if (!difference) return;
        setSelectedDifference([difference.value, difference.label]);
    };

    function handleMaximumLag (value: number){
        setMaximumLag(value);
    };

    function handleSeasonally (value: boolean){
        setSeasonally(value);
    };

    const resetOptions = () => {
        setSelectedDifference(['level', 'level']);
        setMaximumLag(16);
        setSeasonally(false);
    };

    return {
        differences,
        selectedDifference,
        maximumLag,
        seasonally,
        handleSelectedDifference,
        handleMaximumLag,
        handleSeasonally,
        resetOptions,
    };
}
