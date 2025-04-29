// /workers/DescriptiveStatistics/Frequencies/frequency.js

const round = (num, decimals) => {
    if (num === null || num === undefined) return null;
    const factor = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * factor) / factor;
  };
  
  const checkMissing = (value, missingDefinition, type) => {
    if (value === "") {
      if (type === 'NUMERIC' || type === 'DATE') {
        return { isMissing: true, missingType: "System", originalMissingValue: "" };
      } else {
        return { isMissing: false, missingType: null, originalMissingValue: null };
      }
    }
  
    if (!missingDefinition) {
      return { isMissing: false, missingType: null, originalMissingValue: null };
    }
  
    if (missingDefinition.discrete && Array.isArray(missingDefinition.discrete)) {
      let valueToCompare = value;
      if (type === 'NUMERIC' && typeof value !== 'number') {
         const numVal = parseFloat(value);
         if (!isNaN(numVal)) {
           valueToCompare = numVal;
         }
      }
  
      for (const missingVal of missingDefinition.discrete) {
         let discreteMissingToCompare = missingVal;
         if (type === 'NUMERIC' && typeof missingVal === 'string'){
              const numMissing = parseFloat(missingVal);
              if(!isNaN(numMissing)){
                  discreteMissingToCompare = numMissing;
              }
         }
        if (valueToCompare === discreteMissingToCompare || String(valueToCompare) === String(missingVal)) {
             return { isMissing: true, missingType: "UserDefined", originalMissingValue: missingVal };
        }
      }
    }
  
    if (type === 'NUMERIC' && missingDefinition.range) {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (!isNaN(numValue)) {
        const min = parseFloat(missingDefinition.range.min);
        const max = parseFloat(missingDefinition.range.max);
        if (!isNaN(min) && !isNaN(max) && numValue >= min && numValue <= max) {
          return { isMissing: true, missingType: "UserDefined", originalMissingValue: value };
        }
      }
    }
  
    return { isMissing: false, missingType: null, originalMissingValue: null };
  };
  
  
  const formatDisplayValue = (value, variableMeta) => {
      if (variableMeta.type === 'STRING' && value === "") {
          return '""';
      }
      const { type, decimals, values: valueLabels } = variableMeta;
  
    if (type === 'NUMERIC') {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
       if (isNaN(numValue)) return String(value);
  
      if (valueLabels && valueLabels.length > 0) {
        const foundLabel = valueLabels.find(vl => vl.value === numValue);
        if (foundLabel) return foundLabel.label;
      }
      return numValue.toFixed(decimals);
    } else if (type === 'DATE') {
      if (typeof value === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(value)) {
         const parts = value.split('-');
         const dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
        if (!isNaN(dateObj.getTime())) {
           const options = { day: '2-digit', month: 'short', year: 'numeric' };
           const formatted = dateObj.toLocaleDateString('en-GB', options).replace(/ /g, '-').toUpperCase();
           return formatted;
        }
      }
      return String(value);
    }
    return String(value);
  };
  
  const getSortKey = (value, type) => {
    if (type === 'NUMERIC') {
      const num = parseFloat(value);
      if (value === "") return Infinity;
      return isNaN(num) ? String(value) : num;
    } else if (type === 'DATE') {
      if (typeof value === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(value)) {
          const parts = value.split('-');
          const dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
          return isNaN(dateObj.getTime()) ? value : dateObj.getTime();
      }
      return value;
    } else if (type === 'STRING' && value === ""){
        return "";
    }
    return String(value);
  };
  
  
  const calculateFrequencyForVariable = (variableItem) => {
    // Note: Weighting is not implemented in this frequency calculation version
    // If weighting is needed, logic to multiply frequencies by corresponding weights
    // from inputData.weightVariableData would need to be added here and downstream.
    const { variable, data } = variableItem;
    const { type, label, name, missing: missingDefinition, decimals } = variable;
  
    const displayTitle = (label && String(label).trim() !== '') ? label : name;
  
    let totalN = 0;
    let validN = 0;
    const validCounts = new Map();
    const missingCounts = new Map();
    let systemMissingN = 0;
  
    for (const rawValue of data) {
      totalN++;
      const missingCheck = checkMissing(rawValue, missingDefinition, type);
  
      if (missingCheck.isMissing) {
        if (missingCheck.missingType === "System") {
          systemMissingN++;
          const current = missingCounts.get("System") || { frequency: 0, missingType: 'System' };
          current.frequency++;
          missingCounts.set("System", current);
        } else {
          const originalMissingValue = missingCheck.originalMissingValue;
          const current = missingCounts.get(originalMissingValue) || { frequency: 0, missingType: 'UserDefined' };
          current.frequency++;
          missingCounts.set(originalMissingValue, current);
        }
      } else {
        validN++;
        const currentCount = validCounts.get(rawValue) || 0;
        validCounts.set(rawValue, currentCount + 1);
      }
    }
  
    let processedValid = [];
    for (const [originalValue, frequency] of validCounts.entries()) {
      processedValid.push({
        originalValue,
        frequency,
        sortKey: getSortKey(originalValue, type)
      });
    }
    processedValid.sort((a, b) => {
       if (a.sortKey < b.sortKey) return -1;
       if (a.sortKey > b.sortKey) return 1;
       if (String(a.originalValue) < String(b.originalValue)) return -1;
       if (String(a.originalValue) > String(b.originalValue)) return 1;
       return 0;
     });
  
    const validRowsData = [];
    let cumulativePercent = 0.0;
    for (const item of processedValid) {
      const frequency = item.frequency;
      const percent = totalN > 0 ? (frequency / totalN) * 100 : 0;
      const validPercent = validN > 0 ? (frequency / validN) * 100 : 0;
      if(!isNaN(validPercent)) {
          cumulativePercent += validPercent;
      }
      validRowsData.push({
        label: formatDisplayValue(item.originalValue, variable),
        frequency,
        percent,
        validPercent,
        cumulativePercent: Math.min(cumulativePercent, 100)
      });
    }
  
      let processedMissing = [];
      for (const [originalMissingValue, data] of missingCounts.entries()) {
          if (originalMissingValue === "System") continue;
          processedMissing.push({
              originalMissingValue,
              frequency: data.frequency,
              sortKey: getSortKey(originalMissingValue, type)
          });
      }
      processedMissing.sort((a, b) => {
          if (a.sortKey < b.sortKey) return -1;
          if (a.sortKey > b.sortKey) return 1;
           if (String(a.originalMissingValue) < String(b.originalMissingValue)) return -1;
           if (String(a.originalMissingValue) > String(b.originalMissingValue)) return 1;
          return 0;
      });
  
    const missingRowsData = [];
      for (const item of processedMissing) {
          const frequency = item.frequency;
          const percent = totalN > 0 ? (frequency / totalN) * 100 : 0;
          let displayLabel = item.originalMissingValue;
          if (type === 'NUMERIC') {
              const numVal = parseFloat(item.originalMissingValue);
              if (!isNaN(numVal)) {
                  displayLabel = numVal.toFixed(decimals);
              }
          }
          missingRowsData.push({
              label: String(displayLabel),
              frequency,
              percent,
              isSystem: false
          });
      }
  
    if (systemMissingN > 0) {
      const frequency = systemMissingN;
      const percent = totalN > 0 ? (frequency / totalN) * 100 : 0;
      missingRowsData.push({
        label: "System",
        frequency,
        percent,
        isSystem: true
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
  
  const formatOutput = (analysisResults) => {
    const tables = [];
  
    if (!Array.isArray(analysisResults)) {
        // console.error("Internal error: Analysis results are not an array.");
        return { tables: [] };
    }
  
    for (const result of analysisResults) {
      if (!result || typeof result !== 'object' || !result.variableLabel) {
          // console.warn("Skipping invalid analysis result:", result);
          continue;
      }
  
      const tableObject = {
        title: result.variableLabel,
        // Define structure needed by the consuming code (useFrequenciesAnalysis)
        // Assuming it expects the full table structure including headers and rows
        columnHeaders: [
          { header: "" },
          { header: "" },
          { header: "Frequency", key: "frequency" },
          { header: "Percent", key: "percent" },
          { header: "Valid Percent", key: "valid_percent" },
          { header: "Cumulative Percent", key: "cumulative_percent" }
        ],
        rows: [],
        // Add components and description keys as expected by addStatistic
        components: ['Frequency Table'], // Indicate a table component is the primary output
        description: `Frequency table for ${result.variableLabel}`
      };
  
      if(Array.isArray(result.validRowsData)){
          result.validRowsData.forEach(validRow => {
            tableObject.rows.push({
              rowHeader: ["Valid", validRow.label],
              frequency: validRow.frequency,
              percent: round(validRow.percent, 1),
              valid_percent: round(validRow.validPercent, 1),
              cumulative_percent: round(validRow.cumulativePercent, 1)
            });
          });
      }
  
      if (result.validN > 0) {
        tableObject.rows.push({
          rowHeader: ["Valid", "Total"],
          frequency: result.validN,
          percent: round((result.validN / result.totalN) * 100, 1),
          valid_percent: 100.0,
          cumulative_percent: null
        });
      }
  
      if (result.totalMissingN > 0 && Array.isArray(result.missingRowsData)) {
        let numberOfMissingRowsAdded = 0;
  
        result.missingRowsData.forEach(missingRow => {
          tableObject.rows.push({
            rowHeader: ["Missing", missingRow.label],
            frequency: missingRow.frequency,
            percent: round(missingRow.percent, 1),
            valid_percent: null,
            cumulative_percent: null
          });
          numberOfMissingRowsAdded++;
        });
  
        if (numberOfMissingRowsAdded > 1) {
           tableObject.rows.push({
              rowHeader: ["Missing", "Total"],
              frequency: result.totalMissingN,
              percent: round((result.totalMissingN / result.totalN) * 100, 1),
              valid_percent: null,
              cumulative_percent: null
          });
        }
      }
  
      tableObject.rows.push({
        rowHeader: ["Total", null],
        frequency: result.totalN,
        percent: 100.0,
        valid_percent: null,
        cumulative_percent: null
      });
  
      // Push the fully structured table object
      tables.push(tableObject);
    }
  
    // The worker should return an array of these table objects
    return tables;
  };
  
  
  const analyzeFrequencies = (inputData) => {
    if (!inputData || !Array.isArray(inputData.variableData)) {
        // console.error("Invalid input data structure received by worker.");
        throw new Error("Invalid input data structure received by worker.");
    }
  
    const analysisResults = inputData.variableData
      .map(variableItem => {
          try {
              // Pass weight data if needed in the future
              return calculateFrequencyForVariable(variableItem /*, inputData.weightVariableData */);
          } catch (error) {
              // console.error(`Error processing variable ${variableItem?.variable?.name || 'unknown'}:`, error);
              // Rethrow or handle appropriately; returning null might hide errors
               throw new Error(`Error processing variable ${variableItem?.variable?.name || 'unknown'}: ${error.message}`);
             // return null; // Or handle error more gracefully
          }
      })
      .filter(result => result !== null);
  
    // FormatOutput now returns the array of table objects directly
    return formatOutput(analysisResults);
  };
  
  // Web Worker message handler
  self.onmessage = function(event) {
      try {
          const inputData = event.data;
          // Note: Weighting data (inputData.weightVariableData) is received but not yet used.
          const frequencyTables = analyzeFrequencies(inputData);
          // Send back an array of formatted table objects
          self.postMessage({ success: true, frequencies: frequencyTables });
      } catch (error) {
          self.postMessage({ success: false, error: error.message });
      }
  };