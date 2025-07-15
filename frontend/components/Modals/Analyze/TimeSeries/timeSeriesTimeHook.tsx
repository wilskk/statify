"use client";

import React, { useState, useEffect } from "react";
import { InputRow } from "./TimeSeriesInput";
import { useTimeSeriesStore } from "@/stores/useTimeSeriesStore";
import { getFormData, saveFormData, clearFormData } from "@/hooks/useIndexedDB";

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

export function useTimeHook(
) {
    const { getTypeDate, getYear, getMonth, getDay, getHour, getMaximumDay, getDayName, setTypeDate, setYear, setMonth, setDay, setHour } = useTimeSeriesStore();

    // Set default from store getter
    const initialType = getTypeDate();
    const initialPeriod = periods.find((p) => p.id === initialType);

    const [selectedPeriod, setSelectedPeriod] = useState<[string, string]>([
        initialPeriod?.value || "0",
        initialPeriod?.label || "Not Dated",
    ]);

    const [isLoaded, setIsLoaded] = useState(false);

    // Load data from IndexedDB on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const saved = await getFormData("TimeSeriesStore");
                if (saved) {
                    // Load selectedPeriod
                    if (saved.selectedPeriod) {
                        setSelectedPeriod(saved.selectedPeriod);
                        const period = periods.find(p => 
                            p.value === saved.selectedPeriod[0] && 
                            p.label === saved.selectedPeriod[1]
                        );
                        if (period) {
                            setTypeDate(period.id as any);
                        }
                    }
                    
                    // Load other time values
                    if (saved.year !== undefined) setYear(saved.year);
                    if (saved.month !== undefined) setMonth(saved.month);
                    if (saved.day !== undefined) setDay(saved.day);
                    if (saved.hour !== undefined) setHour(saved.hour);
                } else {
                    // Use store defaults if no saved data
                    const initialType = getTypeDate();
                    const initialPeriod = periods.find((p) => p.id === initialType);
                    if (initialPeriod) {
                        setSelectedPeriod([initialPeriod.value, initialPeriod.label]);
                    }
                }
            } catch (err) {
                console.error("Failed to load time data:", err);
            } finally {
                setIsLoaded(true);
            }
        };
        loadData();
    }, [setTypeDate, setYear, setMonth, setDay, setHour, getTypeDate]);

    // Save to IndexedDB whenever relevant state changes (but only after initial load)
    useEffect(() => {
        if (!isLoaded) return;

        const dataToSave = {
            selectedPeriod,
            year: getYear(),
            month: getMonth(),
            day: getDay(),
            hour: getHour(),
        };
        
        saveFormData("TimeSeriesStore", dataToSave).catch(console.error);
    }, [selectedPeriod, getYear, getMonth, getDay, getHour, isLoaded]);

    function handleSelectedPeriod(id: string) {
        const period = periods.find((p) => p.id === id);
        if (!period) return;
        setSelectedPeriod([period.value, period.label]);
        setTypeDate(period.id as any);
        if (period.id === 'dwh') {
            setHour(8); // Default to 8 hours for work hours
        } else {
            setHour(0); // Reset to 0 hours for other periods
        }
    }

    // function resetTime() {
    //     const p = periods.find((p) => p.id === getTypeDate());
    //     setSelectedPeriod(["0", "Not Dated"]);
    //     setTypeDate("nd");
    // }

    function resetTime() {
        clearFormData("TimeSeriesStore")
        .then(() => {
            setSelectedPeriod(["0", "Not Dated"]);
            setTypeDate("nd");
            setYear(2025);
            setMonth(1);
            setDay(1);
            setHour(0);
        })
        .catch((e) => console.error("Failed to clear time data:", e));
    }

    function inputPeriods(period: string) {
        switch (period) {
            case 'y': case 'ys': case 'yq':
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
            case 'ym':
                return (
                    <div className="flex flex-col gap-4">
                        <InputRow
                            label="year" 
                            id="year" 
                            value={getYear()} 
                            min={'1900'} 
                            max={'2050'} 
                            step={'1'} 
                            onChange={(value) => setYear(value)}
                        />
                        <InputRow
                            label="month" 
                            id="month" 
                            value={getMonth()} 
                            min={'1'} 
                            max={'12'} 
                            step={'1'} 
                            onChange={(value) => setMonth(value)}
                        />
                    </div>
                );
            case 'wwd5': case 'wwd6': case 'wd':
                return (
                    <div className="flex flex-col gap-4">
                        <InputRow
                            label="year" 
                            id="year" 
                            value={getYear()} 
                            min={'1900'} 
                            max={'2050'} 
                            step={'1'} 
                            onChange={(value) => setYear(value)}
                        />
                        <InputRow
                            label="month" 
                            id="month" 
                            value={getMonth()} 
                            min={'1'} 
                            max={'12'} 
                            step={'1'} 
                            onChange={(value) => setMonth(value)}
                        />
                        <InputRow
                            label="day" 
                            id="day" 
                            value={getDay()} 
                            min={'1'} 
                            max={`${getMaximumDay()}`} 
                            step={'1'} 
                            onChange={(value) => setDay(value)}
                        />
                    </div>
                );
            case 'dwh':
                return (
                    <div className="flex flex-col gap-4">
                        <InputRow
                            label="year" 
                            id="year" 
                            value={getYear()} 
                            min={'1900'} 
                            max={'2050'} 
                            step={'1'} 
                            onChange={(value) => setYear(value)}
                        />
                        <InputRow
                            label="month" 
                            id="month" 
                            value={getMonth()} 
                            min={'1'} 
                            max={'12'} 
                            step={'1'} 
                            onChange={(value) => setMonth(value)}
                        />
                        <InputRow
                            label="day" 
                            id="day" 
                            value={getDay()} 
                            min={'1'} 
                            max={`${getMaximumDay()}`} 
                            step={'1'} 
                            onChange={(value) => setDay(value)}
                        />
                        <InputRow
                            label="hour" 
                            id="hour" 
                            value={getHour()} 
                            min={'8'} 
                            max={'15'} 
                            step={'1'} 
                            onChange={(value) => setHour(value)}
                        />
                    </div>
                );
            case 'dh':
                return (
                    <div className="flex flex-col gap-4">
                        <InputRow
                            label="year" 
                            id="year" 
                            value={getYear()} 
                            min={'1900'} 
                            max={'2050'} 
                            step={'1'} 
                            onChange={(value) => setYear(value)}
                        />
                        <InputRow
                            label="month" 
                            id="month" 
                            value={getMonth()} 
                            min={'1'} 
                            max={'12'} 
                            step={'1'} 
                            onChange={(value) => setMonth(value)}
                        />
                        <InputRow
                            label="day" 
                            id="day" 
                            value={getDay()} 
                            min={'1'} 
                            max={`${getMaximumDay()}`} 
                            step={'1'} 
                            onChange={(value) => setDay(value)}
                        />
                        <InputRow
                            label="hour" 
                            id="hour" 
                            value={getHour()} 
                            min={'0'} 
                            max={'23'} 
                            step={'1'} 
                            onChange={(value) => setHour(value)}
                        />
                    </div>
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
