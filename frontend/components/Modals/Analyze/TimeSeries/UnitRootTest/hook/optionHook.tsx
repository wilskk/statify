import { useState } from "react";

interface UnitRootMethod {
    value: string;
    label: string;
}

interface DifferenceOption {
    value: string;
    label: string;
}

interface EquationOption {
    value: string;
    label: string;
}

const methods: UnitRootMethod[] = [
    { value: 'dickey-fuller', label: 'dickey-fuller' },
    { value: 'augmented-dickey-fuller', label: 'augmented dickey-fuller' },
];

const differences: DifferenceOption[] = [
    { value: 'level', label: 'level' },
    { value: 'first-difference', label: 'first difference' },
    { value: 'second-difference', label: 'second difference' },
];

const equations: EquationOption[] = [
    { value: 'no_constant', label: 'none' },
    { value: 'no_trend', label: 'intercept' },
    { value: 'with_trend', label: 'trend and intercept' },
];

export function useOptionHook(
) {
    const [selectedMethod, setSelectedMethod] = useState<string[]>([methods[0].value, methods[0].label]);
    const [selectedDifference, setSelectedDifference] = useState<string[]>([differences[0].value, differences[0].label]);
    const [selectedEquation, setSelectedEquation] = useState<string[]>([equations[1].value, equations[1].label]); // default intercept
    const [lengthLag, setLengthLag] = useState<number>(1);

    function handleMethodChange(value: string) {
        const label = methods.find(m => m.value === value)?.label || '';
        setSelectedMethod([value, label]);
        setSelectedEquation([equations[1].value, equations[1].label]); // reset equation to intercept when method changes
    };

    function handleDifferenceChange(value: string) {
        const label = differences.find(d => d.value === value)?.label || '';
        setSelectedDifference([value, label]);
    };

    function handleEquationChange(value: string) {
        const label = equations.find(e => e.value === value)?.label || '';
        setSelectedEquation([value, label]);
    };

    function handleLengthLag(value: number) {
        setLengthLag(value);
    }

    const resetOptions = () => {
        setSelectedMethod([methods[0].value, methods[0].label]);
        setSelectedDifference([differences[0].value, differences[0].label]);
        setSelectedEquation([equations[1].value, equations[1].label]);
        setLengthLag(1);
    };

    return {
        methods,
        differences,
        equations,
        selectedMethod,
        selectedDifference,
        selectedEquation,
        lengthLag,
        handleMethodChange,
        handleDifferenceChange,
        handleEquationChange,
        handleLengthLag,
        resetOptions,
    };
}
