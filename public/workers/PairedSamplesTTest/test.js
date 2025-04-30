import stdlibstatsBaseDistsTCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-t-cdf@0.2.2/+esm'
import stdlibstatsBaseDistsTQuantile from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-t-quantile@0.2.2/+esm'

export function resultTest(data1, variables1, data2, variables2) {
    if (!data1.length || !variables1.length || !data2.length || !variables2.length) {
        return { tables: [{ title: 'Paired Samples Test', columnHeaders: [], rows: [] }] };
    }

    // Prepare data arrays for processing
    let arrays1 = variables1.map(variable => {
        const values = data1.map((row, index) => ({
            value: row[variable.name] !== "" && row[variable.name] !== null && row[variable.name] !== undefined ? 
                   parseFloat(row[variable.name]) : null,
            originalIndex: row.originalIndex
        })).filter(item => item.value !== null && !isNaN(item.value));
        
        if (values.length === 0) {
            console.warn(`No valid values found for variable ${variable.name}`);
        }
        return values;
    });

    let arrays2 = variables2.map(variable => {
        const values = data2.map((row, index) => ({
            value: row[variable.name] !== "" && row[variable.name] !== null && row[variable.name] !== undefined ? 
                   parseFloat(row[variable.name]) : null,
            originalIndex: row.originalIndex
        })).filter(item => item.value !== null && !isNaN(item.value));
        
        if (values.length === 0) {
            console.warn(`No valid values found for variable ${variable.name}`);
        }
        return values;
    });

    // Filter arrays to only include pairs with matching originalIndex
    const filteredArrays1 = arrays1.map((arr1, i) => {
        const arr2 = arrays2[i];
        const matchingPairs = arr1.filter(item1 => {
            const matchingItem = arr2.find(item2 => item2.originalIndex === item1.originalIndex);
            return matchingItem !== undefined;
        });
        return matchingPairs;
    });

    const filteredArrays2 = arrays2.map((arr2, i) => {
        const arr1 = arrays1[i];
        const matchingPairs = arr2.filter(item2 => {
            const matchingItem = arr1.find(item1 => item1.originalIndex === item2.originalIndex);
            return matchingItem !== undefined;
        });
        return matchingPairs;
    });

    // Replace original arrays with filtered ones
    arrays1 = filteredArrays1;
    arrays2 = filteredArrays2;

    let stats = [];
    for (let i = 0; i < variables1.length; i++) {
        // Calculate means
        const mean1 = mean(arrays1[i]);
        const mean2 = mean(arrays2[i]);
        const meanDiff = mean1 - mean2;

        // Calculate variances
        const var1 = variance(arrays1[i], mean1);
        const var2 = variance(arrays2[i], mean2);

        // Calculate covariance
        const covar = covariance(arrays1[i], arrays2[i], mean1, mean2);

        // Calculate standard error of difference using the formula
        const W = arrays1[i].length;
        const stdErrDiff = Math.sqrt((var1 + var2 - 2 * covar) / W);

        const tValue = meanDiff / stdErrDiff;
        const df = W - 1;
        const sigValue = 2 * (1 - stdlibstatsBaseDistsTCdf(Math.abs(tValue), df)); // Two-tailed p-value
        const tCritical = stdlibstatsBaseDistsTQuantile(0.975, df); // Get critical t-value for 95% CI using quantile function

        // Calculate confidence interval using D ± tW-1 * SD
        const ciLower = meanDiff - (tCritical * stdErrDiff);
        const ciUpper = meanDiff + (tCritical * stdErrDiff);

        stats.push({
            rowHeader: [`Pair ${i+1}`],
            pair: [`${variables1[i].label || variables1[i].name} - ${variables2[i].label || variables2[i].name}`],
            Mean: meanDiff.toFixed(3),
            "Std. Deviation": Math.sqrt(var1 + var2 - 2 * covar).toFixed(3),
            "Std. Error Mean": stdErrDiff.toFixed(3),
            lower: ciLower.toFixed(3),
            upper: ciUpper.toFixed(3),
            t: tValue.toFixed(3),
            df: df,
            "Sig. (2-tailed)": sigValue < 0.001 ? "<.001" : sigValue.toFixed(3)
        });
    }

    return {
        tables: [
            {
                title: "Paired Samples Test",
                columnHeaders: [
                    { header: "" },
                    { header: "", key: "pair" },
                    { header: "Mean" },
                    { header: "Std. Deviation" },
                    { header: "Std. Error Mean" },
                    { 
                        header: "95% Confidence Interval of the Difference",
                        children:
                            [
                                { header: "Lower", key: "lower" },
                                { header: "Upper", key: "upper" }
                            ] 
                    },
                    { header: "t" },
                    { header: "df" },
                    { header: "Sig. (2-tailed)" }
                ],
                rows: stats
            }
        ]
    };
}

function mean(arr) {
    return arr.reduce((sum, x) => sum + x.value, 0) / arr.length;
}

function variance(arr, meanValue) {
    const sumSq = arr.reduce((sum, x) => sum + Math.pow(x.value - meanValue, 2), 0);
    return sumSq / (arr.length - 1);
}

function covariance(arr1, arr2, mean1, mean2) {
    let sum = 0;
    for (let i = 0; i < arr1.length; i++) {
        sum += (arr1[i].value - mean1) * (arr2[i].value - mean2);
    }
    return sum / (arr1.length - 1);
}

function stdError(sd, n) {
    return sd / Math.sqrt(n);
}
