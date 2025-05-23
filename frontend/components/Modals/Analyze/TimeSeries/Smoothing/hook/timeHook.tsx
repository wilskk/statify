"use client";

import React, { useState, useEffect } from "react";
import { InputRow } from "../../TimeSeriesInput";
import { useTimeSeriesStore } from "@/stores/useTimeSeriesStore";

interface PeriodOption {
    value: string;
    label: string;
    id: string;
}

const periods: PeriodOption[] = [
    { value: '0', label: 'Years', id: 'y'},
    { value: '2', label: 'Years-Semesters', id: 'ys'},
    { value: '4', label: 'Years-Quarters', id: 'yq'},
    { value: '12', label: 'Years-Months', id: 'ym'},
    { value: '5', label: 'Weeks-Work Days(5)', id: 'wwd5'},
    { value: '6', label: 'Weeks-Work Days(6)', id: 'wwd6'},
    { value: '7', label: 'Weeks-Days', id: 'wd'},
    { value: '8', label: 'Days-Work Hours(8)', id: 'dwh'},
    { value: '24', label: 'Days-Hour', id: 'dh'},
    { value: '0', label: 'Not Dated', id: 'nd'},
];

export function timeHook(
) {
    const { getTypeDate, getYear, getWeek, getDay, setTypeDate, setYear, setWeek, setDay } = useTimeSeriesStore();
    // Set default from store getter
    const initialType = getTypeDate();
    const initialPeriod = periods.find((p) => p.id === initialType);

    const [selectedPeriod, setSelectedPeriod] = useState<[string, string]>([
        initialPeriod?.value || "0",
        initialPeriod?.label || "Not Dated",
    ]);

    function handleSelectedPeriod(id: string) {
        const period = periods.find((p) => p.id === id);
        if (!period) return;
        setSelectedPeriod([period.value, period.label]);
        setTypeDate(period.id as any);
    }

    function resetTime() {
        const p = periods.find((p) => p.id === getTypeDate());
        setSelectedPeriod(["0", "Not Dated"]);
        setTypeDate("nd");
    }

    function inputPeriods(period: string) {
        switch (period) {
            case 'y': case 'ys': case 'yq': case 'ym':
                return (
                    <InputRow
                        label="year" 
                        id="year" 
                        value={getYear()} 
                        min={'1900'} 
                        max={'2050'} 
                        step={'1'} 
                        onChange={(value) => setYear(value)}
                    />
                );
            case 'wwd5': case 'wwd6': case 'wd':
                return (
                    <InputRow
                        label="week" 
                        id="week" 
                        value={getWeek()} 
                        min={'1'} 
                        max={'52'} 
                        step={'1'} 
                        onChange={(value) => setWeek(value)}
                    />
                );
            case 'dwh': case 'dh':
                return (
                    <InputRow
                        label="day" 
                        id="day" 
                        value={getDay()} 
                        min={'1'} 
                        max={'31'} 
                        step={'1'} 
                        onChange={(value) => setDay(value)}
                    />
                );
            default:
                return (<div></div>);
        }
    }

    return { 
        periods,
        selectedPeriod, 
        initialType,
        handleSelectedPeriod, 
        resetTime,
        inputPeriods
    };
}
