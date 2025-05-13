/* Fungsi-fungsi untuk Ranks */
export function resultRanks(data1, data2, variables1, variables2) {
    if (!data1.length || !variables1.length || !data2.length || !variables2.length) {
        return { tables: [{ title: 'Ranks', columnHeaders: [], rows: [] }] };
    }
    
    // Ekstrak data array dari data objek
    const { arrays1, arrays2 } = extractArraysFromData(data1, data2, variables1, variables2);
    
    // Buat array untuk header
    const headers = [
        { header: "" },
        { header: "", key: "diffType" },
        { header: "N" },
        { header: "Mean Rank" },
        { header: "Sum of Ranks" }
    ];
    
    let stats = [];
    for (let i = 0; i < variables1.length; i++) {
        // Panggil fungsi perhitungan
        let ranks = computeRanks(arrays1[i], arrays2[i], true);
        
        const var1Label = variables1[i].label || variables1[i].name;
        const var2Label = variables2[i].label || variables2[i].name;
        
        stats.push(
            {   // Negative Ranks
                rowHeader: [`${var2Label} - ${var1Label}`],
                diffType: ["Negative Ranks"],
                N: ranks.nNeg,
                "Mean Rank": parseFloat(ranks.meanNegRank.toFixed(2)),
                "Sum of Ranks": parseFloat(ranks.sumNegRanks.toFixed(2))
            },
            { // Positive Ranks
                rowHeader: [`${var2Label} - ${var1Label}`],
                diffType: ["Positive Ranks"],
                N: ranks.nPos,
                "Mean Rank": parseFloat(ranks.meanPosRank.toFixed(2)),
                "Sum of Ranks": parseFloat(ranks.sumPosRanks.toFixed(2))
            },
            { // Ties
                rowHeader: [`${var2Label} - ${var1Label}`],
                diffType: ["Ties"],
                N: ranks.ties
            }, 
            { // Total
                rowHeader: [`${var2Label} - ${var1Label}`],
                diffType: ["Total"],
                N: ranks.total
            }
        );
    }
    
    return {
        tables: [
            {
                title: 'Ranks',
                columnHeaders: headers,
                rows: stats,
            },
        ],
    };
}

export function resultFrequencies(data1, data2, variables1, variables2) {
    if (!data1.length || !variables1.length || !data2.length || !variables2.length) {
        return { tables: [{ title: 'Frequencies', columnHeaders: [], rows: [] }] };
    }
    
    // Ekstrak data array dari data objek
    const { arrays1, arrays2 } = extractArraysFromData(data1, data2, variables1, variables2);
    
    // Buat array untuk header
    const headers = [
        { header: "" },
        { header: "", key: "diffType" },
        { header: "N" }
    ];
    
    let stats = [];
    for (let i = 0; i < variables1.length; i++) {
        // Panggil fungsi perhitungan
        let ranks = computeRanks(arrays1[i], arrays2[i], false);
        
        stats.push(
            { // Negative Differences
                rowHeader: [`${variables2[i].label || variables2[i].name} - ${variables1[i].label || variables1[i].name}`],
                diffType: ["Negative Differences"],
                N: ranks.nNeg
            },
            { // Positive Differences
                rowHeader: [`${variables2[i].label || variables2[i].name} - ${variables1[i].label || variables1[i].name}`],
                diffType: ["Positive Differences"],
                N: ranks.nPos
            },
            { // Ties
                rowHeader: [`${variables2[i].label || variables2[i].name} - ${variables1[i].label || variables1[i].name}`],
                diffType: ["Ties"],
                N: ranks.ties
            }, 
            { // Total
                rowHeader: [`${variables2[i].label || variables2[i].name} - ${variables1[i].label || variables1[i].name}`],
                diffType: ["Total"],
                N: ranks.total
            }
        );
    }
    
    return {
        tables: [
            {
                title: 'Frequencies',
                columnHeaders: headers,
                rows: stats,
            },
        ],
    };
}

