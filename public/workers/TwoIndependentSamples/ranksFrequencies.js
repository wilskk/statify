import { computeRanksForRow } from '../KRelatedSamples/ranks.js';

/* Fungsi-fungsi untuk Ranks */
export function resultRanks(data, variables, groupData, groupingVariable, group1, group2, testType) {
    if (!data.length || !variables.length || !groupData.length) {
        return { tables: [{ title: 'Ranks', columnHeaders: [], rows: [] }] };
    }
    
    // Prepare data arrays for processing
    const arrays = variables.map(variable => {
        const values = data.map((row, index) => ({
            value: row[variable.name] !== "" && row[variable.name] !== null && row[variable.name] !== undefined ? 
                   parseFloat(row[variable.name]) : null,
            originalIndex: row.originalIndex
        })).filter(item => item.value !== null && !isNaN(item.value));
        
        if (values.length === 0) {
            console.warn(`No valid values found for variable ${variable.name}`);
        }
        return values;
    });
    
    // Prepare group arrays
    const groupArrays = groupData.map(row => ({
        value: row[groupingVariable.name] !== "" && row[groupingVariable.name] !== null && row[groupingVariable.name] !== undefined ? 
               parseFloat(row[groupingVariable.name]) : null,
        originalIndex: row.originalIndex
    })).filter(item => item.value !== null && !isNaN(item.value));
    
    if (groupArrays.length === 0) {
        return { tables: [{ title: 'Ranks', columnHeaders: [], rows: [] }] };
    }
    
    // Hitung ranks dan tabel hasil
    const ranksResult = computeRanks(arrays, variables, groupArrays, groupingVariable, group1, group2, testType);
    
    return {
        tables: [
            {
                title: 'Ranks',
                columnHeaders: [
                    { header: "" }, 
                    { header: groupingVariable.label || groupingVariable.name }, 
                    { header: "N" }, 
                    { header: "Mean Rank" },
                    { header: "Sum of Ranks" }
                ],
                rows: ranksResult.rows,
            },
        ],
    };
}

export function resultFrequencies(data, variables, groupData, groupingVariable, group1, group2, testType) {
    if (!data.length || !variables.length || !groupData.length) {
        return { tables: [{ title: 'Frequencies', columnHeaders: [], rows: [] }] };
    }
    
    // Prepare data arrays for processing
    const arrays = variables.map(variable => {
        const values = data.map((row, index) => ({
            value: row[variable.name] !== "" && row[variable.name] !== null && row[variable.name] !== undefined ? 
                    parseFloat(row[variable.name]) : null,
            originalIndex: row.originalIndex
        })).filter(item => item.value !== null && !isNaN(item.value));
        
        if (values.length === 0) {
            console.warn(`No valid values found for variable ${variable.name}`);
        }
        return values;
    });
    
    // Prepare group arrays
    const groupArrays = groupData.map(row => ({
        value: row[groupingVariable.name] !== "" && row[groupingVariable.name] !== null && row[groupingVariable.name] !== undefined ? 
                parseFloat(row[groupingVariable.name]) : null,
        originalIndex: row.originalIndex
    })).filter(item => item.value !== null && !isNaN(item.value));
    
    if (groupArrays.length === 0) {
        return { tables: [{ title: 'Ranks', columnHeaders: [], rows: [] }] };
    }

    const frequenciesResult = computeRanks(arrays, variables, groupArrays, groupingVariable, group1, group2, testType);

    return {
        tables: [
            {
                title: 'Frequencies',
                columnHeaders: [
                    { header: "" }, 
                    { header: groupingVariable.label || groupingVariable.name }, 
                    { header: "N" }
                ],
                rows: frequenciesResult.rows,
            },
        ],
    };
}

export function computeRanks(arrays, variables, groupArrays, groupingVariable, group1, group2, testType) {
    if (!arrays || !variables || !groupArrays) {
        console.error('Missing required parameters for computeRanks');
        return {
            rows: [],
            N: [],
            sumRankMatrix: [],
            groupTotal: [],
            groupedData: [],
            dataVariable: [],
            groupsLength: []
        };
    }

    // Buat rows untuk output
    let rows = [];
    let groupedData = [];
    let dataVariable = [];
    let N = [];
    let sumRankMatrix = [];
    let groupTotal = [];
    let groupsLength = [];

    for (let varIndex = 0; varIndex < variables.length; varIndex++) {
        const variable = variables[varIndex];
        let data = [];
        let dataGroup = [];
        
        // Kumpulkan data yang sesuai dengan kelompok yang dipilih
        for (let i = 0; i < arrays[varIndex].length; i++) {
            const matchingGroup = groupArrays.find(g => g.originalIndex === arrays[varIndex][i].originalIndex);
            if (matchingGroup && (matchingGroup.value === group1 || matchingGroup.value === group2)) {
                data.push(arrays[varIndex][i].value);
                dataGroup.push(matchingGroup.value);
            }
        }

        if (data.length === 0) {
            console.warn(`No valid data found for variable ${variable.name} in the specified group range`);
            continue;
        }

        // Hitung ranking untuk variabel saat ini
        const ranks = computeRanksForRow(data);
        
        let sumRankGroup = [];
        let countGroup = 0;
        let groupLength = [];

        // Kelompokkan hasil peringkat berdasarkan nilai kelompok
        [group1, group2].forEach(group => {
            let groupedRanks = [];
            
            // Get indices where group value matches the current group
            for (let j = 0; j < dataGroup.length; j++) {
                if (dataGroup[j] === group) {
                    groupedRanks.push(ranks[j]);
                }
            }

            if (groupedRanks.length > 0) {
                const sumRank = groupedRanks.reduce((acc, val) => acc + val, 0);
                const meanRank = sumRank / groupedRanks.length;
                
                if (testType.mannWhitneyU) {
                    // Tambahkan baris untuk kelompok
                    rows.push({
                        rowHeader: [variable.label || variable.name],
                        [groupingVariable.label || groupingVariable.name]: groupingVariable.values?.find(v => v.value === group)?.label || group,
                        "N": groupedRanks.length,
                        "Mean Rank": meanRank.toFixed(2),
                        "Sum of Ranks": sumRank.toFixed(2)
                    });
                } else {
                    rows.push({
                        rowHeader: [variable.label || variable.name],
                        [groupingVariable.label || groupingVariable.name]: groupingVariable.values?.find(v => v.value === group)?.label || group,
                        "N": groupedRanks.length
                    });
                }
                
                countGroup += 1;
                sumRankGroup.push(sumRank);
                groupLength.push(groupedRanks.length);
            }
        });

        N.push(ranks.length);
        sumRankMatrix.push(sumRankGroup);
        groupTotal.push(countGroup);
        groupedData.push(dataGroup);
        dataVariable.push(data);
        groupsLength.push(groupLength);

        // Tambahkan baris total
        rows.push({
            rowHeader: [variable.label || variable.name],
            [groupingVariable.label || groupingVariable.name]: "Total",
            "N": ranks.length
        });
    }
    
    return {
        rows: rows,
        N: N,
        sumRankMatrix: sumRankMatrix,
        groupTotal: groupTotal,
        groupedData: groupedData,
        dataVariable: dataVariable,
        groupsLength: groupsLength
    };
}