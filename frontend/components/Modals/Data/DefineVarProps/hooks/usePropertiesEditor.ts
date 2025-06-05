import { useState, useEffect, useCallback, useRef } from 'react';
import { Variable, ValueLabel, MissingValuesSpec } from '@/types/Variable';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import Handsontable from 'handsontable'; // For types, actual instance in component

// Constants can be kept here or moved to a separate constants.ts if they grow
const DATE_FORMAT_SPECS = [
    { format: "dd-mmm-yyyy", type: "DATE", width: 11 },
    { format: "dd-mmm-yy", type: "DATE", width: 9 },
    { format: "mm/dd/yyyy", type: "ADATE", width: 10 },
    { format: "mm/dd/yy", type: "ADATE", width: 8 },
    { format: "dd.mm.yyyy", type: "EDATE", width: 10 },
    { format: "dd.mm.yy", type: "EDATE", width: 8 },
    { format: "yyyy/mm/dd", type: "SDATE", width: 10 },
    { format: "yy/mm/dd", type: "SDATE", width: 8 },
    { format: "yydddd", type: "JDATE", width: 5 },
    { format: "yyyyddd", type: "JDATE", width: 7 },
    { format: "q Q yyyy", type: "QYR", width: 8 },
    { format: "q Q yy", type: "QYR", width: 6 },
    { format: "mmm yyyy", type: "MOYR", width: 8 },
    { format: "mmm yy", type: "MOYR", width: 6 },
    { format: "ww WK yyyy", type: "WKYR", width: 10 },
    { format: "ww WK yy", type: "WKYR", width: 8 },
    { format: "dd-mmm-yyyy hh:mm", type: "DATETIME", width: 17 },
    { format: "dd-mmm-yyyy hh:mm:ss", type: "DATETIME", width: 20 },
    { format: "dd-mmm-yyyy hh:mm:ss.ss", type: "DATETIME", width: 23 },
    { format: "mm/dd/yyyy hh:mm", type: "DATETIME", width: 16 },
    { format: "mm/dd/yyyy hh:mm:ss", type: "DATETIME", width: 19 },
    { format: "yyyy-mm-dd hh:mm:ss.ss", type: "DATETIME", width: 22 },
    { format: "mm:ss", type: "TIME", width: 5 },
    { format: "mm:ss.ss", type: "TIME", width: 8 },
    { format: "hh:mm", type: "TIME", width: 5 },
    { format: "hh:mm:ss", type: "TIME", width: 8 },
    { format: "hh:mm:ss.ss", type: "TIME", width: 11 },
    { format: "ddd hh:mm", type: "DTIME", width: 9 },
    { format: "ddd hh:mm:ss", type: "DTIME", width: 12 },
    { format: "ddd hh:mm:ss.ss", type: "DTIME", width: 15 },
    { format: "Monday, Tuesday, ...", type: "WKDAY", width: 9 },
    { format: "Mon, Tue, Wed, ...", type: "WKDAY", width: 3 },
    { format: "January, February, ...", type: "MONTH", width: 9 },
    { format: "Jan, Feb, Mar, ...", type: "MONTH", width: 3 }
];

interface UsePropertiesEditorProps {
    initialVariables: Variable[];
    caseLimit: string;
    valueLimit: string;
    onSave?: (variables: Variable[]) => void;
    onClose: () => void;
}

