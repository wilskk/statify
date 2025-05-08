import stdlibstatsBaseDistsChisquareCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-chisquare-cdf@0.2.2/+esm'

export function resultChiSquare(data, variables, expectedRange, rangeValue, expectedValue, expectedValueList) {
    if (!data.length || !variables.length) {
        return { tables: [{ title: 'Test Statistics', columnHeaders: [], rows: [] }] };
    }

    // Prepare data arrays for processing
    const arrays = variables.map(variable => {
        const values = data.map((row, index) => ({
            value: row[variable.name] !== "" && row[variable.name] !== null && row[variable.name] !== undefined ? 
                   parseFloat(row[variable.name]) : null,
        })).filter(item => item.value !== null && !isNaN(item.value));
        
        if (values.length === 0) {
            console.warn(`No valid values found for variable ${variable.name}`);
        }
        return values;
    });

    // Convert expectedValueList to numeric values
    const numericExpectedValueList = expectedValueList.map(value => parseFloat(value));

    // Calculate Chi-square values
    const chiSquareValues = {};
    arrays.forEach((columnData, colIndex) => {
        let data;
        if (expectedRange.useSpecificRange && rangeValue.lowerValue !== null && rangeValue.upperValue !== null) {
            data = columnData
                .map(item => Math.floor(item.value))
                .filter(value => value >= rangeValue.lowerValue && value <= rangeValue.upperValue);
        } else {
            data = columnData.map(item => item.value);
        }

        // Calculate observed counts
        const observedCounts = {};
        data.forEach(value => {
            observedCounts[value] = (observedCounts[value] || 0) + 1;
        });

        // Calculate total count and number of categories
        const totalCount = Object.values(observedCounts).reduce((a, b) => a + b, 0);
        const numCategories = Object.keys(observedCounts).length;

        // Calculate expected frequency
        let expectedFreq;
        if (expectedRange.useSpecificRange && rangeValue.lowerValue !== null && rangeValue.upperValue !== null) {
            expectedFreq = totalCount / (rangeValue.upperValue - rangeValue.lowerValue + 1);
        } else if (expectedValue.allCategoriesEqual) {
            expectedFreq = totalCount / numCategories;
        } else {
            const totalExpected = numericExpectedValueList.reduce((a, b) => a + b, 0);
            expectedFreq = numericExpectedValueList.map(value => 
                (value / totalExpected) * totalCount
            );
        }

        // Calculate chi-square value
        let chiSum = 0;
        if (Array.isArray(expectedFreq)) {
            Object.entries(observedCounts).forEach(([category, obs], index) => {
                const exp = expectedFreq[index];
                const diff = obs - exp;
                chiSum += (diff * diff) / exp;
            });
        } else {
            Object.values(observedCounts).forEach(obs => {
                const exp = expectedFreq;
                const diff = obs - exp;
                chiSum += (diff * diff) / exp;
            });

            if (expectedRange.useSpecificRange && rangeValue.lowerValue !== null && rangeValue.upperValue !== null) {
                const missingCategories = (rangeValue.upperValue - rangeValue.lowerValue + 1) - numCategories;
                chiSum += (0 - expectedFreq) * (0 - expectedFreq) / expectedFreq * missingCategories;
            }
        }

        // Use label if available, otherwise use name
        const varKey = variables[colIndex].label || variables[colIndex].name;
        chiSquareValues[varKey] = chiSum;
    });

    // Calculate degrees of freedom
    const df = {};
    arrays.forEach((columnData, colIndex) => {
        const varKey = variables[colIndex].label || variables[colIndex].name;
        if (expectedRange.useSpecificRange && rangeValue.lowerValue !== null && rangeValue.upperValue !== null) {
            df[varKey] = rangeValue.upperValue - rangeValue.lowerValue;
        } else {
            const uniqueValues = new Set(columnData.map(item => item.value));
            df[varKey] = uniqueValues.size - 1;
        }
    });

    // Calculate p-values
    const asympSig = {};
    Object.entries(chiSquareValues).forEach(([varKey, chiValue]) => {
        const dfValue = df[varKey];
        const pValue = 1 - stdlibstatsBaseDistsChisquareCdf(chiValue, dfValue);
        asympSig[varKey] = pValue;
    });

    // Format results
    const rows = [
        { 
            rowHeader: ["Chi-square"], 
            ...Object.fromEntries(
                Object.entries(chiSquareValues).map(([key, value]) => [key, (value.toFixed(3))])
            )
        },
        { 
            rowHeader: ["df"], 
            ...df
        },
        { 
            rowHeader: ["Asymp. Sig."], 
            ...Object.fromEntries(
                Object.entries(asympSig).map(([key, value]) => [key, (value.toFixed(3))])
            )
        }
    ];

    return {
        tables: [
            {
                title: "Test Statistics",
                columnHeaders: [
                    { header: "" },
                    ...variables.map(variable => ({ header: variable.label || variable.name }))
                ],
                rows: rows
            }
        ]
    };
}