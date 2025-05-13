export function resultGroup(data, dataGrouping, variables, variablesGrouping, defineGroups, group1, group2, cutPointValue) {
    if (!data.length || !variables.length) {
        return { tables: [{ title: 'Group Statistics', columnHeaders: [], rows: [] }] };
    }

    const arrays = variables.map(variable => {
        const values = data.map((row, index) => ({
            value: row[variable.name] !== "" && row[variable.name] !== null && row[variable.name] !== undefined ? 
                   parseFloat(row[variable.name]) : null
        }))
        
        if (values.length === 0) {
            console.warn(`No valid values found for variable ${variable.name}`);
        }
        return values;
    });

    const arraysGrouping = dataGrouping.map((row, index) => ({
        value: row[variablesGrouping.name] !== "" && row[variablesGrouping.name] !== null && row[variablesGrouping.name] !== undefined ? 
               parseFloat(row[variablesGrouping.name]) : null
    }))

    console.log("arrays", JSON.stringify(arrays));
    console.log("arraysGrouping", JSON.stringify(arraysGrouping));

    // Use separateDataByGroups to get the grouped data
    const groupedData = separateDataByGroups(arrays, arraysGrouping, variables, variablesGrouping, defineGroups, group1, group2, cutPointValue);
    console.log("disini");
    console.log("groupedData", JSON.stringify(groupedData));
    let stats = [];

    Object.keys(groupedData).forEach(key => {
        const [variableName, group] = key.split("|");
        const variable = variables.find(v => v.name === variableName);
        let values = groupedData[key].filter(value => value !== null && !isNaN(value));
        
        let N = values.length;
        let meanValue = mean(values);
        let stdDevValue = values.length > 1 ? stdDev(values, meanValue) : 0;
        let stdErrMean = stdError(stdDevValue, N);

        stats.push({
            "rowHeader": [variable.label || variable.name],
            [variablesGrouping.label || variablesGrouping.name]: group,
            "N": N || "",
            "Mean": meanValue ? meanValue.toFixed(3) : "",
            "Std. Deviation": stdDevValue ? stdDevValue.toFixed(3) : "",
            "Std. Error Mean": stdErrMean ? stdErrMean.toFixed(3) : ""
        });
    });

    console.log("disini2");

    return {
        tables: [
            {
                title: "Group Statistics",
                columnHeaders: [
                    { header: "" },
                    { header: variablesGrouping.label || variablesGrouping.name },
                    { header: "N" },
                    { header: "Mean" },
                    { header: "Std. Deviation" },
                    { header: "Std. Error Mean" }
                ],
                rows: stats
            }
        ]
    };
}

export function separateDataByGroups(data, dataGrouping, variables, variablesGrouping, defineGroups, group1, group2, cutPointValue) {
    const groupedData = {};
    const SEPARATOR = "|";
    
    // Initialize empty arrays for all possible keys
    if (defineGroups.useSpecifiedValues) {
        variables.forEach(variable => {
            const group1Label = variablesGrouping.values.find(v => v.value === group1)?.label || group1;
            const group2Label = variablesGrouping.values.find(v => v.value === group2)?.label || group2;
            groupedData[`${variable.name}${SEPARATOR}${group1Label}`] = [];
            groupedData[`${variable.name}${SEPARATOR}${group2Label}`] = [];
        });

        dataGrouping.forEach((groupValue, index) => {
            const group1Label = variablesGrouping.values.find(v => v.value === group1)?.label || group1;
            const group2Label = variablesGrouping.values.find(v => v.value === group2)?.label || group2;
            
            if (groupValue.value === group1) {
                data.forEach((dataRow, i) => {
                    if (dataRow[index] && dataRow[index].value !== undefined) {
                        const key = `${variables[i].name}${SEPARATOR}${group1Label}`;
                        groupedData[key].push(dataRow[index].value);
                    }
                });
            } else if (groupValue.value === group2) {
                data.forEach((dataRow, i) => {
                    if (dataRow[index] && dataRow[index].value !== undefined) {
                        const key = `${variables[i].name}${SEPARATOR}${group2Label}`;
                        groupedData[key].push(dataRow[index].value);
                    }
                });
            }
        });
    } else if (defineGroups.cutPoint) {
        // Initialize arrays for cutPoint groups
        variables.forEach(variable => {
            groupedData[`${variable.name}${SEPARATOR}>=${cutPointValue}`] = [];
            groupedData[`${variable.name}${SEPARATOR}<${cutPointValue}`] = [];
        });

        dataGrouping.forEach((groupValue, index) => {
            if (groupValue.value >= cutPointValue) {
                data.forEach((dataRow, i) => {
                    if (dataRow[index] && dataRow[index].value !== undefined) {
                        const key = `${variables[i].name}${SEPARATOR}>=${cutPointValue}`;
                        groupedData[key].push(dataRow[index].value);
                    }
                });
            } else {
                data.forEach((dataRow, i) => {
                    if (dataRow[index] && dataRow[index].value !== undefined) {
                        const key = `${variables[i].name}${SEPARATOR}<${cutPointValue}`;
                        groupedData[key].push(dataRow[index].value);
                    }
                });
            }
        });
    }

    return groupedData;
}

function mean(arr) {
    return arr.reduce((sum, x) => sum + x, 0) / arr.length;
}

function stdDev(arr, meanValue) {
    const sumSq = arr.reduce((sum, x) => sum + Math.pow(x - meanValue, 2), 0);
    return Math.sqrt(sumSq / (arr.length - 1));
}

function stdError(sd, n) {
    return sd / Math.sqrt(n);
}