export const usePropertiesEditor = ({
    initialVariables,
    caseLimit,
    valueLimit,
    onSave,
    onClose,
}: UsePropertiesEditorProps) => {
    const { data } = useDataStore();
    const { updateMultipleFields } = useVariableStore();

    // Ensure initialVariables always have tempId and values/missing are arrays
    const prepareInitialVariables = (vars: Variable[]): Variable[] => {
        return vars.map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}_${Date.now()}`,
            values: Array.isArray(v.values) ? v.values : [],
            missing: v.missing // Keep as is, might be null or an object
        }));
    };

    const [originalVariables] = useState<Variable[]>(prepareInitialVariables(initialVariables));
    const [modifiedVariables, setModifiedVariables] = useState<Variable[]>(prepareInitialVariables(initialVariables));
    
    const [selectedVariableIndex, setSelectedVariableIndex] = useState<number | null>(
        originalVariables.length > 0 ? 0 : null
    );
    
    const [currentVariable, setCurrentVariable] = useState<Variable | null>(
        selectedVariableIndex !== null && modifiedVariables[selectedVariableIndex] 
            ? { ...modifiedVariables[selectedVariableIndex] } 
            : null
    );

    const [variableGridData, setVariableGridData] = useState<Record<string, any[]>>({}); // Use tempId as key
    const [gridData, setGridData] = useState<any[]>([]); // For the current Handsontable instance
    
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [showMeasureDropdown, setShowMeasureDropdown] = useState(false);
    const [showDateFormatDropdown, setShowDateFormatDropdown] = useState(false);
    
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);
    const [suggestDialogOpen, setSuggestDialogOpen] = useState<boolean>(false);
    const [suggestedMeasure, setSuggestedMeasure] = useState<string>("");
    const [measurementExplanation, setMeasurementExplanation] = useState<string>("");
    const [unlabeledValuesCount, setUnlabeledValuesCount] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<string>("properties");

    // Helper to check if a type is a date type
    const isDateType = useCallback((type: string): boolean => {
        const dateTypes = DATE_FORMAT_SPECS.map(spec => spec.type);
        return dateTypes.includes(type);
    }, []);

    // Function to get unique values with counts
    const getUniqueValuesWithCounts = useCallback((columnIndex: number, variableType: string) => {
        if (!data || data.length === 0) return [];
        const casesToScan = parseInt(caseLimit, 10) || data.length;
        const dataToScan = data.slice(0, casesToScan);
        const columnValues = dataToScan
            .map(row => row[columnIndex])
            .filter(value => {
                if (variableType === "STRING") return value !== undefined;
                return value !== "" && value !== undefined && value !== null;
            });
        const valueCounts: Record<string, number> = {};
        columnValues.forEach(value => {
            const strValue = String(value);
            valueCounts[strValue] = (valueCounts[strValue] || 0) + 1;
        });
        const uniqueValues = Object.entries(valueCounts).map(([val, count]) => ({ value: val, count }));
        const limit = parseInt(valueLimit, 10) || uniqueValues.length;
        return uniqueValues.slice(0, limit);
    }, [data, caseLimit, valueLimit]);

    // Function to calculate unlabeled values
    const calculateUnlabeledValues = useCallback((uniqueValuesData: {value: string, count: number}[], valueLabels: ValueLabel[]) => {
        const valueLabelsMap = new Map(valueLabels.map(vl => [String(vl.value), vl.label]));
        return uniqueValuesData.filter(item => !valueLabelsMap.has(String(item.value))).length;
    }, []);

    // Effect to update gridData when currentVariable changes
    useEffect(() => {
        if (!currentVariable || !currentVariable.tempId) {
            setGridData([]);
            setUnlabeledValuesCount(0);
            return;
        }

        const currentVarTempId = currentVariable.tempId;

        if (variableGridData[currentVarTempId]) {
            setGridData(variableGridData[currentVarTempId]);
            const valueLabels = (variableGridData[currentVarTempId]
                .filter((row: any[]) => row[4] !== '' && row[5] !== '') || [] )
                .map((row: any[]) => ({
                    variableName: currentVariable.name,
                    value: isNaN(Number(row[4])) ? row[4] : Number(row[4]),
                    label: row[5]
                }));
            const uniqueValues = getUniqueValuesWithCounts(currentVariable.columnIndex, currentVariable.type);
            setUnlabeledValuesCount(calculateUnlabeledValues(uniqueValues, valueLabels));
        } else if (data && data.length > 0) {
            const uniqueValuesData = getUniqueValuesWithCounts(currentVariable.columnIndex, currentVariable.type);
            const valueLabelsMap = new Map(
                (currentVariable.values || []).map(vl => [String(vl.value), vl.label])
            );
            const missingValuesSet = new Set<string>();
            if (currentVariable.missing?.discrete) {
                currentVariable.missing.discrete.forEach(mv => missingValuesSet.add(String(mv)));
            }
            const newGridData = uniqueValuesData.map((item, index) => {
                const strValue = String(item.value);
                const label = valueLabelsMap.get(strValue) || '';
                const isMissing = missingValuesSet.has(strValue);
                return [
                    String(index + 1), // #
                    false,             // Changed (*)
                    isMissing,         // Missing
                    item.count,        // Count
                    strValue,          // Value
                    label,             // Label
                ];
            });
            setGridData(newGridData);
            setVariableGridData(prev => ({ ...prev, [currentVarTempId]: newGridData }));
            setUnlabeledValuesCount(calculateUnlabeledValues(uniqueValuesData, currentVariable.values || []));
        } else {
            const emptyGrid = [['1', false, false, 0, '', '']];
            setGridData(emptyGrid);
            if (currentVarTempId) { // Ensure tempId exists before setting
                setVariableGridData(prev => ({ ...prev, [currentVarTempId]: emptyGrid }));
            }
            setUnlabeledValuesCount(0);
        }
    }, [currentVariable, data, getUniqueValuesWithCounts, calculateUnlabeledValues, variableGridData, caseLimit, valueLimit]);

    // Function to save the current variable's state (from UI fields and grid) to modifiedVariables
    const saveCurrentVariableToModifiedList = useCallback(() => {
        if (!currentVariable || selectedVariableIndex === null || !currentVariable.tempId) return modifiedVariables;
        
        const valueLabels: ValueLabel[] = gridData
            .filter(row => row[4] !== '' && row[5] !== '')
            .map(row => ({
                variableName: currentVariable.name, // Ensure this is updated if name changes
                value: isNaN(Number(row[4])) ? row[4] : Number(row[4]),
                label: row[5]
            }));
        
        const missingDiscreteValues = gridData
            .filter(row => row[2] && row[4] !== '') // row[2] is 'Missing' checkbox
            .map(row => isNaN(Number(row[4])) ? String(row[4]) : Number(row[4]));

        const newMissingSpec: MissingValuesSpec | null = 
            (currentVariable.missing && currentVariable.missing.range !== undefined) ? 
            { ...currentVariable.missing, discrete: missingDiscreteValues.length > 0 ? missingDiscreteValues : undefined } :
            (missingDiscreteValues.length > 0 ? { discrete: missingDiscreteValues } : null);

        const updatedVarInList = {
            ...currentVariable,
            values: valueLabels,
            missing: newMissingSpec,
        };

        const newModifiedVariables = [...modifiedVariables];
        newModifiedVariables[selectedVariableIndex] = updatedVarInList;
        setModifiedVariables(newModifiedVariables);
        // Cache the grid data for this variable
        setVariableGridData(prev => ({ ...prev, [currentVariable.tempId!]: [...gridData] }));
        return newModifiedVariables;
    }, [currentVariable, selectedVariableIndex, gridData, modifiedVariables]);


    const handleVariableChange = useCallback((index: number) => {
        saveCurrentVariableToModifiedList(); // Save state of the outgoing variable
        setSelectedVariableIndex(index);
    }, [modifiedVariables, saveCurrentVariableToModifiedList]);

    const handleVariableFieldChange = useCallback((field: keyof Variable, value: any) => {
        if (!currentVariable) return;

        let updatedVar = { ...currentVariable, [field]: value };

        if (field === 'type') {
            if (isDateType(value as string)) {
                const defaultFormat = DATE_FORMAT_SPECS.find(spec => spec.type === value);
                if (defaultFormat) {
                    updatedVar.width = defaultFormat.width;
                }
            }
            // If type changes, clear cached grid data to force re-evaluation
            if (value !== currentVariable.type && currentVariable.tempId) {
                setVariableGridData(prev => {
                    const newData = { ...prev };
                    delete newData[currentVariable.tempId!];
                    return newData;
                });
            }
        }
        setCurrentVariable(updatedVar);
        // Defer updating modifiedVariables until save/switch to avoid partial updates
    }, [currentVariable, isDateType]);

    const handleGridDataChange = useCallback((changes: Handsontable.CellChange[] | null, source: Handsontable.ChangeSource) => {
        if (source === 'loadData' || !changes || !currentVariable || !currentVariable.tempId) {
            return; // Don't process loadData events or if no changes/currentVariable
        }

        // Create a new copy of gridData to modify
        const updatedGridData = gridData.map(row => [...row]);

        changes.forEach((changeItem) => {
            const row: number = changeItem[0];
            const propFromHot: unknown = changeItem[1]; // Use unknown for initial safety
            const oldValue: any = changeItem[2];
            const newValue: any = changeItem[3];

            let colIndex: number | undefined = undefined;

            if (typeof propFromHot === 'number') {
                colIndex = propFromHot;
            } else if (typeof propFromHot === 'string') {
                console.warn(`Handsontable 'prop' is a string ('${propFromHot}') for array data. Attempting to parse as int.`);
                const parsedProp = parseInt(propFromHot, 10);
                if (!isNaN(parsedProp)) {
                    colIndex = parsedProp;
                } else {
                    console.error('Failed to parse string prop to column index:', propFromHot);
                    return; // Skip this change if parsing fails
                }
            } else {
                console.error('Unsupported prop type from Handsontable changes for array data source:', typeof propFromHot, propFromHot);
                return; // Skip this change if prop type is not number or string
            }

            if (colIndex !== undefined && updatedGridData[row]) {
                updatedGridData[row][colIndex] = newValue;
                // If Value (col 4) or Label (col 5) column changed, mark row as changed (col 1)
                if ((colIndex === 4 || colIndex === 5) && newValue !== oldValue) {
                    updatedGridData[row][1] = true; // Mark as changed
                }
            }
        });
        
        setGridData(updatedGridData); // Update the state with the new grid data

        // Recalculate unlabeled values based on the *newly updated* gridData
        const currentLabels = updatedGridData
            .filter(row => row[4] !== '' && row[5] !== '') // Value and Label are not empty
            .map(row => ({
                variableName: currentVariable.name,
                value: isNaN(Number(row[4])) ? row[4] : Number(row[4]),
                label: row[5]
            }));
        const uniqueValues = getUniqueValuesWithCounts(currentVariable.columnIndex, currentVariable.type);
        setUnlabeledValuesCount(calculateUnlabeledValues(uniqueValues, currentLabels));
        
    }, [currentVariable, gridData, setGridData, getUniqueValuesWithCounts, calculateUnlabeledValues]);
    
    const handleAutoLabel = useCallback(() => {
        if (!currentVariable || !currentVariable.tempId) return;
        const newGridData = gridData.map(row => {
            if (row[4] && !row[5]) { 
                return [
                    row[0],true,row[2],row[3],row[4],row[4],
                ];
            }
            return [...row]; 
        });
        setGridData(newGridData);
        setVariableGridData(prev => ({ ...prev, [currentVariable.tempId!]: newGridData }));
        const currentLabels = newGridData
            .filter(row => row[4] !== '' && row[5] !== '')
            .map(row => ({ variableName: currentVariable.name, value: row[4], label: row[5] as string }));
        const uniqueValues = getUniqueValuesWithCounts(currentVariable.columnIndex, currentVariable.type);
        setUnlabeledValuesCount(calculateUnlabeledValues(uniqueValues, currentLabels));
    }, [gridData, setGridData, currentVariable, getUniqueValuesWithCounts, calculateUnlabeledValues]);

    // ----- Missing Values Handling (Simplified for now) -----
    // More complex missing value logic (range, etc.) would go here if needed.
    // For now, discrete missing values are handled via the grid's 'Missing' checkbox.

    // ----- Measurement Level Suggestion Logic -----
    const isMissingValueForSuggestion = useCallback((value: number | string | undefined | null, missingSpec: MissingValuesSpec | null): boolean => {
        if (value === undefined || value === null || String(value).trim() === "" || missingSpec === null) {
            return false; // Treat empty/null as non-missing for suggestion unless explicitly defined
        }
        const strValue = String(value);
        if (missingSpec.discrete && missingSpec.discrete.some(mv => String(mv) === strValue)) {
            return true;
        }
        if (missingSpec.range && typeof value === 'number') {
            const { min, max } = missingSpec.range;
            if (min !== undefined && max !== undefined && value >= min && value <= max) return true;
            if (min !== undefined && max === undefined && value >= min) return true;
            if (min === undefined && max !== undefined && value <= max) return true;
        }
        return false;
    }, []);

    const suggestMeasurementLevel = useCallback((variable: Variable | null) => {
        if (!variable || !data || data.length === 0) {
            return { level: "nominal", explanation: "Not enough data to suggest." };
        }
        const columnIndex = variable.columnIndex;
        const casesToScan = parseInt(caseLimit, 10) || data.length;
        const dataToScan = data.slice(0, casesToScan);
        const columnValues = dataToScan
            .map(row => row[columnIndex])
            .filter(value => !isMissingValueForSuggestion(value, variable.missing));
        
        if (columnValues.length === 0) {
            return { level: "nominal", explanation: "No valid (non-missing) values found." };
        }
        const uniqueValues = new Set(columnValues.map(v => String(v).trim()));
        const uniqueCount = uniqueValues.size;
        const allNumeric = columnValues.every(v => String(v).trim() !== "" && !isNaN(Number(String(v).trim())));
        const allIntegers = allNumeric && columnValues.every(v => Number.isInteger(Number(String(v).trim())));

        let minValue = Infinity, maxValue = -Infinity;
        if (allNumeric) {
            columnValues.forEach(v => {
                const num = Number(String(v).trim());
                if (num < minValue) minValue = num;
                if (num > maxValue) maxValue = num;
            });
        }

        const labeledValuesCount = (variable.values || []).length;
        const percentLabeled = uniqueCount > 0 ? (labeledValuesCount / uniqueCount) * 100 : 0;

        if (!allNumeric) return { level: "nominal", explanation: "Contains non-numeric values." };
        if (uniqueCount <= 10 && allIntegers) return { level: "ordinal", explanation: `Few unique integers (${uniqueCount}), suggests ordered categories.` };
        if (percentLabeled > 50 && uniqueCount <=20) return { level: "nominal", explanation: `Many values labeled (${percentLabeled.toFixed(0)}%), suggests nominal.` };        
        if (uniqueCount <=2) return {level: "nominal", explanation: `Only ${uniqueCount} unique values, suggests binary/nominal.`};
        return { level: "scale", explanation: "Numeric with diverse values, suggests scale." };

    }, [data, caseLimit, isMissingValueForSuggestion]);

    const handleSuggestMeasurement = useCallback(() => {
        if (!currentVariable) return;
        const suggestion = suggestMeasurementLevel(currentVariable);
        setSuggestedMeasure(suggestion.level);
        setMeasurementExplanation(suggestion.explanation);
        setSuggestDialogOpen(true);
    }, [currentVariable, suggestMeasurementLevel]);

    const handleAcceptSuggestion = useCallback(() => {
        if (currentVariable && suggestedMeasure) {
            handleVariableFieldChange('measure', suggestedMeasure as any);
            setSuggestDialogOpen(false);
        }
    }, [currentVariable, suggestedMeasure, handleVariableFieldChange]);

    // ----- Save Logic -----
    const handleSave = useCallback(async () => {
        const finalModifiedVariables = saveCurrentVariableToModifiedList(); // Save the currently active variable one last time
        try {
            const updatesToApply = finalModifiedVariables.filter(modVar => {
                const origVar = originalVariables.find(ov => ov.tempId === modVar.tempId);
                return origVar && JSON.stringify(origVar) !== JSON.stringify(modVar); // Basic change detection
            });

            for (const modifiedVariable of updatesToApply) {
                // Create a payload with only the fields that can be updated
                const { tempId, values, missing, name, label, type, width, decimals, role, measure, ...rest } = modifiedVariable;
                const updatePayload: Partial<Variable> = { values, missing, name, label, type, width, decimals, role, measure };                
                await updateMultipleFields(modifiedVariable.columnIndex, updatePayload as Variable); 
            }

            if (onSave) {
                onSave(finalModifiedVariables); // Pass all, even if unchanged, for consistency
            }
            onClose();
        } catch (error) {
            console.error("Error saving variables:", error);
            setErrorMessage("Failed to save variable changes.");
            setErrorDialogOpen(true);
        }
    }, [saveCurrentVariableToModifiedList, originalVariables, updateMultipleFields, onSave, onClose]);


    // Initialize currentVariable when component mounts or initialVariables change
    useEffect(() => {
        if (selectedVariableIndex !== null && modifiedVariables[selectedVariableIndex]) {
            setCurrentVariable({ ...modifiedVariables[selectedVariableIndex] });
        } else if (modifiedVariables.length > 0 && selectedVariableIndex === null) {
            // If no index selected but variables exist, select the first one.
            setSelectedVariableIndex(0);
        } else if (modifiedVariables.length === 0) {
            setCurrentVariable(null);
            setSelectedVariableIndex(null);
        }
    }, [selectedVariableIndex, modifiedVariables, setSelectedVariableIndex]);

    return {
        originalVariables, // For reference, or if needed by UI
        modifiedVariables, // The list of variables being edited, for the variable selector UI
        selectedVariableIndex,
        currentVariable, // The variable currently being edited in detail forms/grid
        variableGridData, // Not directly exposed, used internally for grid data persistence
        gridData, setGridData, // For Handsontable
        
        showTypeDropdown, setShowTypeDropdown,
        showRoleDropdown, setShowRoleDropdown,
        showMeasureDropdown, setShowMeasureDropdown,
        showDateFormatDropdown, setShowDateFormatDropdown,
        
        errorMessage, errorDialogOpen, setErrorDialogOpen,
        suggestDialogOpen, setSuggestDialogOpen, suggestedMeasure, measurementExplanation,
        unlabeledValuesCount,
        activeTab, setActiveTab,

        handleVariableChange,
        handleVariableFieldChange,
        handleGridDataChange, // For HoT afterChange
        handleAutoLabel,
        handleSuggestMeasurement,
        handleAcceptSuggestion,
        handleSave,
        isDateType, // Helper function that component might need for UI logic
        DATE_FORMAT_SPECS // Constants for dropdowns
    };
}; 