// Worker untuk kalkulasi tabel frekuensi.

// Helper: Pembulatan angka ke jumlah desimal tertentu.
const round = (num, decimals) => {
    if (num === null || num === undefined) return null;
    const factor = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * factor) / factor;
  };
  
  // Helper: Cek apakah nilai adalah missing (system atau user-defined).
  const checkMissing = (value, missingDefinition, type) => {
    // System missing: string kosong untuk NUMERIC/DATE.
    if (value === "") {
      if (type === 'NUMERIC' || type === 'DATE') {
        return { isMissing: true, missingType: "System", originalMissingValue: "" };
      } else {
        // String kosong valid untuk tipe STRING.
        return { isMissing: false, missingType: null, originalMissingValue: null };
      }
    }
    // Null/undefined selalu system missing jika bukan string kosong yg sudah ditangani.
    if (value === null || value === undefined) {
        return { isMissing: true, missingType: "System", originalMissingValue: value };
    }

    // Tidak ada definisi missing, berarti bukan user-defined missing.
    if (!missingDefinition) {
      return { isMissing: false, missingType: null, originalMissingValue: null };
    }
  
    // User-defined discrete missing.
    if (missingDefinition.discrete && Array.isArray(missingDefinition.discrete)) {
      let valueToCompare = value;
      // Konversi nilai ke number jika tipe NUMERIC untuk perbandingan.
      if (type === 'NUMERIC' && typeof value !== 'number') {
         const numVal = parseFloat(value);
         if (!isNaN(numVal)) {
           valueToCompare = numVal;
         }
      }
  
      for (const missingVal of missingDefinition.discrete) {
         let discreteMissingToCompare = missingVal;
         // Konversi definisi missing diskrit ke number jika tipe NUMERIC & missingVal adalah string.
         if (type === 'NUMERIC' && typeof missingVal === 'string'){
              const numMissing = parseFloat(missingVal);
              if(!isNaN(numMissing)){
                  discreteMissingToCompare = numMissing;
              }
         }
         // Bandingkan nilai (setelah potensi konversi) dan juga sebagai string.
        if (valueToCompare === discreteMissingToCompare || String(value) === String(missingVal)) {
             return { isMissing: true, missingType: "UserDefined", originalMissingValue: missingVal };
        }
      }
    }
  
    // User-defined range missing (hanya untuk NUMERIC atau DATE).
    // Untuk DATE, nilai dikonversi ke numerik (SPSS seconds) sebelum perbandingan range.
    if ((type === 'NUMERIC' || type === 'DATE') && missingDefinition.range) {
      let numValue;
      if (type === 'DATE') {
        // `dateStringToSpssSeconds` diimpor dari `spssDateConverter.js` via `importScripts` di `onmessage`.
        // Jika tidak tersedia, atau konversi gagal, `numValue` akan null/NaN.
        numValue = typeof self.dateStringToSpssSeconds === 'function' ? self.dateStringToSpssSeconds(String(value)) : null;
      } else {
        numValue = typeof value === 'number' ? value : parseFloat(value);
      }

      if (numValue !== null && !isNaN(numValue)) {
        const min = typeof missingDefinition.range.min === 'number' ? missingDefinition.range.min : parseFloat(missingDefinition.range.min);
        const max = typeof missingDefinition.range.max === 'number' ? missingDefinition.range.max : parseFloat(missingDefinition.range.max);
        if (!isNaN(min) && !isNaN(max) && numValue >= min && numValue <= max) {
          return { isMissing: true, missingType: "UserDefinedRange", originalMissingValue: value };
        }
      }
    }
    // Bukan missing jika lolos semua cek.
    return { isMissing: false, missingType: null, originalMissingValue: null };
  };
  
  // Helper: Format nilai untuk tampilan di tabel frekuensi.
  // Terapkan value labels jika ada. Format khusus untuk DATE & STRING kosong.
  const formatDisplayValue = (value, variableMeta, spssDateFormat = 'dd-MMM-yyyy') => {
      // String kosong ditampilkan sebagai "".
      if (variableMeta.type === 'STRING' && value === "") {
          return '""'; // Representasi string kosong.
      }
      const { type, decimals, values: valueLabels } = variableMeta;
  
    if (type === 'NUMERIC') {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
       if (isNaN(numValue)) return String(value); // Kembalikan apa adanya jika NaN setelah parse.
  
      // Cek value label.
      if (valueLabels && valueLabels.length > 0) {
        const foundLabel = valueLabels.find(vl => vl.value === numValue);
        if (foundLabel) return foundLabel.label;
      }
      return numValue.toFixed(decimals); // Format angka.
    } else if (type === 'DATE') {
      // Asumsi `value` untuk DATE adalah string 'dd-mm-yyyy' dari data asli.
      // Fungsi ini harusnya ada via importScripts jika worker dipanggil dengan benar.
      if (typeof self.spssSecondsToDateString === 'function' && typeof self.dateStringToSpssSeconds === 'function') {
          const spssSeconds = self.dateStringToSpssSeconds(String(value));
          if (spssSeconds !== null) {
              // Format ke dd-MMM-yyyy (e.g., 01-JAN-2023)
              // Ini contoh, bisa disesuaikan jika format lain diperlukan.
              const dateObj = new Date(self.SPSS_EPOCH_MILLIS + spssSeconds * 1000);
              if (!isNaN(dateObj.getTime())) {
                  const day = String(dateObj.getUTCDate()).padStart(2, '0');
                  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                  const month = months[dateObj.getUTCMonth()];
                  const year = dateObj.getUTCFullYear();
                  if (spssDateFormat === 'dd-MMM-yyyy') {
                    return `${day}-${month}-${year}`;
                  } // Tambahkan format lain jika perlu
              }
          }
      }
      return String(value); // Fallback jika konversi gagal.
    }
    // Default: kembalikan sebagai string.
    return String(value);
  };
  
  // Helper: Dapatkan kunci pengurutan untuk nilai.
  // Numerik: angka itu sendiri. DATE: timestamp. STRING: string.
  // String kosong & NaN numerik dapat perlakuan khusus agar urutannya benar.
  const getSortKey = (value, type) => {
    if (type === 'NUMERIC') {
      const num = parseFloat(value);
      // String kosong di NUMERIC (missing) diurutkan paling akhir.
      if (value === "") return Infinity;
      // NaN (dari string non-numerik) diurutkan setelah angka, sebelum string kosong.
      return isNaN(num) ? String(value) : num;
    } else if (type === 'DATE') {
      // Untuk DATE, konversi ke timestamp untuk pengurutan.
      // Fungsi ini harusnya ada.
      if (typeof self.dateStringToSpssSeconds === 'function') {
          const spssSeconds = self.dateStringToSpssSeconds(String(value));
          if (spssSeconds !== null) return spssSeconds;
      }
      return String(value); // Fallback jika konversi gagal.
    } else if (type === 'STRING' && value === ""){
        // String kosong (valid) diurutkan paling awal untuk tipe STRING.
        return "";
    }
    return String(value);
  };
  
  // Kalkulasi tabel frekuensi untuk satu variabel.
  const calculateFrequencyForVariable = (variableItem, weightData, globalOptions) => {
    const { variable, data } = variableItem;
    const { type, label, name, missing: missingDefinition, decimals, values: valueLabels } = variable;
    const displayTitle = (label && String(label).trim() !== '') ? label : name;
    const sortOrder = globalOptions.display.order === 'descending' ? -1 : 1;

    let totalN_weighted = 0;
    let validN_weighted = 0;
    const validCounts = new Map(); // Map: originalValue -> { frequency_unweighted, frequency_weighted }
    const missingInfo = {
        system: { frequency_unweighted: 0, frequency_weighted: 0, values: new Set() },
        userDiscrete: new Map(), // Map: originalMissingValue -> { frequency_unweighted, frequency_weighted }
        userRange: { frequency_unweighted: 0, frequency_weighted: 0, values: new Set() } 
    };

    for (let i = 0; i < data.length; i++) {
      const rawValue = data[i];
      const weight = weightData && weightData[i] !== null && !isNaN(weightData[i]) && weightData[i] > 0 ? weightData[i] : 1;
      totalN_weighted += weight;

      const missingCheck = checkMissing(rawValue, missingDefinition, type);
  
      if (missingCheck.isMissing) {
        if (missingCheck.missingType === "System") {
            missingInfo.system.frequency_unweighted++;
            missingInfo.system.frequency_weighted += weight;
            missingInfo.system.values.add(missingCheck.originalMissingValue);
        } else if (missingCheck.missingType === "UserDefined"){
            const key = String(missingCheck.originalMissingValue);
            let current = missingInfo.userDiscrete.get(key);
            if (!current) {
                current = { frequency_unweighted: 0, frequency_weighted: 0 };
                missingInfo.userDiscrete.set(key, current);
            }
            current.frequency_unweighted++;
            current.frequency_weighted += weight;
        } else if (missingCheck.missingType === "UserDefinedRange") {
            missingInfo.userRange.frequency_unweighted++;
            missingInfo.userRange.frequency_weighted += weight;
            missingInfo.userRange.values.add(rawValue); // Simpan nilai asli yang masuk range.
        }
      } else {
        validN_weighted += weight;
        let currentCounts = validCounts.get(rawValue);
        if (!currentCounts) {
            currentCounts = { frequency_unweighted: 0, frequency_weighted: 0 };
            validCounts.set(rawValue, currentCounts);
        }
        currentCounts.frequency_unweighted++;
        currentCounts.frequency_weighted += weight;
      }
    }
  
    // Proses dan urutkan nilai valid.
    let processedValid = [];
    for (const [originalValue, counts] of validCounts.entries()) {
      processedValid.push({
        originalValue,
        frequency_unweighted: counts.frequency_unweighted,
        frequency_weighted: counts.frequency_weighted,
        sortKey: getSortKey(originalValue, type)
      });
    }
    // Pengurutan utama berdasarkan sortKey, lalu originalValue sebagai fallback.
    processedValid.sort((a, b) => {
       if (a.sortKey < b.sortKey) return -1 * sortOrder;
       if (a.sortKey > b.sortKey) return 1 * sortOrder;
       // Fallback sort berdasarkan string dari originalValue jika sortKey sama.
       const strA = String(a.originalValue);
       const strB = String(b.originalValue);
       if (strA < strB) return -1 * sortOrder;
       if (strA > strB) return 1 * sortOrder;
       return 0;
     });
  
    const validRowsData = [];
    let cumulativePercent_weighted = 0.0;
    for (const item of processedValid) {
      const percent_weighted = totalN_weighted > 0 ? (item.frequency_weighted / totalN_weighted) * 100 : 0;
      const validPercent_weighted = validN_weighted > 0 ? (item.frequency_weighted / validN_weighted) * 100 : 0;
      if(!isNaN(validPercent_weighted)) {
          cumulativePercent_weighted += validPercent_weighted;
      }
      validRowsData.push({
        label: formatDisplayValue(item.originalValue, variable, globalOptions.display.dateFormat),
        frequency: globalOptions.display.showWeightedCounts ? round(item.frequency_weighted, 1) : item.frequency_unweighted,
        percent: round(percent_weighted, 1),
        validPercent: round(validPercent_weighted, 1),
        cumulativePercent: round(Math.min(cumulativePercent_weighted, 100), 1)
      });
    }
  
    // Proses dan siapkan baris untuk missing values.
    const missingRowsData = [];
    // 1. User-defined discrete missing values.
    let processedUserDiscreteMissing = [];
    for (const [originalMissingValue, counts] of missingInfo.userDiscrete.entries()) {
        processedUserDiscreteMissing.push({
            originalMissingValue,
            frequency_unweighted: counts.frequency_unweighted,
            frequency_weighted: counts.frequency_weighted,
            sortKey: getSortKey(originalMissingValue, type) 
        });
    }
    processedUserDiscreteMissing.sort((a, b) => {
        if (a.sortKey < b.sortKey) return -1;
        if (a.sortKey > b.sortKey) return 1;
        const strA = String(a.originalMissingValue);
        const strB = String(b.originalMissingValue);
        if (strA < strB) return -1;
        if (strA > strB) return 1;
        return 0;
    });

    processedUserDiscreteMissing.forEach(item => {
        const percent_weighted = totalN_weighted > 0 ? (item.frequency_weighted / totalN_weighted) * 100 : 0;
        // Cari value label untuk missing value jika ada.
        let displayLabel = formatDisplayValue(item.originalMissingValue, variable, globalOptions.display.dateFormat);
        if (valueLabels) {
            const numMissingVal = parseFloat(item.originalMissingValue);
            const foundLabel = valueLabels.find(vl => vl.value === numMissingVal);
            if (foundLabel) displayLabel = foundLabel.label;
        }

        missingRowsData.push({
            label: String(displayLabel),
            frequency: globalOptions.display.showWeightedCounts ? round(item.frequency_weighted, 1) : item.frequency_unweighted,
            percent: round(percent_weighted, 1),
            isSystem: false
        });
    });

    // 2. User-defined range missing values.
    if (missingInfo.userRange.frequency_unweighted > 0) {
        const percent_weighted = totalN_weighted > 0 ? (missingInfo.userRange.frequency_weighted / totalN_weighted) * 100 : 0;
        // Label untuk range missing bisa lebih deskriptif, e.g., "Range (LOW-HIGH)"
        // Untuk saat ini, gunakan label generik.
        missingRowsData.push({
            label: `User-defined Range Missing (${missingDefinition.range.min} - ${missingDefinition.range.max})`, 
            frequency: globalOptions.display.showWeightedCounts ? round(missingInfo.userRange.frequency_weighted, 1) : missingInfo.userRange.frequency_unweighted,
            percent: round(percent_weighted, 1),
            isSystem: false
        });
    }
  
    // 3. System missing values.
    if (missingInfo.system.frequency_unweighted > 0) {
      const percent_weighted = totalN_weighted > 0 ? (missingInfo.system.frequency_weighted / totalN_weighted) * 100 : 0;
      missingRowsData.push({
        label: "System Missing",
        frequency: globalOptions.display.showWeightedCounts ? round(missingInfo.system.frequency_weighted, 1) : missingInfo.system.frequency_unweighted,
        percent: round(percent_weighted, 1),
        isSystem: true
      });
    }
    
    const totalValidN_unweighted = processedValid.reduce((sum, item) => sum + item.frequency_unweighted, 0);
    const totalMissingN_weighted = totalN_weighted - validN_weighted;

    return {
      variableLabel: displayTitle,
      validRowsData,
      missingRowsData,
      totalN_unweighted: data.length, // Total kasus asli sebelum bobot.
      totalN_weighted: round(totalN_weighted,1),
      validN_unweighted: totalValidN_unweighted,
      validN_weighted: round(validN_weighted,1),
      totalMissingN_weighted: round(totalMissingN_weighted,1)
    };
  };
  
  // Format hasil analisis frekuensi menjadi struktur tabel output.
  const formatOutput = (analysisResults, globalOptions) => {
    const tables = [];
  
    if (!Array.isArray(analysisResults)) {
        return { tables: [] };
    }
  
    for (const result of analysisResults) {
      if (!result || typeof result !== 'object' || !result.variableLabel) {
          continue;
      }
  
      const tableRows = [];
      result.validRowsData.forEach(row => tableRows.push(row));
  
      // Total untuk Valid.
      if (result.validRowsData.length > 0) {
        tableRows.push({
          label: "Total Valid",
          frequency: globalOptions.display.showWeightedCounts ? result.validN_weighted : result.validN_unweighted,
          percent: round(result.validN_weighted / result.totalN_weighted * 100, 1) || 0,
          validPercent: 100.0,
          cumulativePercent: null // Tidak relevan untuk total.
        });
      }
  
      // Baris untuk Missing (jika ada).
      let totalMissingPercent = 0;
      result.missingRowsData.forEach(row => {
        tableRows.push(row);
        totalMissingPercent += row.percent;
      });
  
      // Total untuk Missing.
      if (result.missingRowsData.length > 0) {
        tableRows.push({
          label: "Total Missing",
          frequency: result.totalMissingN_weighted, // Selalu weighted untuk total missing.
          percent: round(totalMissingPercent, 1),
          isSystem: false // Hanya penanda, tidak ada valid/cumulative percent.
        });
      }
  
      // Total Keseluruhan.
      tableRows.push({
        label: "Total",
        frequency: globalOptions.display.showWeightedCounts ? result.totalN_weighted : result.totalN_unweighted,
        percent: 100.0
      });
  
      tables.push({
        title: result.variableLabel,
        columnHeaders: [
          { header: "", key: "label" },
          { header: "Frequency", key: "frequency" },
          { header: "Percent", key: "percent" },
          { header: "Valid Percent", key: "validPercent" },
          { header: "Cumulative Percent", key: "cumulativePercent" }
        ],
        rows: tableRows,
        notes: globalOptions.display.showWeightedCounts && result.totalN_weighted !== result.totalN_unweighted ? "Frequencies are weighted." : ""
      });
    }
    return { tables };
  };
  
  // Fungsi utama worker: analisis frekuensi.
  const analyzeFrequencies = (inputData) => {
    const { variableItems, weightVariableData, options } = inputData;
    if (!variableItems || !Array.isArray(variableItems)) {
      throw new Error("Data variabel tidak valid.");
    }
    // Impor spssDateConverter jika belum ada (misalnya untuk checkMissing dan getSortKey tipe DATE)
    // SPSS_EPOCH_MILLIS juga dibutuhkan oleh formatDisplayValue.
    if (typeof self.spssSecondsToDateString !== 'function' || 
        typeof self.dateStringToSpssSeconds !== 'function' || 
        typeof self.SPSS_EPOCH_MILLIS === 'undefined') {
        try {
            self.importScripts('../spssDateConverter.js');
        } catch (e) {
            console.error("Gagal impor spssDateConverter.js di analyzeFrequencies:", e);
            // Mungkin throw error atau fallback jika fungsi sangat krusial dan tidak bisa jalan tanpanya
        }
    }

    const results = [];
    for (const varItem of variableItems) {
      results.push(calculateFrequencyForVariable(varItem, weightVariableData, options));
    }
    return formatOutput(results, options);
  };
  
  self.onmessage = function(event) {
    try {
      const result = analyzeFrequencies(event.data);
      self.postMessage({ success: true, frequencies: result });
    } catch (error) {
      console.error("Error in Frequencies worker:", error);
      self.postMessage({ success: false, error: error.message + (error.stack ? `\nStack: ${error.stack}` : '') });
    }
  };