export function resultStatistics(data, variables) {
    if (!data.length || !variables.length) {
        return { tables: [{ title: 'One-Sample Statistics', columnHeaders: [], rows: [] }] };
    }

    const arrays = variables.map(variable => {
        const values = data.map((row, index) => ({
            value: row[variable.name] !== "" && row[variable.name] !== null && row[variable.name] !== undefined ? 
                   parseFloat(row[variable.name]) : null
        })).filter(item => item.value !== null && !isNaN(item.value));
        
        if (values.length === 0) {
            console.warn(`No valid values found for variable ${variable.name}`);
        }
        return values;
    });

    let stats = [];

    arrays.forEach((values, index) => {
        const variable = variables[index];
        const validValues = values.map(item => item.value);
        
        const N = validValues.length;
        const meanValue = mean(validValues);
        const stdDevValue = N > 1 ? stdDev(validValues, meanValue) : 0;
        const stdErrMean = stdError(stdDevValue, N);

        stats.push({
            "rowHeader": [variable.label || variable.name],
            "N": N || "",
            "Mean": meanValue ? meanValue.toFixed(variable.decimals + 2) : "",
            "Std. Deviation": stdDevValue ? stdDevValue.toFixed(variable.decimals + 3) : "",
            "Std. Error Mean": stdErrMean ? stdErrMean.toFixed(variable.decimals + 3) : ""
        });
    });

    console.log("disini2");

    return {
        tables: [
            {
                title: "Group Statistics",
                columnHeaders: [
                    { header: "" },
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