// Mengekstrak data array dari objek data
export function extractArraysFromData(data1, data2, variables1, variables2) {
    const arrays1 = [];
    const arrays2 = [];

    for (let i = 0; i < variables1.length; i++) {
        const var1 = variables1[i];
        const var2 = variables2[i];
        
        const data1Array = [];
        const data2Array = [];
        
        // Ekstrak data untuk pasangan variabel ini
        for (let j = 0; j < data1.length; j++) {
            const row1 = data1[j];
            const row2 = data2[j] || {}; // Default ke objek kosong jika undefined
            
            const val1 = row1[var1.name];
            const val2 = row2[var2.name];
            
            // Hanya tambahkan jika kedua nilai valid
            if (val1 !== undefined && val2 !== undefined && 
                val1 !== null && val2 !== null &&
                !isNaN(val1) && !isNaN(val2)) {
                data1Array.push(parseFloat(val1));
                data2Array.push(parseFloat(val2));
            }
        }
        
        arrays1.push(data1Array);
        arrays2.push(data2Array);
    }
    
    return { arrays1, arrays2 };
}

// Fungsi untuk menghitung peringkat Wilcoxon Signed-Rank
function computeRanks(arr1, arr2, option) {
    // Pastikan panjang kedua array sama
    if (arr1.length !== arr2.length) {
        throw new Error("Jumlah data tidak sama untuk kedua sampel.");
    }

    // Buat array pasangan {diff, absDiff, sign}
    let pairs = [];
    for (let i = 0; i < arr1.length; i++) {
        const diff = arr2[i] - arr1[i];
        const absDiff = Math.abs(diff);
        // sign: +1 jika diff > 0, -1 jika diff < 0, 0 jika diff = 0
        let sign = 0;
        if (diff > 0) sign = 1;
        else if (diff < 0) sign = -1;

        pairs.push({ diff, absDiff, sign });
    }

    // Pisahkan ties (diff = 0)
    const ties = pairs.filter(p => p.sign === 0).length;
    // Hanya ranking untuk data non-ties
    let nonTies = pairs.filter(p => p.sign !== 0);

    // Urutkan berdasarkan absDiff
    nonTies.sort((a, b) => a.absDiff - b.absDiff);

    // Berikan rank (1-based) dengan penanganan ties (rata-rata rank)
    let i = 0;
    while (i < nonTies.length) {
        let start = i;
        let sumRanks = 0;
        let count = 0;
        const currentVal = nonTies[i].absDiff;

        // Kumpulkan baris-baris dengan absDiff yang sama
        while (i < nonTies.length && nonTies[i].absDiff === currentVal) {
            sumRanks += (i + 1); // rank 1-based
            count++;
            i++;
        }

        // Rata-rata peringkat
        const avgRank = sumRanks / count;
        // Berikan rank ke setiap baris
        for (let j = start; j < start + count; j++) {
            nonTies[j].rank = avgRank;
        }
    }

    // Kelompokkan lagi untuk sum rank positif/negatif
    const positivePairs = nonTies.filter(p => p.sign === 1);
    const negativePairs = nonTies.filter(p => p.sign === -1);

    const nPos = positivePairs.length;
    const nNeg = negativePairs.length;

    if (option === true) {
        const sumPosRanks = positivePairs.reduce((acc, p) => acc + p.rank, 0);
        const sumNegRanks = negativePairs.reduce((acc, p) => acc + p.rank, 0);
    
        const meanPosRank = nPos > 0 ? sumPosRanks / nPos : 0;
        const meanNegRank = nNeg > 0 ? sumNegRanks / nNeg : 0;

        return {
            nPos,
            sumPosRanks,
            meanPosRank,
            nNeg,
            sumNegRanks,
            meanNegRank,
            ties,
            total: arr1.length
        };
    }

    return {
        nPos,
        nNeg,
        ties,
        total: arr1.length
    };
}