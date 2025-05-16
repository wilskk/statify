// Worker untuk kalkulasi tabel frekuensi.

// Helper: Pembulatan angka ke jumlah desimal tertentu.
const round = (num, decimals) => {
    if (num === null || num === undefined) return null;
    const factor = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * factor) / factor;
  };
  
  // Helper: Cek apakah nilai adalah missing (system atau user-defined).
  const checkMissing = (value, missingDefinition, type) => {
    if (value === "") {
      if (type === 'NUMERIC' || type === 'DATE') {
        return { isMissing: true, missingType: "System", originalMissingValue: "" };
      } else {
        return { isMissing: false, missingType: null, originalMissingValue: null };
      }
    }
    // Ensure missingDefinition is not null or undefined before trying to access its properties
    if (!missingDefinition) {
      return { isMissing: false, missingType: null, originalMissingValue: null };
    }
  
    if (missingDefinition.discrete && Array.isArray(missingDefinition.discrete)) {
      // Standardize comparison for numeric types by converting string discrete values to numbers
      let valueToCompare = value;
      if (type === 'NUMERIC' && typeof value !== 'number') {
         const numVal = parseFloat(value);
         if (!isNaN(numVal)) {
            valueToCompare = numVal; // Compare as number if possible
         }
      } // For non-numeric types, or if conversion fails, valueToCompare remains original
  
      for (const missingVal of missingDefinition.discrete) {
         let discreteMissingToCompare = missingVal;
         if (type === 'NUMERIC' && typeof missingVal === 'string'){
              const numMissing = parseFloat(missingVal);
              if(!isNaN(numMissing)){
                  discreteMissingToCompare = numMissing;
              }
         }
        // Check both typed and string comparison to be safe, especially for mixed types
        if (valueToCompare === discreteMissingToCompare || String(valueToCompare) === String(missingVal)) {
             return { isMissing: true, missingType: "UserDefined", originalMissingValue: missingVal };
        }
      }
    }
  
    // Handle range missing, ensuring value is numeric for comparison
    if (type === 'NUMERIC' && missingDefinition.range) {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (!isNaN(numValue)) {
        const min = parseFloat(missingDefinition.range.min);
        const max = parseFloat(missingDefinition.range.max);
        if (!isNaN(min) && !isNaN(max) && numValue >= min && numValue <= max) {
          return { isMissing: true, missingType: "UserDefined", originalMissingValue: value }; // Store original value that triggered missing
        }
      }
    }
  
    return { isMissing: false, missingType: null, originalMissingValue: null };
  };
  
  // Helper: Format nilai untuk tampilan di tabel frekuensi.
  // Terapkan value labels jika ada. Format khusus untuk DATE & STRING kosong.
  const formatDisplayValue = (value, variableMeta) => {
      // For STRING type, if the value is an empty string, display it as "".
      if (variableMeta.type === 'STRING' && value === "") {
          return '""';
      }
      const { type, decimals, values: valueLabels } = variableMeta;
  
    if (type === 'NUMERIC') {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
       if (isNaN(numValue)) return String(value); // If not a number, return as string
  
      // Check for value labels first
      if (valueLabels && valueLabels.length > 0) {
        const foundLabel = valueLabels.find(vl => vl.value === numValue);
        if (foundLabel) return foundLabel.label;
      }
      // Otherwise, format as a number with specified decimals
      return numValue.toFixed(decimals);
    } else if (type === 'DATE') {
      // Handle date formatting (example: DD-MMM-YYYY)
      // This assumes date values are stored in a recognizable format or as Date objects
      // For simplicity, assuming date strings are DD-MM-YYYY and need reformatting
      if (typeof value === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(value)) {
         const parts = value.split('-'); // DD, MM, YYYY
         // Ensure it's a valid date before formatting to avoid errors
         const dateObj = new Date(parts[2], parts[1] - 1, parts[0]); // Year, Month (0-indexed), Day
              if (!isNaN(dateObj.getTime())) {
           // Example: 01-JAN-2023
           const options = { day: '2-digit', month: 'short', year: 'numeric' };
           const formatted = dateObj.toLocaleDateString('en-GB', options).replace(/ /g, '-').toUpperCase();
           return formatted;
              }
          }
      return String(value); // Fallback for unparseable or non-standard date formats
      }
    // For other types or if no specific formatting, return as string
    return String(value);
  };
  
  // Helper: Dapatkan kunci pengurutan untuk nilai.
  // Numerik: angka itu sendiri. DATE: timestamp. STRING: string.
  // String kosong & NaN numerik dapat perlakuan khusus agar urutannya benar.
  const getSortKey = (value, type) => {
    if (type === 'NUMERIC') {
      const num = parseFloat(value);
      if (value === "") return Infinity; // Sort empty strings (interpreted as system missing for numeric) last
      return isNaN(num) ? String(value) : num; // Sort non-numeric strings alphabetically, numbers numerically
    } else if (type === 'DATE') {
      // Attempt to parse date for sorting, assumes DD-MM-YYYY format
      if (typeof value === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(value)) {
          const parts = value.split('-');
          const dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
          return isNaN(dateObj.getTime()) ? value : dateObj.getTime(); // Sort by timestamp or string if unparseable
      }
      return value; // Fallback sort by original value if not in expected date format
    } else if (type === 'STRING' && value === ""){
        return ""; // Ensure empty strings are sorted appropriately, often first or as a distinct category
    }
    return String(value); // Default to string sorting for other types or unhandled cases
  };
  
  // Kalkulasi tabel frekuensi untuk satu variabel.
  const calculateFrequencyForVariable = (variableItem) => {
    // Note: Weighting is not implemented in this frequency calculation version
    // If weighting is needed, logic to multiply frequencies by corresponding weights
    // from inputData.weightVariableData would need to be added here and downstream.
    const { variable, data } = variableItem;
    const { type, label, name, missing: missingDefinition, decimals } = variable;
  
    const displayTitle = (label && String(label).trim() !== '') ? label : name;
    // console.log(`Processing variable: ${displayTitle} (Type: ${type})`);
  
    let totalN = 0; // Total observations including missing
    let validN = 0;   // Total valid (non-missing) observations
    const validCounts = new Map(); // Stores frequency of valid values
    const missingCounts = new Map(); // Stores frequency of missing values, keyed by original missing value
    let systemMissingN = 0; // Specifically count system missing (e.g., empty strings for numeric)

    for (const rawValue of data) {
      totalN++;
      const missingCheck = checkMissing(rawValue, missingDefinition, type);
  
      if (missingCheck.isMissing) {
        if (missingCheck.missingType === "System") {
          systemMissingN++;
          // Aggregate system missing under a generic "System" key or handle as per display needs
          const current = missingCounts.get("System") || { frequency: 0, missingType: 'System' };
          current.frequency++;
          missingCounts.set("System", current);
        } else {
          // User-defined missing
          const originalMissingValue = missingCheck.originalMissingValue;
          const current = missingCounts.get(originalMissingValue) || { frequency: 0, missingType: 'UserDefined' };
          current.frequency++;
          missingCounts.set(originalMissingValue, current);
        }
      } else {
        // Valid value
        validN++;
        const currentCount = validCounts.get(rawValue) || 0;
        validCounts.set(rawValue, currentCount + 1);
      }
    }
  
    // Process and sort valid values
    let processedValid = [];
    for (const [originalValue, frequency] of validCounts.entries()) {
      processedValid.push({
        originalValue,
        frequency,
        sortKey: getSortKey(originalValue, type)
      });
    }
    // Sort valid values based on their sort key, then by original value as a tie-breaker
    processedValid.sort((a, b) => {
       if (a.sortKey < b.sortKey) return -1;
       if (a.sortKey > b.sortKey) return 1;
       // Tie-breaking for numerics that might have same string representation but different type (e.g. 5 vs "5")
       // This primarily helps ensure consistent ordering for identical sortKeys.
       if (String(a.originalValue) < String(b.originalValue)) return -1;
       if (String(a.originalValue) > String(b.originalValue)) return 1;
       return 0;
     });
  
    // Prepare rows for valid data including percentages
    const validRowsData = [];
    let cumulativePercent = 0.0;
    for (const item of processedValid) {
      const frequency = item.frequency;
      const percent = totalN > 0 ? (frequency / totalN) * 100 : 0;
      const validPercent = validN > 0 ? (frequency / validN) * 100 : 0;
      if(!isNaN(validPercent)) { // Ensure cumulativePercent only increases with valid numbers
          cumulativePercent += validPercent;
      }
      validRowsData.push({
        label: formatDisplayValue(item.originalValue, variable), // Use variable meta for formatting
        frequency,
        percent, // Percentage of total N
        validPercent, // Percentage of valid N
        cumulativePercent: Math.min(cumulativePercent, 100) // Cap at 100%
      });
    }
  
      // Process and sort user-defined missing values
      let processedMissing = [];
      for (const [originalMissingValue, data] of missingCounts.entries()) {
          if (originalMissingValue === "System") continue; // Skip aggregated system missing for now
          processedMissing.push({
            originalMissingValue,
              frequency: data.frequency,
            sortKey: getSortKey(originalMissingValue, type) // Use original value for sorting missing
        });
    }
    // Sort missing values similar to valid values
      processedMissing.sort((a, b) => {
        if (a.sortKey < b.sortKey) return -1;
        if (a.sortKey > b.sortKey) return 1;
           if (String(a.originalMissingValue) < String(b.originalMissingValue)) return -1;
           if (String(a.originalMissingValue) > String(b.originalMissingValue)) return 1;
        return 0;
    });

    // Prepare rows for missing data
    const missingRowsData = [];
      for (const item of processedMissing) {
          const frequency = item.frequency;
          const percent = totalN > 0 ? (frequency / totalN) * 100 : 0;
          let displayLabel = item.originalMissingValue;
          // Apply numeric formatting for missing values if they are numbers
          if (type === 'NUMERIC') {
              const numVal = parseFloat(item.originalMissingValue);
              if (!isNaN(numVal)) {
                  displayLabel = numVal.toFixed(decimals);
              }
        }
        missingRowsData.push({
            label: String(displayLabel), // Ensure label is string
              frequency,
              percent,
            isSystem: false // Mark as not system missing
        });
    }
  
    // Add system missing row if any system missing values were counted
    if (systemMissingN > 0) {
      const frequency = systemMissingN;
      const percent = totalN > 0 ? (frequency / totalN) * 100 : 0;
      missingRowsData.push({
        label: "System", // Standard label for system missing
        frequency,
        percent,
        isSystem: true // Mark as system missing
      });
    }
    
    return {
      variableLabel: displayTitle,
      validRowsData,
      missingRowsData,
      totalN,
      validN,
      totalMissingN: totalN - validN
    };
  };
  
  // Web Worker message handler
  self.onmessage = function(event) {
    try {
          const inputData = event.data;
          // Calculate raw frequency data for each variable
          const rawFrequencyData = inputData.variableData
            .map(variableItem => {
              try {
                return calculateFrequencyForVariable(variableItem);
              } catch (error) {
                throw new Error(`Error processing variable ${variableItem?.variable?.name || 'unknown'}: ${error.message}`);
              }
            })
            .filter(result => result !== null);
            
          // Return the raw frequency data without formatting
          self.postMessage({ success: true, frequencies: rawFrequencyData });
    } catch (error) {
          self.postMessage({ success: false, error: error.message });
    }
  };