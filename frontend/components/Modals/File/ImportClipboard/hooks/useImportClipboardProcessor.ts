import { useState, useCallback } from "react";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable } from "@/types/Variable";
import { ClipboardProcessingOptions } from "../types"; // Updated path

export const useImportClipboardProcessor = () => {
    const { updateCells, resetData, addRows } = useDataStore();
    const { resetVariables, addVariable } = useVariableStore();
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const isDateString = useCallback((value: string, format: string): boolean => {
        const mdyRegex = /^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/;
        const dmyRegex = /^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/;
        const ymdRegex = /^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/;
        
        if (format === 'MDY' && mdyRegex.test(value)) return true;
        if (format === 'DMY' && dmyRegex.test(value)) return true;
        if (format === 'YMD' && ymdRegex.test(value)) return true;
        return false;
    }, []);

    const detectValueType = useCallback((value: string): string => {
        if (!value || value.trim() === '') return 'empty';
        
        const trimmedValue = value.trim();
        
        const numericRegex = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;
        if (numericRegex.test(trimmedValue)) {
            return 'number';
        }
        
        if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(trimmedValue)) {
            return 'date';
        }
        return 'text';
    }, []);

    const inferDataType = useCallback((value: string, dateFormat: string): string => {
        if (!value || value.trim() === '') return value;
        
        const trimmedValue = value.trim();
        
        const numericRegex = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;
        if (numericRegex.test(trimmedValue)) {
            return trimmedValue;
        }
        
        if (isDateString(trimmedValue, dateFormat)) {
            return trimmedValue;
        }
        return value;
    }, [isDateString]);
    
    const getDelimiterCharacter = useCallback((options: ClipboardProcessingOptions & { customDelimiter?: string }): string => {
        switch (options.delimiter) {
            case "tab": return "\t";
            case "comma": return ",";
            case "semicolon": return ";";
            case "space": return " ";
            case "custom": return options.customDelimiter || "\t";
            default: return "\t";
        }
    }, []);

    const excelStyleTextToColumns = useCallback((
        text: string, 
        options: {
            delimiterType: 'delimited' | 'fixed';
            delimiter?: string; 
            textQualifier?: string;
            treatConsecutiveDelimitersAsOne?: boolean;
            trimWhitespace?: boolean;
            detectDataTypes?: boolean;
            fixedWidthPositions?: number[];
            dateFormat?: string;
            hasHeaderRow?: boolean;
        }
    ): string[][] => {
        console.log('[excelStyleTextToColumns] INPUT Text:', text.substring(0, 100), 'Options:', options);
        console.log('Excel Text to Columns - Processing with options:', options);
        console.log('Input text sample:', text.slice(0, 200) + (text.length > 200 ? '...' : ''));
        
        const {
            delimiterType = 'delimited',
            delimiter = '\t',
            textQualifier = '"',
            treatConsecutiveDelimitersAsOne = true,
            trimWhitespace = true,
            detectDataTypes = true,
            fixedWidthPositions = [],
            dateFormat = 'MDY',
            hasHeaderRow = true
        } = options;
        
        const result: string[][] = [];
        
        if (delimiterType === 'delimited') {
            console.log('Using delimited mode with delimiter:', JSON.stringify(delimiter));
            console.log('Text qualifier:', JSON.stringify(textQualifier));
            
            const rows = text.split(/\r?\n/);
            console.log(`Found ${rows.length} rows`);
            
            rows.forEach((row, rowIndex) => {
                if (row.trim() === '') return;
                
                const parsedRow: string[] = [];
                let currentField = '';
                let insideQuotes = false;
                let lastCharWasDelimiter = false;
                
                for (let i = 0; i < row.length; i++) {
                    const char = row[i];
                    
                    if (char === textQualifier) {
                        if (i < row.length - 1 && row[i + 1] === textQualifier) {
                            currentField += textQualifier;
                            i++;
                        } else {
                            insideQuotes = !insideQuotes;
                        }
                        lastCharWasDelimiter = false;
                    }
                    else if (char === delimiter && !insideQuotes) {
                        if (treatConsecutiveDelimitersAsOne && lastCharWasDelimiter) {
                            lastCharWasDelimiter = true;
                            continue;
                        }
                        
                        const fieldValue = trimWhitespace ? currentField.trim() : currentField;
                        parsedRow.push(fieldValue);
                        currentField = '';
                        lastCharWasDelimiter = true;
                    }
                    else {
                        currentField += char;
                        lastCharWasDelimiter = false;
                    }
                }
                
                const fieldValue = trimWhitespace ? currentField.trim() : currentField;
                parsedRow.push(fieldValue);
                
                if (detectDataTypes) {
                    for (let i = 0; i < parsedRow.length; i++) {
                        parsedRow[i] = inferDataType(parsedRow[i], dateFormat);
                    }
                }
                
                result.push(parsedRow);
                
                if (rowIndex < 3) {
                    console.log(`Row ${rowIndex + 1}:`, parsedRow);
                }
            });
        }
        else if (delimiterType === 'fixed') {
            console.log('Using fixed width mode with positions:', fixedWidthPositions);
            if (!fixedWidthPositions || fixedWidthPositions.length === 0) {
                console.error('No fixed width positions provided');
                return [];
            }
            
            const rows = text.split(/\r?\n/);
            console.log(`Found ${rows.length} rows`);
            
            rows.forEach((row, rowIndex) => {
                if (row.trim() === '') return;
                
                const parsedRow: string[] = [];
                let startPos = 0;
                
                for (const position of fixedWidthPositions) {
                    const fieldValue = row.substring(startPos, position);
                    parsedRow.push(trimWhitespace ? fieldValue.trim() : fieldValue);
                    startPos = position;
                }
                
                if (startPos < row.length) {
                    const fieldValue = row.substring(startPos);
                    parsedRow.push(trimWhitespace ? fieldValue.trim() : fieldValue);
                }
                
                if (detectDataTypes) {
                    for (let i = 0; i < parsedRow.length; i++) {
                        parsedRow[i] = inferDataType(parsedRow[i], dateFormat);
                    }
                }
                
                result.push(parsedRow);
                
                if (rowIndex < 3) {
                    console.log(`Row ${rowIndex + 1}:`, parsedRow);
                }
            });
        }
        
        console.log(`Text to Columns processing complete. Parsed ${result.length} rows`);
        
        if (result.length > 0) {
            const columnCount = result[0].length;
            console.log(`Number of columns: ${columnCount}`);
            
            const typeSamples: {[column: number]: Set<string>} = {};
            
            for (let i = 0; i < Math.min(result.length, 10); i++) {
                const row = result[i];
                for (let j = 0; j < row.length; j++) {
                    if (!typeSamples[j]) {
                        typeSamples[j] = new Set();
                    }
                    const type = detectValueType(row[j]);
                    typeSamples[j].add(type);
                }
            }
            
            console.log('Column type samples:');
            Object.keys(typeSamples).forEach(colIndex => {
                const columnIndex = Number(colIndex);
                const types = Array.from(typeSamples[columnIndex]).join(', ');
                console.log(`Column ${columnIndex + 1}: ${types}`);
            });
        }
        
        console.log('[excelStyleTextToColumns] OUTPUT Result:', JSON.stringify(result));
        return result;
    }, [inferDataType, detectValueType]);
    
    const parsePreviewData = useCallback(async (
        text: string,
        options: ClipboardProcessingOptions & { customDelimiter?: string }
    ): Promise<string[][]> => {
        if (!text) return [];

        const delimiter = getDelimiterCharacter(options);
        const rows = text.split(/\r?\n/);
        
        const processedRows = rows
            .filter(row => options.skipEmptyRows ? row.trim() !== '' : true)
            .map(row => {
                const cells = row.split(delimiter);
                return cells.map(cell => {
                    let processedCell = cell;
                    if (options.trimWhitespace) {
                        processedCell = processedCell.trim();
                    }
                    return processedCell;
                });
            });
            
        return processedRows;
    }, [getDelimiterCharacter]);

    const getVariableByIndex = useCallback(async (columnIndex: number): Promise<Variable | undefined> => {
        try {
            const { variables } = useVariableStore.getState();
            return variables.find(v => v.columnIndex === columnIndex);
        } catch (e) {
            console.error("Error getting variable:", e);
            return undefined;
        }
    }, []);

    const processClipboardData = useCallback(async (
        text: string,
        options: ClipboardProcessingOptions & { customDelimiter?: string }
    ) => {
        if (!text) {
            throw new Error("No text data provided");
        }

        setIsProcessing(true);
        
        try {
            let parsedData: string[][];
            
            if (options.excelProcessedData && options.excelProcessedData.length > 0) {
                console.log('Using pre-processed data from Excel-style parser');
                parsedData = options.excelProcessedData;
            } else {
                console.log('Starting Excel-style Text to Columns processing...');
                const excelParsedData = excelStyleTextToColumns(text, {
                    delimiterType: 'delimited',
                    delimiter: getDelimiterCharacter(options),
                    textQualifier: '"', 
                    treatConsecutiveDelimitersAsOne: options.skipEmptyRows,
                    trimWhitespace: options.trimWhitespace,
                    detectDataTypes: options.detectDataTypes,
                    hasHeaderRow: options.firstRowAsHeader
                });
                console.log('Excel-style Text to Columns processing complete.');
                parsedData = excelParsedData; // Use the result from excelStyleTextToColumns
            }
            
            if (parsedData.length === 0) {
                throw new Error("No valid data found in the pasted text");
            }
            
            await resetData();
            await resetVariables();
            
            let headers: string[];
            let dataRows: string[][];
            
            if (options.firstRowAsHeader && parsedData.length > 0) {
                headers = parsedData[0];
                dataRows = parsedData.slice(1);
            } else {
                headers = Array.from(
                    { length: parsedData[0].length },
                    (_, i) => `VAR${String(i + 1).padStart(3, '0')}`
                );
                dataRows = parsedData;
            }
            
            for (let colIndex = 0; colIndex < headers.length; colIndex++) {
                const colData = dataRows.map(row => row[colIndex] || '');
                const variableName = headers[colIndex] || `VAR${String(colIndex + 1).padStart(3, '0')}`;

                let isNumeric = false;
                let maxDecimalPlaces = 0;
                
                if (options.detectDataTypes) {
                    isNumeric = true;
                    for (const value of colData) {
                        if (value === null || value.trim() === '') continue;
                        if (isNaN(Number(value))) {
                            isNumeric = false;
                            break;
                        }
                        const parts = value.split('.');
                        if (parts.length > 1) {
                            maxDecimalPlaces = Math.max(maxDecimalPlaces, parts[1].length);
                        }
                    }
                }

                const newVar: Variable = {
                    columnIndex: colIndex,
                    name: variableName,
                    type: isNumeric ? 'NUMERIC' : 'STRING',
                    width: isNumeric ? 8 : Math.min(32767, Math.max(8, ...colData.map(v => v?.length || 0), variableName.length)),
                    decimals: isNumeric ? Math.min(maxDecimalPlaces, 16) : 0,
                    label: '',
                    columns: 12,
                    align: isNumeric ? 'right' : 'left',
                    measure: isNumeric ? 'scale' : 'nominal',
                    role: 'input',
                    values: [],
                    missing: null
                };
                
                await addVariable(newVar);
            }
            
            if (dataRows.length > 0) {
                const rowIndices = Array.from({ length: dataRows.length }, (_, i) => i);
                await addRows(rowIndices);
            }
            
            const allUpdates = [];
            for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
                const row = dataRows[rowIndex];
                for (let colIndex = 0; colIndex < row.length; colIndex++) {
                    let valueToSet = row[colIndex] || '';
                    if (options.detectDataTypes) {
                        const variable = await getVariableByIndex(colIndex);
                        if (variable && variable.type === 'NUMERIC' && valueToSet.trim() !== '') {
                            const numValue = Number(valueToSet);
                            if (!isNaN(numValue)) {
                                valueToSet = String(numValue);
                            }
                        }
                    }
                    allUpdates.push({ row: rowIndex, col: colIndex, value: valueToSet });
                }
            }
            
            if (allUpdates.length > 0) {
                await updateCells(allUpdates);
            }
            
            return { headers, data: dataRows };
            
        } catch (error) {
            console.error("Error processing clipboard data:", error);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    }, [
        excelStyleTextToColumns, 
        getDelimiterCharacter, 
        getVariableByIndex, 
        updateCells, 
        resetData, 
        addRows, 
        resetVariables, 
        addVariable,
        // setIsProcessing // Not needed as it's stable
    ]);

    return {
        isProcessing,
        parsePreviewData,
        processClipboardData,
        excelStyleTextToColumns
    };
}; 