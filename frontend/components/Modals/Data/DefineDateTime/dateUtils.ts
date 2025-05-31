export interface TimeComponent {
    name: string;
    value: number;
    periodicity?: number;
}

export const getTimeComponentsFromCase = (selectedCase: string): TimeComponent[] => {
    const components: TimeComponent[] = [];

    if (selectedCase.includes("Years")) {
        components.push({ name: "Year", value: 1900 });
    }

    if (selectedCase.includes("quarters")) {
        components.push({ name: "Quarter", value: 1, periodicity: 4 });
    }

    if (selectedCase.includes("months")) {
        components.push({ name: "Month", value: 1, periodicity: 12 });
    }

    if (selectedCase.includes("Weeks")) {
        components.push({ name: "Week", value: 1 });
    }

    if (selectedCase === "Days") {
        components.push({ name: "Day", value: 1 });
    } else if (selectedCase.startsWith("Days,")) {
        components.push({ name: "Day", value: 1 });
    } else if (selectedCase.includes("work days")) {
        if (selectedCase.includes("work days(6)")) {
            components.push({ name: "Work day", value: 1, periodicity: 6 });
        } else {
            components.push({ name: "Work day", value: 1, periodicity: 5 });
        }
    } else if (
        selectedCase.includes("days") &&
        !selectedCase.includes("work hour")
    ) {
        if (selectedCase.includes("Weeks")) {
            components.push({ name: "Day", value: 1, periodicity: 7 });
        } else {
            components.push({ name: "Day", value: 1 });
        }
    }

    if (selectedCase.includes("work hour(8)")) {
        components.push({ name: "Work hour", value: 1, periodicity: 8 });
    } else if (selectedCase.includes("work hour")) {
        components.push({ name: "Work hour", value: 1, periodicity: 8 });
    } else if (
        selectedCase.includes("Hours") ||
        selectedCase.includes("hours")
    ) {
        if (selectedCase.includes("Days") || selectedCase.includes("days")) {
            components.push({ name: "Hour", value: 0, periodicity: 24 });
        } else {
            components.push({ name: "Hour", value: 0 });
        }
    }

    if (
        selectedCase.includes("Minutes") ||
        selectedCase.includes("minutes")
    ) {
        if (selectedCase.includes("Hours") || selectedCase.includes("hours")) {
            components.push({ name: "Minute", value: 0, periodicity: 60 });
        } else {
            components.push({ name: "Minute", value: 0 });
        }
    }

    if (
        selectedCase.includes("Seconds") ||
        selectedCase.includes("seconds")
    ) {
        if (
            selectedCase.includes("Minutes") ||
            selectedCase.includes("minutes")
        ) {
            components.push({ name: "Second", value: 0, periodicity: 60 });
        } else {
            components.push({ name: "Second", value: 0 });
        }
    }

    return components;
};

export const formatDateForMetaStore = (
    selectedCase: string,
    timeComponents: TimeComponent[]
): string => {
    if (selectedCase === "Not dated") return "";

    return timeComponents
        .map((component) => {
            const periodicityStr = component.periodicity ? `;${component.periodicity}` : "";
            return `${component.name}(${component.value}${periodicityStr})`;
        })
        .join("");
};

export const getDateFormatString = (timeComponents: TimeComponent[]): string => {
    if (timeComponents.length === 0) return "";

    const formatParts: string[] = [];

    const hasYear = timeComponents.some((c) => c.name === "Year");
    const hasQuarter = timeComponents.some((c) => c.name === "Quarter");
    const hasMonth = timeComponents.some((c) => c.name === "Month");
    const hasWeek = timeComponents.some((c) => c.name === "Week");
    const hasDay =
        timeComponents.some((c) => c.name === "Day") ||
        timeComponents.some((c) => c.name === "Work day");
    const hasHour =
        timeComponents.some((c) => c.name === "Hour") ||
        timeComponents.some((c) => c.name === "Work hour");
    const hasMinute = timeComponents.some((c) => c.name === "Minute");
    const hasSecond = timeComponents.some((c) => c.name === "Second");

    if (hasYear) {
        if (hasQuarter && hasMonth) {
            formatParts.push("YYYY-QQ-MM");
        } else if (hasQuarter) {
            formatParts.push("YYYY-QQ");
        } else if (hasMonth) {
            formatParts.push("YYYY-MM");
        } else {
            formatParts.push("YYYY");
        }
    } else if (hasWeek) {
        if (hasDay) {
            formatParts.push("WW-D");
        } else {
            formatParts.push("WW");
        }
    } else if (hasDay) {
        formatParts.push("DD");
    }

    if (hasHour) {
        if (hasMinute) {
            if (hasSecond) {
                formatParts.push("HH:MM:SS");
            } else {
                formatParts.push("HH:MM");
            }
        } else {
            formatParts.push("HH");
        }
    } else if (hasMinute) {
        if (hasSecond) {
            formatParts.push("MM:SS");
        } else {
            formatParts.push("MM");
        }
    } else if (hasSecond) {
        formatParts.push("SS");
    }

    return formatParts.join(" ");
};

