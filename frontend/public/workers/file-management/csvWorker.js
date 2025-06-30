// Web Worker for parsing CSV files
self.onmessage = (e) => {
  const { fileContent, options } = e.data;
  const { firstLineContains, removeLeading, removeTrailing, delimiter, decimal } = options;
  try {
    let delimChar = ',';
    if (delimiter === 'semicolon') delimChar = ';';
    else if (delimiter === 'tab') delimChar = '\t';

    const lines = fileContent.split(/\r\n|\n|\r/);
    const parsedRows = [];
    for (let line of lines) {
      if (line.trim() === '') continue;
      if (removeLeading) line = line.replace(/^\s+/, '');
      if (removeTrailing) line = line.replace(/\s+$/, '');
      parsedRows.push(line.split(delimChar));
    }
    if (parsedRows.length === 0) throw new Error('No data found in the file after processing.');

    let headerRow;
    if (firstLineContains && parsedRows.length > 0) {
      headerRow = parsedRows.shift();
      if (!headerRow || headerRow.length === 0) throw new Error('Header row is empty or missing.');
    }

    if (parsedRows.length === 0 && !headerRow) throw new Error('The file appears to be empty or contains no valid data rows.');

    const numCols = headerRow ? headerRow.length : (parsedRows.length > 0 ? parsedRows[0].length : 0);
    if (numCols === 0) throw new Error('Could not determine the number of columns. The file might be empty or malformed.');

    // Generate variable definitions
    const variables = [];
    for (let colIndex = 0; colIndex < numCols; colIndex++) {
      const colData = parsedRows.map(row => row[colIndex] || '');
      const variableName = (firstLineContains && headerRow && headerRow[colIndex])
        ? headerRow[colIndex].trim()
        : `VAR${String(colIndex + 1).padStart(3,'0')}`;
      let isNumeric = true;
      let potentialDecimals = 0;
      for (const val of colData) {
        if (val === null || val.trim() === '') continue;
        const processedVal = decimal === 'comma' ? val.replace(',', '.') : val;
        if (isNaN(Number(processedVal))) { isNumeric = false; break; }
        const parts = processedVal.split('.');
        if (parts.length > 1) potentialDecimals = Math.max(potentialDecimals, parts[1].length);
      }
      const newVar = {
        columnIndex: colIndex,
        name: variableName,
        type: isNumeric ? 'NUMERIC' : 'STRING',
        width: isNumeric ? 8 : Math.min(32767, Math.max(8, ...colData.map(v=>v.length), variableName.length)),
        decimals: isNumeric ? Math.min(potentialDecimals,16) : 0,
        label: '',
        columns: 72,
        align: isNumeric ? 'right':'left',
        measure: isNumeric ? 'scale':'nominal',
        role: 'input',
        values: [],
        missing: null
      };
      variables.push(newVar);
    }
    // Build processed data
    const data = parsedRows.map(row => row.map((val, idx) => {
      let v = val || '';
      const variable = variables[idx];
      if (variable.type === 'NUMERIC' && v.trim() !== '') {
        const proc = decimal==='comma'?v.replace(',','.') : v;
        if (isNaN(Number(proc))) v = '';
        else v = proc;
      }
      return v;
    }));

    self.postMessage({ result: { variables, data } });
  } catch (err) {
    self.postMessage({ error: err.message || String(err) });
  }
};
