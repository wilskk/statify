"use client";

import React, { useState, useEffect } from "react";
import { InputRow } from "../../TimeSeriesInput";

type MethodParameters = {
    [key: string]: number[];
};

interface SmoothingMethod {
    value: string;
    label: string;
}

const defaultParameters: MethodParameters = {
    sma: [2, 0, 0],
    dma: [2, 0, 0],
    ses: [0.1, 0, 0],
    des: [0.1, 0, 0],
    holt: [0.1, 0.1, 0],
    winter: [0.1, 0.1, 0.1],
};

const methods: SmoothingMethod[] = [
    { value: 'sma', label: 'Simple Moving Average' },
    { value: 'dma', label: 'Double Moving Average' },
    { value: 'ses', label: 'Simple Exponential Smoothing' },
    { value: 'des', label: 'Double Exponential Smoothing' },
    { value: 'holt', label: 'Holt\'s Method Exponential Smoothing' },
    { value: 'winter', label: 'Winter\'s Method Exponential Smoothing' },
];

export function optionHook(
    initialMethod: SmoothingMethod = { value: "sma", label: "Simple Moving Average" }
    ) {
    const [selectedMethod, setSelectedMethod] = useState<[string, string]>([
        initialMethod.value,
        initialMethod.label,
    ]);
    const [parameters, setParameters] = useState<number[]>(defaultParameters[initialMethod.value]);

    useEffect(() => {
        if (selectedMethod[0] && defaultParameters[selectedMethod[0]]) {
        setParameters([...defaultParameters[selectedMethod[0]]]);
        } else {
        setParameters([]);
        }
    }, [selectedMethod]);

    function handleSelectedMethod(value: string, methods: SmoothingMethod[]) {
        const methodLabel = methods.find((m) => m.value === value)?.label || "";
        setSelectedMethod([value, methodLabel]);
    }

    // Prepare input parameters UI based on selected method
    function inputParameters(method: string) {
        switch (method) {
            case 'sma': case 'dma':
                return (
                    <InputRow 
                        label="distance" 
                        id="par1" 
                        value={parameters[0]} 
                        min={'2'} 
                        max={'11'} 
                        step={'1'} 
                        onChange={(value) => handleInputChange(0, value)} 
                    />
                );
            case 'ses': case 'des':
                return (
                    <InputRow 
                        label="alpha" 
                        id="par1" 
                        value={parameters[0]} 
                        min={'0.1'} 
                        max={'0.9'} 
                        step={'0.1'} 
                        onChange={(value) => handleInputChange(0, value)} 
                    />
                );
            case 'holt':
                return (
                    <div className="flex flex-row gap-2">
                        <InputRow 
                            label="alpha" 
                            id="par1" 
                            value={parameters[0]} 
                            min={'0.1'} 
                            max={'0.9'} 
                            step={'0.1'} 
                            onChange={(value) => handleInputChange(0, value)} 
                        />
                        <InputRow 
                            label="beta" 
                            id="par2" 
                            value={parameters[1]} 
                            min={'0.1'} 
                            max={'0.9'} 
                            step={'0.1'} 
                            onChange={(value) => handleInputChange(1, value)} 
                        />
                    </div>
                );
            case 'winter':
                return (
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-row gap-2">
                            <InputRow 
                                label="alpha" 
                                id="par1" 
                                value={parameters[0]} 
                                min={'0.1'} 
                                max={'0.9'} 
                                step={'0.1'} 
                                onChange={(value) => handleInputChange(0, value)} 
                            />
                            <InputRow 
                                label="beta" 
                                id="par2" 
                                value={parameters[1]} 
                                min={'0.1'} 
                                max={'0.9'} 
                                step={'0.1'} 
                                onChange={(value) => handleInputChange(1, value)} 
                            />
                            <InputRow 
                                label="gamma" 
                                id="par3" 
                                value={parameters[2]} 
                                min={'0.1'} 
                                max={'0.9'} 
                                step={'0.1'} 
                                onChange={(value) => handleInputChange(2, value)} 
                            />
                        </div>
                        <div className="flex flex-col mt-2 gap-2">
                            <label className="w-full text-sm font-semibold">note:</label>
                            <label className="w-full text-sm font-semibold">winters method need time spesification with periodicity</label>
                        </div>
                    </div>
                );
            default:
                return (<div></div>);
        }
    };

    function handleInputChange(index: number, value: number) {
        setParameters((prev) => {
        if (index < 0 || index >= prev.length) return prev;
        const copy = [...prev];
        copy[index] = value;
        return copy;
        });
    }

    function resetOptions() {
        setSelectedMethod(["sma", "Simple Moving Average"]);
        setParameters(defaultParameters["sma"]);
    }

    return {
        selectedMethod,
        parameters,
        methods,
        inputParameters,
        setSelectedMethod,
        handleSelectedMethod,
        handleInputChange,
        resetOptions,
    };
}