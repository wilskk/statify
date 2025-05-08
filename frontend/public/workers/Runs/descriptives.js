/* Fungsi-fungsi untuk Descriptives */
export function resultDescriptive(data, variables, displayStatistics) {
    if (!data.length || !variables.length) {
        return { tables: [{ title: 'Descriptive Statistics', columnHeaders: [], rows: [] }] };
    }

    // Tentukan kolom header berdasarkan opsi displayStatistics
    const columnHeaders = getColumnHeaders(displayStatistics);

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

    // Hitung statistik deskriptif berdasarkan opsi yang dipilih
    const descriptiveStats = computeDescriptiveStats(arrays, displayStatistics, variables);

    return {
        tables: [
            {
                title: 'Descriptive Statistics',
                columnHeaders: columnHeaders,
                rows: descriptiveStats.rows
            }
        ]
    };
}

// Fungsi untuk menentukan kolom header berdasarkan opsi displayStatistics
function getColumnHeaders(displayStatistics) {
    const { descriptive, quartiles } = displayStatistics;
    const headers = [{ header: "" }, { header: "N" }];

    // Tambahkan header untuk statistik deskriptif jika opsi descriptive diaktifkan
    if (descriptive) {
        headers.push(
            { header: "Mean" },
            { header: "Std. Deviation" },
            { header: "Minimum" },
            { header: "Maximum" }
        );
    }

    // Tambahkan header untuk quartiles jika opsi quartiles diaktifkan
    if (quartiles) {
        headers.push({
            header: "Percentiles",
            children: [
                { header: "25th", key: "25th" },
                { header: "50th (Median)", key: "50th" },
                { header: "75th", key: "75th" }
            ]
        });
    }

    return headers;
}

// Fungsi untuk menghitung statistik deskriptif
function computeDescriptiveStats(variableData, displayStatistics, variables) {
    const { descriptive, quartiles } = displayStatistics;

    // Inisialisasi baris-baris untuk hasil
    let rows = [];

    // Buat baris untuk setiap variabel
    variableData.forEach((v, index) => {
        let data = v.map(item => item.value).filter(item => item !== null && !isNaN(item));
        
        // Lewati variabel dengan data kosong
        if (!data || data.length === 0) return;
        
        const row = {
            rowHeader: [variables[index].label || variables[index].name],
            "N": data.length
        };

        // Tambahkan statistik deskriptif jika opsi descriptive diaktifkan
        if (descriptive) {
            const mean = calculateMean(data);
            const stdDev = calculateStdDev(data, mean);
            
            row["Mean"] = mean.toFixed(2);
            row["Std. Deviation"] = stdDev.toFixed(3);
            row["Minimum"] = Math.min(...data);
            row["Maximum"] = Math.max(...data);
        }

        // Tambahkan statistik quartiles jika opsi quartiles diaktifkan
        if (quartiles) {
            row["25th"] = calculatePercentile(data, 25).toFixed(2);
            row["50th"] = calculatePercentile(data, 50).toFixed(2);
            row["75th"] = calculatePercentile(data, 75).toFixed(2);
        }

        rows.push(row);
    });

    return {
        rows: rows
    };
}

// Fungsi helper untuk menghitung mean
function calculateMean(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

// Fungsi helper untuk menghitung standard deviation
function calculateStdDev(arr, mean) {
    const sumSq = arr.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0);
    return Math.sqrt(sumSq / (arr.length - 1));
}

// Fungsi helper untuk menghitung percentiles
function calculatePercentile(arr, percentile) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length + 1);
    if (Number.isInteger(index)) {
        return sorted[index - 1];
    } else {
        const lowerIndex = Math.floor(index);
        const upperIndex = Math.ceil(index);
        const weight = index - lowerIndex;
        return sorted[lowerIndex - 1] * (1 - weight) + sorted[upperIndex - 1] * weight;
    }
}