import stdlibstatsBaseDistsNormalCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-normal-cdf@0.2.2/+esm';

/* Fungsi-fungsi untuk Runs Test */
export function resultRuns(data, variables, cutPoint) {
    if (!data.length || !variables.length) {
        return { tables: [{ title: 'Runs Test', columnHeaders: [], rows: [] }] };
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

    // Hitung statistik Runs Test
    const runsTestStats = computeRunsTestStats(arrays, variables, cutPoint);

    return {
        tables: [
            {
                title: 'Runs Test',
                columnHeaders: getColumnHeaders(variables),
                rows: runsTestStats.rows
            }
        ]
    };
}

// Fungsi untuk menentukan kolom header
function getColumnHeaders(variables) {
    const headers = [{ header: "" }];
    variables.forEach(v => {
        headers.push({ header: v.label || v.name });
    });
    return headers;
}

// Fungsi untuk menghitung statistik Runs Test
function computeRunsTestStats(variableData, variables, cutPoint) {
    let rows;
    if (typeof cutPoint === 'string') {
        rows = [
            { rowHeader: ["Test Value"] },
            { rowHeader: ["Cases < Test Value"] },
            { rowHeader: ["Cases >= Test Value"] },
            { rowHeader: ["Total Case"] },
            { rowHeader: ["Number of Runs"] },
            { rowHeader: ["Z"] },
            { rowHeader: ["Asymp. Sig. (2-tailed)"] }
        ];
    } else {
        rows = [
            { rowHeader: ["Test Value"] },
            { rowHeader: ["Number of Runs"] },
            { rowHeader: ["Z"] },
            { rowHeader: ["Asymp. Sig. (2-tailed)"] }
        ];
    }

    // Hitung statistik untuk setiap variabel
    variableData.forEach((data, index) => {
        const values = data.map(item => item.value);
        const stats = getRunsTestStats(values, cutPoint);
        
        // Isi setiap baris dengan hasil perhitungan
        rows[0][variables[index].label || variables[index].name] = Number(stats.testValue).toFixed(2);
        if (typeof cutPoint === 'string') {
            rows[1][variables[index].label || variables[index].name] = stats.casesBelow;
            rows[2][variables[index].label || variables[index].name] = stats.casesAbove;
            rows[3][variables[index].label || variables[index].name] = stats.total;
            rows[4][variables[index].label || variables[index].name] = stats.runs;
            rows[5][variables[index].label || variables[index].name] = (stats.Z).toFixed(3);
            rows[6][variables[index].label || variables[index].name] = (stats.pValue).toFixed(3);
        } else {
            rows[1][variables[index].label || variables[index].name] = stats.runs;
            rows[2][variables[index].label || variables[index].name] = (stats.Z).toFixed(3);
            rows[3][variables[index].label || variables[index].name] = (stats.pValue).toFixed(3);
        }
    });

    return { rows };
}

// Fungsi untuk menghitung statistik Runs Test dari sebuah array data
function getRunsTestStats(data, cutPoint) {
    const n = data.length;
    
    // Tentukan test value berdasarkan cutPoint
    let testValue;
    if (cutPoint === 'median') {
        const sorted = [...data].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        testValue = sorted.length % 2 === 0 ? 
            (sorted[mid - 1] + sorted[mid]) / 2 : 
            sorted[mid];
    } else if (cutPoint === 'mode') {
        const frequency = {};
        data.forEach(value => {
            frequency[value] = (frequency[value] || 0) + 1;
        });
        
        // Cari nilai dengan frekuensi tertinggi
        let maxFrequency = 0;
        let modeValue = data[0]; // nilai default
        
        Object.entries(frequency).forEach(([value, freq]) => {
            if (freq > maxFrequency) {
                maxFrequency = freq;
                modeValue = parseFloat(value);
            }
        });
        
        testValue = modeValue;
    } else if (cutPoint === 'mean') {
        const sum = data.reduce((acc, x) => acc + x, 0);
        testValue = sum / n;
    } else if (typeof cutPoint === 'number') {
        testValue = cutPoint;
    }

    // Klasifikasikan data: hitung jumlah kasus < testValue dan >= testValue
    const casesBelow = data.filter(x => x < testValue).length;
    const casesAbove = data.filter(x => x >= testValue).length;

    // Hitung jumlah runs (perubahan kategori)
    let runs = 1; // minimal ada 1 run
    for (let i = 1; i < n; i++) {
        if ((data[i] < testValue) !== (data[i - 1] < testValue)) {
            runs++;
        }
    }

    // Hitung ekspektasi (mean) jumlah runs dan standar deviasi
    const mu_R = 1 + (2 * casesBelow * casesAbove) / n;
    const sigma_R = Math.sqrt((2 * casesBelow * casesAbove * (2 * casesBelow * casesAbove - n)) / (n * n * (n - 1)));

    // Terapkan koreksi kontinuitas untuk nilai runs
    let runsCorrected = runs;
    if (runs < mu_R) {
        runsCorrected = runs + 0.5;
    } else if (runs > mu_R) {
        runsCorrected = runs - 0.5;
    }

    // Hitung nilai Z
    const Z = (runsCorrected - mu_R) / sigma_R;
    // Hitung p-value 2-tailed menggunakan stdlibstatsBaseDistsNormalCdf
    const pValue = 2 * (1 - stdlibstatsBaseDistsNormalCdf(Math.abs(Z), 0, 1));

    return {
        testValue,    // nilai test value berdasarkan cutPoint
        casesBelow,   // jumlah data dengan nilai < testValue
        casesAbove,   // jumlah data dengan nilai >= testValue
        total: n,     // total kasus/data
        runs,         // jumlah runs yang teramati
        Z,            // nilai statistik Z (setelah koreksi kontinuitas)
        pValue        // p-value (2-tailed)
    };
}