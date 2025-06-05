import { useState, useEffect, useCallback } from "react";
import { useMetaStore } from "@/stores/useMetaStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { TimeComponent } from "../types";
import {
    getTimeComponentsFromCase,
    formatDateForMetaStore,
    formatCurrentDates,
    createDateVariables,
    getMaxRow
} from "../dateUtils";

export const useDefineDateTime = (onClose: () => void) => {
    const { meta, setMeta } = useMetaStore();
    const { variables, addVariable, resetVariables } = useVariableStore();
    const { updateCells, data } = useDataStore();

    const casesAreOptions: string[] = [
        "Years",
        "Years, quarters",
        "Years, months",
        "Years, quarters, months",
        "Days",
        "Weeks, days",
        "Weeks, work days(5)",
        "Weeks, work days(6)",
        "Hours",
        "Days, hours",
        "Days, work hour(8)",
        "Weeks, days, hours",
        "Weeks, work days, hours",
        "Minutes",
        "Hours, minutes",
        "Days, hours, minutes",
        "Seconds",
        "Minutes, seconds",
        "Hours, minutes, seconds",
        "Not dated"
    ];
    const [selectedCase, setSelectedCase] = useState<string>("Years, quarters");

    const [timeComponents, setTimeComponents] = useState<TimeComponent[]>(() => {
        // Initialize with the default selectedCase
        return getTimeComponentsFromCase("Years, quarters");
    });

    useEffect(() => {
        const components = getTimeComponentsFromCase(selectedCase);
        setTimeComponents(components);
    }, [selectedCase]);

    const handleInputChange = useCallback((index: number, value: number) => {
        setTimeComponents(prevComponents => {
            const updatedComponents = [...prevComponents];
            updatedComponents[index] = { ...updatedComponents[index], value };
            return updatedComponents;
        });
    }, []);

    const handleOk = useCallback(async () => {
        const dateString = formatDateForMetaStore(selectedCase, timeComponents);
        setMeta({ dates: dateString });

        await createDateVariables(
            selectedCase,
            timeComponents,
            variables,
            addVariable,
            resetVariables,
            updateCells,
            getMaxRow(data)
        );
        onClose();
    }, [selectedCase, timeComponents, variables, addVariable, resetVariables, updateCells, data, setMeta, onClose]);

    const handleReset = useCallback(() => {
        setSelectedCase("Years, quarters");
        // The useEffect will then update timeComponents
    }, []);

    const currentDatesFormatted = formatCurrentDates(selectedCase, timeComponents);

    return {
        casesAreOptions,
        selectedCase,
        setSelectedCase,
        timeComponents,
        // setTimeComponents, // Not directly needed by component if only handleInputChange is used
        handleInputChange,
        handleOk,
        handleReset,
        currentDatesFormatted
    };
}; 