export const formatDateString = (
    values: Record<string, number>,
    timeComponents: TimeComponent[]
): string => {
    const componentNames = timeComponents.map((c) => c.name.toLowerCase());
    const parts: string[] = [];

    if (componentNames.includes("day") || componentNames.includes("work day")) {
        const dayValue = values["day"] || values["work day"];
        parts.push(dayValue.toString());
    } else if (componentNames.includes("week")) {
        parts.push(values["week"].toString());
    } else if (componentNames.includes("year")) {
        parts.push(values["year"].toString());

        if (componentNames.includes("quarter")) {
            parts[parts.length - 1] += `-Q${values["quarter"]}`;
        }

        if (componentNames.includes("month")) {
            parts[parts.length - 1] += `-${values["month"].toString().padStart(2, "0")}`;
        }
    }

    const timeParts: string[] = [];

    if (componentNames.includes("hour") || componentNames.includes("work hour")) {
        timeParts.push((values["hour"] || values["work hour"]).toString());
    }

    if (componentNames.includes("minute")) {
        timeParts.push(values["minute"].toString().padStart(2, "0"));
    }

    if (componentNames.includes("second")) {
        timeParts.push(values["second"].toString().padStart(2, "0"));
    }

    if (timeParts.length > 0) {
        if (timeParts.length === 2) {
            parts.push(`${timeParts[0]}:${timeParts[1]}`);
        }
        else if (timeParts.length === 3) {
            parts.push(`${timeParts[0]}:${timeParts[1]}:${timeParts[2]}`);
        }
        else {
            parts.push(timeParts[0]);
        }
    }

    return parts.join("  ");
};

export const formatCurrentDates = (
    selectedCase: string,
    timeComponents: TimeComponent[]
): string => {
    if (selectedCase === "Not dated") return "Not dated";

    return timeComponents
        .map((component) => {
            const periodicityStr = component.periodicity ? `(${component.periodicity})` : "";
            return `${component.name}(${component.value})${periodicityStr}`;
        })
        .join("");
};

export const getMaxRow = (data: any[]): number => {
    return data.length > 0 ? data.length - 1 : 0;
};

export const generateSampleData = async (
    timeComponents: TimeComponent[],
    createdVariables: any[],
    updateCells: (updates: { row: number; col: number; value: any }[]) => Promise<void>,
    existingRowCount: number
): Promise<void> => {
    const rowCount = existingRowCount > 0 ? existingRowCount : 20;
    const updates: { row: number; col: number; value: any }[] = [];

    const variableMap = createdVariables.reduce((map, variable) => {
        map[variable.name] = variable;
        return map;
    }, {} as Record<string, any>);

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        const currentValues: Record<string, number> = {};

        timeComponents.forEach((component) => {
            currentValues[component.name.toLowerCase()] = component.value;
        });

        if (rowIndex > 0) {
            let carry = rowIndex;

            for (let i = timeComponents.length - 1; i >= 0; i--) {
                const component = timeComponents[i];
                const name = component.name.toLowerCase();

                if (component.periodicity) {
                    const baseValue = component.value;
                    const addedValue = carry % component.periodicity;
                    const periodicValue = ((baseValue - 1 + addedValue) % component.periodicity) + 1;

                    currentValues[name] = periodicValue;

                    carry = Math.floor((baseValue - 1 + carry) / component.periodicity);

                    if (carry === 0) break;
                } else {
                    currentValues[name] = component.value + carry;
                    carry = 0;
                    break;
                }
            }
        }

        timeComponents.forEach((component) => {
            const variableName = `${component.name.toUpperCase()}_`;
            const variableColIndex = variableMap[variableName]?.columnIndex;

            if (variableColIndex !== undefined) {
                updates.push({
                    row: rowIndex,
                    col: variableColIndex,
                    value: currentValues[component.name.toLowerCase()],
                });
            }
        });

        const dateColIndex = variableMap["DATE_"]?.columnIndex;
        if (dateColIndex !== undefined) {
            const dateString = formatDateString(currentValues, timeComponents);
            updates.push({
                row: rowIndex,
                col: dateColIndex,
                value: dateString,
            });
        }
    }

    if (updates.length > 0) {
        await updateCells(updates);
    }
};

export const createDateVariables = async (
    selectedCase: string,
    timeComponents: TimeComponent[],
    variables: any[],
    addVariable: (variable: any) => Promise<void>,
    resetVariables: () => Promise<void>,
    updateCells: (updates: { row: number; col: number; value: any }[]) => Promise<void>,
    existingRowCount: number
): Promise<void> => {
    if (selectedCase === "Not dated") {
        await resetVariables();
        return;
    }

    let startColumnIndex = variables.length;
    const variablesToCreate: any[] = [];

    for (const component of timeComponents) {
        const variableName = `${component.name.toUpperCase()}_`;

        let variableLabel = component.name.toUpperCase();
        if (component.periodicity) {
            variableLabel += `, period ${component.periodicity}`;
        } else {
            variableLabel += ", not periodic";
        }

        const newVariable = {
            columnIndex: startColumnIndex++,
            name: variableName,
            type: "NUMERIC",
            width: 8,
            decimals: 0,
            label: variableLabel,
            columns: 64,
            align: "right",
            measure: "scale",
            role: "input",
        };

        variablesToCreate.push(newVariable);
    }

    const dateFormatString = getDateFormatString(timeComponents);

    const dateVariable = {
        columnIndex: startColumnIndex,
        name: "DATE_",
        type: "STRING",
        width: 20,
        decimals: 0,
        label: `Date. Format: ${dateFormatString}`,
        columns: 64,
        align: "left",
        measure: "nominal",
        role: "input",
    };

    variablesToCreate.push(dateVariable);

    for (const variable of variablesToCreate) {
        await addVariable(variable);
    }

    await generateSampleData(timeComponents, variablesToCreate, updateCells, existingRowCount);
};