import stdlibstatsBaseDistsTCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-t-cdf@0.2.2/+esm'
import stdlibstatsBaseDistsTQuantile from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-t-quantile@0.2.2/+esm'

export function resultTest(data, variables, testValue) {
    if (!data.length || !variables.length) {
        return { tables: [{ title: 'One-Sample Test', columnHeaders: [], rows: [] }] };
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

    let rows = [];
    console.log("disini");

    arrays.forEach((values, index) => {
        const variable = variables[index];
        const validValues = values.map(item => item.value);
        const n = validValues.length;
        if (n === 0) return;
        const meanValue = mean(validValues);
        const stdDevValue = stdDev(validValues, meanValue);
        const stdError = stdDevValue / Math.sqrt(n);
        const meanDiff = meanValue - testValue;
        const t = (meanValue - testValue) / stdError;
        const df = n - 1;
        const tCritical = stdlibstatsBaseDistsTQuantile(0.975, df);
        const sig = 2 * (1 - stdlibstatsBaseDistsTCdf(Math.abs(t), df));
        rows.push({
            "rowHeader": [variable.label || variable.name],
            "t": t.toFixed(3),
            "df": Math.round(df),
            "sig2tailed": sig < 0.001 ? "<.001" : sig.toFixed(3),
            "meanDifference": meanDiff.toFixed(variable.decimals + 3),
            "lower": (meanDiff - tCritical * stdError).toFixed(variable.decimals + 2),
            "upper": (meanDiff + tCritical * stdError).toFixed(variable.decimals + 2)
        });
    });

    return {
        tables: [
            {
                title: "One-Sample Test",
                columnHeaders: [
                    { header: "", },
                    { 
                        header: `Test Value = ${testValue}`,
                        children: [
                            { header: "t", key: "t" },
                            { header: "df", key: "df" },
                            { header: "Sig. (2-tailed)", key: "sig2tailed" },
                            { header: "Mean Difference", key: "meanDifference" },
                            { 
                                header: "95% Confidence Interval of the Difference",
                                children: [
                                    { header: "Lower", key: "lower" },
                                    { header: "Upper", key: "upper" }
                                ]
                            }
                        ]
                    }
                ],
                rows: rows
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