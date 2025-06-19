export function resultFrequencies(data, variables, expectedRange, rangeValue, expectedValue, expectedValueList) {
    if (!data.length || !variables.length) {
        return { tables: [{ title: 'Frequencies', columnHeaders: [], rows: [] }] };
    }

    console.log('Expected Range:', JSON.stringify(expectedRange));
    console.log('Range Value:', JSON.stringify(rangeValue));
    console.log('Expected Value:', JSON.stringify(expectedValue));
    console.log('Expected Value List:', JSON.stringify(expectedValueList));

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
    console.log('Numeric Expected Value List:', JSON.stringify(numericExpectedValueList));

    let results = [];

    // Case 1: No range specified and no expected values
    if (expectedRange.useSpecificRange === false && expectedValue.allCategoriesEqual === true) {
        console.log('Case 1: No range specified and no expected values');
        results = variables.map((variable, index) => {
            const data = arrays[index].map(item => item.value).sort((a, b) => a - b);
            const uniqueValues = [...new Set(data)];
            
            const expectedN = data.length / uniqueValues.length;
            
            const observedCounts = new Map();
            data.forEach(value => {
                observedCounts.set(value, (observedCounts.get(value) || 0) + 1);
            });

            const sortedObservedCounts = new Map([...observedCounts.entries()].sort(([a], [b]) => parseFloat(a) - parseFloat(b)));
    
            const rows = Array.from(sortedObservedCounts, ([key, observedN]) => ({
                rowHeader: [parseFloat(key).toFixed(variables[index].decimals)],
                "Observed N": observedN,
                "Expected N": expectedN.toFixed(1),
                "Residual": (observedN - expectedN).toFixed(1)
            }));
    
            rows.push({
                rowHeader: ["Total"],
                "Observed N": data.length
            });
    
            return {
                title: variable.label || variable.name,
                columnHeaders: [
                    { header: "" },
                    { header: "Observed N" },
                    { header: "Expected N" },
                    { header: "Residual" }
                ],
                rows: rows
            };
        });
    }

    // Case 2: No range specified but with expected values
    else if (expectedRange.useSpecificRange === false && expectedValue.allCategoriesEqual === false) {
        console.log('Case 2: No range specified but with expected values');
        results = variables.map((variable, index) => {
            const data = arrays[index].map(item => item.value).sort((a, b) => a - b);
            const uniqueValues = [...new Set(data)];
            
            const expectedN = numericExpectedValueList.length === uniqueValues.length 
                ? numericExpectedValueList
                : null;
            console.log('Expected N:', JSON.stringify(expectedN));
            
            const observedCounts = new Map();
            data.forEach(value => {
                observedCounts.set(value, (observedCounts.get(value) || 0) + 1);
            });

            const sortedObservedCounts = new Map([...observedCounts.entries()].sort(([a], [b]) => parseFloat(a) - parseFloat(b)));
            
            const rows = Array.from(sortedObservedCounts).map(([key, observedN], i) => {
                console.log(`expectedN[${i}]:`, JSON.stringify(expectedN[i]));
                const row = {
                    rowHeader: [parseFloat(key).toFixed(variables[index].decimals)],
                    "Observed N": observedN
                };
                if (expectedN) {
                    row["Expected N"] = Number(Math.round(expectedN[i] + 'e1') + 'e-1').toFixed(1);
                    row["Residual"] = (observedN - expectedN[i]).toFixed(1);
                }
                return row;
            });
            
            rows.push({
                rowHeader: ["Total"],
                "Observed N": data.length
            });
            
            return {
                title: variable.label || variable.name,
                columnHeaders: expectedN 
                    ? [{ header: "" }, { header: "Observed N" }, { header: "Expected N" }, { header: "Residual" }]
                    : [{ header: "" }, { header: "Observed N" }],
                rows: rows
            };
        });
    }
    
    // Case 3: Range specified but no expected values
    else if (expectedRange.useSpecificRange === true && expectedValue.allCategoriesEqual === true) {
        console.log('Case 3: Range specified but no expected values');
        const table = {
            title: "Frequencies",
            columnHeaders: [{ header: "" }],
            rows: []
        };
        
        variables.forEach((variable, index) => {
            const data = arrays[index]
                .map(item => Math.floor(item.value))
                .filter(value => value >= rangeValue.lowerValue && value <= rangeValue.upperValue);
            const uniqueFilteredValues = new Set(data);
            
            console.log('Data:', JSON.stringify(data));
            console.log('Unique Filtered Values:', JSON.stringify(uniqueFilteredValues));
            const expectedN = data.length / (rangeValue.upperValue - rangeValue.lowerValue + 1);
            console.log('Expected N:', JSON.stringify(expectedN));

            const observedCountsFiltered = {};
            data.forEach(value => {
                observedCountsFiltered[value] = (observedCountsFiltered[value] || 0) + 1;
            });
            
            table.columnHeaders.push({
                header: variable.label || variable.name,
                children: [
                    { header: "Category", key: `category${index + 1}` },
                    { header: "Observed N", key: `observedN${index + 1}` },
                    { header: "Expected N", key: `expectedN${index + 1}` },
                    { header: "Residual", key: `residual${index + 1}` }
                ]
            });
            
            for (let key = rangeValue.lowerValue, rowIndex = 0; key <= rangeValue.upperValue; key++, rowIndex++) {
                let row = table.rows[rowIndex] || { rowHeader: [(rowIndex + 1).toString()] };
                let residual = (observedCountsFiltered[key] || 0) - expectedN;
                if (uniqueFilteredValues.has(key)) {
                    row[`category${index + 1}`] = key.toFixed(variables[index].decimals);
                    row[`observedN${index + 1}`] = observedCountsFiltered[key] || 0;
                } else {
                    row[`category${index + 1}`] = "";
                    row[`observedN${index + 1}`] = 0;
                }
                
                row[`expectedN${index + 1}`] = expectedN.toFixed(1);
                row[`residual${index + 1}`] = residual.toFixed(1);
                table.rows[rowIndex] = row;
            }
        });
        
        table.rows.push({
            rowHeader: ["Total"], ...Object.fromEntries(variables.map((_, i) => [
                `observedN${i + 1}`, 
                arrays[i]
                    .map(item => Math.floor(item.value))
                    .filter(value => value >= rangeValue.lowerValue && value <= rangeValue.upperValue)
                    .length
            ]))
        });
        
        results.push(table);
    }

    // Case 4: Range specified with expected values
    else {
        console.log('Case 4: Range specified with expected values');
        const table = {
            title: "Frequencies",
            columnHeaders: [{ header: "" }],
            rows: []
        };

        variables.forEach((variable, index) => {
            const data = arrays[index]
                .map(item => Math.floor(item.value))
                .filter(value => value >= rangeValue.lowerValue && value <= rangeValue.upperValue);
            const uniqueFilteredValues = new Set(data);

            const expectedN = numericExpectedValueList.length === (rangeValue.upperValue - rangeValue.lowerValue + 1) 
                ? numericExpectedValueList
                : null;

            const observedCountsFiltered = {};
            data.forEach(value => {
                observedCountsFiltered[value] = (observedCountsFiltered[value] || 0) + 1;
            });
    
            table.columnHeaders.push({
                header: variable.label || variable.name,
                children: expectedN
                    ? [
                        { header: "Category", key: `category${index + 1}` },
                        { header: "Observed N", key: `observedN${index + 1}` },
                        { header: "Expected N", key: `expectedN${index + 1}` },
                        { header: "Residual", key: `residual${index + 1}` }
                    ] : [
                        { header: "Category", key: `category${index + 1}` },
                        { header: "Observed N", key: `observedN${index + 1}` },
                    ]
            });
    
            for (let key = rangeValue.lowerValue, rowIndex = 0; key <= rangeValue.upperValue; key++, rowIndex++) {
                let row = table.rows[rowIndex] || { rowHeader: [(rowIndex + 1).toString()] };
    
                if (uniqueFilteredValues.has(key)) {
                    row[`category${index + 1}`] = key.toFixed(variables[index].decimals);
                    row[`observedN${index + 1}`] = observedCountsFiltered[key];
                } else {
                    row[`category${index + 1}`] = "";
                    row[`observedN${index + 1}`] = 0;
                }

                if (expectedN !== null) {
                    row[`expectedN${index + 1}`] = Number(Math.round(expectedN[rowIndex] + 'e1') + 'e-1').toFixed(1);
                    row[`residual${index + 1}`] = (row[`observedN${index + 1}`] - expectedN[rowIndex]).toFixed(1);
                }
                    
                table.rows[rowIndex] = row;
            }

            if (table.rows.length > 0 && table.rows[table.rows.length - 1].rowHeader[0] === "Total") {
                table.rows[table.rows.length - 1] = {
                    ...table.rows[table.rows.length - 1],
                    rowHeader: ["Total"], [`observedN${index + 1}`]: data.length
                };                
            } else {
                table.rows.push({ rowHeader: ["Total"], [`observedN${index + 1}`]: data.length });
            }
        });

        results.push(table);
    }
    
    return { tables: results };
}
