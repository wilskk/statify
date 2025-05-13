import stdlibstatsBaseDistsTCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-t-cdf@0.2.2/+esm'
import stdlibstatsBaseDistsTQuantile from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-t-quantile@0.2.2/+esm'
import stdlibstatsBaseDistsFCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-f-cdf@0.2.2/+esm'
import { separateDataByGroups } from './group.js';

export function resultTest(data, dataGrouping, variables, variablesGrouping, defineGroups, group1, group2, cutPointValue) {
    if (!data.length || !variables.length) {
        return { tables: [{ title: 'Independent Samples Test', columnHeaders: [], rows: [] }] };
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

    let groupedData = separateDataByGroups(arrays, arraysGrouping, variables, variablesGrouping, defineGroups, group1, group2, cutPointValue);
    const SEPARATOR = "|";
    let rows = [];
    console.log("disini");
    console.log("groupedData", JSON.stringify(groupedData));
    variables.forEach((variable) => {
        let data1 = [];
        let data2 = [];

        const group1Label = variablesGrouping.values.find(v => v.value === group1)?.label || group1;
        const group2Label = variablesGrouping.values.find(v => v.value === group2)?.label || group2

        if (defineGroups.useSpecifiedValues) {
            data1 = groupedData[`${variable.name}${SEPARATOR}${group1Label}`]
                .filter(value => value !== "" && value !== null && value !== undefined)
                .map(value => parseFloat(value))
                .filter(value => !isNaN(value));
                
            data2 = groupedData[`${variable.name}${SEPARATOR}${group2Label}`]
                .filter(value => value !== "" && value !== null && value !== undefined)
                .map(value => parseFloat(value))
                .filter(value => !isNaN(value));
        } else if (defineGroups.cutPoint) {
            data1 = groupedData[`${variable.name}${SEPARATOR}>=${cutPointValue}`]
                .filter(value => value !== "" && value !== null && value !== undefined)
                .map(value => parseFloat(value))
                .filter(value => !isNaN(value));

            data2 = groupedData[`${variable.name}${SEPARATOR}<${cutPointValue}`]
                .filter(value => value !== "" && value !== null && value !== undefined)
                .map(value => parseFloat(value))
                .filter(value => !isNaN(value));
        }

        if (data1.length === 0 || data2.length === 0) {
            return { tables: [{ title: 'Independent Samples Test', columnHeaders: [], rows: [] }] };
        }

        let levene = leveneTest(data1, data2);
        let equalVarTest = tTestEqualVariance(data1, data2);
        let unequalVarTest = tTestUnequalVariance(data1, data2);

        // Calculate confidence intervals
        const tCriticalEqual = stdlibstatsBaseDistsTQuantile(0.975, equalVarTest.df);
        const tCriticalUnequal = stdlibstatsBaseDistsTQuantile(0.975, unequalVarTest.df);

        const meanDiff = mean(data1) - mean(data2);

        rows.push({
            "rowHeader": [variable.label || variable.name],
            "type": "Equal variances assumed",
            "FL": levene.F.toFixed(3),
            "SigL": levene.Sig < 0.001 ? "<.001" : levene.Sig.toFixed(3),
            "t": equalVarTest.t.toFixed(3),
            "df": Math.round(equalVarTest.df),
            "sig2tailed": equalVarTest.sig < 0.001 ? "<.001" : equalVarTest.sig.toFixed(3),
            "meanDifference": meanDiff.toFixed(variable.decimals + 3),
            "stdErrorDifference": equalVarTest.stdErrorDifference.toFixed(variable.decimals + 3),
            "lower": (meanDiff - tCriticalEqual * equalVarTest.stdErrorDifference).toFixed(variable.decimals + 3),
            "upper": (meanDiff + tCriticalEqual * equalVarTest.stdErrorDifference).toFixed(variable.decimals + 3)
        });

        rows.push({
            "rowHeader": [variable.label || variable.name],
            "type": "Equal variances not assumed",
            "t": unequalVarTest.t.toFixed(3),
            "df": unequalVarTest.df.toFixed(3),
            "sig2tailed": unequalVarTest.sig < 0.001 ? "<.001" : unequalVarTest.sig.toFixed(variable.decimals + 3),
            "meanDifference": meanDiff.toFixed(variable.decimals + 3),
            "stdErrorDifference": unequalVarTest.stdErrorDifference.toFixed(variable.decimals + 3),
            "lower": (meanDiff - tCriticalUnequal * unequalVarTest.stdErrorDifference).toFixed(variable.decimals + 3),
            "upper": (meanDiff + tCriticalUnequal * unequalVarTest.stdErrorDifference).toFixed(variable.decimals + 3)
        });
    });

    return {
        tables: [
            {
                title: "Independent Samples Test",
                columnHeaders: [
                    { header: "" },
                    { header: "", key: "type" },
                    {
                        header: "Levene's Test for Equality of Variances",
                        children: [
                            { header: "F", key: "FL" },
                            { header: "Sig.", key: "SigL" }
                        ]
                    },
                    {
                        header: "t-test for Equality of Means",
                        children: [
                            { header: "t", key: "t" },
                            { header: "df", key: "df" },
                            { header: "Sig. (2-tailed)", key: "sig2tailed" },
                            { header: "Mean Difference", key: "meanDifference" },
                            { header: "Std. Error Difference", key: "stdErrorDifference" },
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

function leveneTest(group1, group2) {
    // Calculate X̄k (mean of each group)
    const mean1 = mean(group1);
    const mean2 = mean(group2);
    
    // Calculate Zki = |Xki - X̄k| (absolute deviations from group means)
    const Z1 = group1.map(x => Math.abs(x - mean1));
    const Z2 = group2.map(x => Math.abs(x - mean2));
    
    // Calculate weights (assuming equal weights wki = 1)
    const w1 = Array(Z1.length).fill(1);
    const w2 = Array(Z2.length).fill(1);
    
    // Calculate Wk (sum of weights for each group)
    const W1 = w1.reduce((sum, w) => sum + w, 0);
    const W2 = w2.reduce((sum, w) => sum + w, 0);
    
    // Calculate Z̄k (weighted mean of absolute deviations for each group)
    const Z1_bar = Z1.reduce((sum, z, i) => sum + w1[i] * z, 0) / W1;
    const Z2_bar = Z2.reduce((sum, z, i) => sum + w2[i] * z, 0) / W2;
    
    // Calculate Z̄ (overall weighted mean of absolute deviations)
    const Z_bar = (W1 * Z1_bar + W2 * Z2_bar) / (W1 + W2);
    
    // Calculate numerator: (W-2)∑Wk(Z̄k - Z̄)²
    const W = W1 + W2;
    const numerator = (W - 2) * (
        W1 * Math.pow(Z1_bar - Z_bar, 2) +
        W2 * Math.pow(Z2_bar - Z_bar, 2)
    );
    
    // Calculate denominator: ∑∑wki(Zki - Z̄k)²
    const denominator = 
        Z1.reduce((sum, z, i) => sum + w1[i] * Math.pow(z - Z1_bar, 2), 0) +
        Z2.reduce((sum, z, i) => sum + w2[i] * Math.pow(z - Z2_bar, 2), 0);
    
    // Calculate Levene statistic (L)
    const L = numerator / denominator;
    
    // Calculate degrees of freedom
    const df1 = 1; // k - 1 where k is number of groups (2-1 = 1)
    const df2 = W - 2; // N - k where N is total sample size and k is number of groups
    
    // Calculate significance using F-distribution
    const Sig = 1 - stdlibstatsBaseDistsFCdf(L, df1, df2);
    
    return { 
        F: L,
        df1: df1,
        df2: df2,
        Sig: Sig 
    };
}

function tTestEqualVariance(group1, group2) {
    let mean1 = mean(group1);
    let mean2 = mean(group2);
    let var1 = Math.pow(stdDev(group1, mean1), 2);
    let var2 = Math.pow(stdDev(group2, mean2), 2);
    
    let n1 = group1.length;
    let n2 = group2.length;
    let df = n1 + n2 - 2;
    
    let pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / df;
    let stdErrorDifference = Math.sqrt(pooledVar * (1/n1 + 1/n2));
    let t = (mean1 - mean2) / stdErrorDifference;
    
    let sig = 2 * (1 - stdlibstatsBaseDistsTCdf(Math.abs(t), df));
    
    return { t, df, stdErrorDifference, sig };
}

function tTestUnequalVariance(group1, group2) {
    let mean1 = mean(group1);
    let mean2 = mean(group2);
    let var1 = Math.pow(stdDev(group1, mean1), 2);
    let var2 = Math.pow(stdDev(group2, mean2), 2);
    
    let n1 = group1.length;
    let n2 = group2.length;
    
    let se1 = var1 / n1;
    let se2 = var2 / n2;
    let stdErrorDifference = Math.sqrt(se1 + se2);
    
    let t = (mean1 - mean2) / stdErrorDifference;
    let df = Math.pow(se1 + se2, 2) / (Math.pow(se1, 2)/(n1-1) + Math.pow(se2, 2)/(n2-1));
    
    let sig = 2 * (1 - stdlibstatsBaseDistsTCdf(Math.abs(t), df));
    
    return { t, df, stdErrorDifference, sig };
}
