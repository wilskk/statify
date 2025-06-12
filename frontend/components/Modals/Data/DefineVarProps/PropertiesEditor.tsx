"use client"

import React, { FC, useState, useEffect, useRef, useCallback } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Dialog,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    ChevronDown,
    AlertCircle,
    Info
} from "lucide-react";
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.css';
import Handsontable from 'handsontable';
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable, ValueLabel, MissingValuesSpec } from "@/types/Variable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Register all Handsontable modules
registerAllModules();

// Dropdown options
const ROLE_OPTIONS = ["input", "target", "both", "none", "partition", "split"];
const MEASURE_OPTIONS = ["scale", "ordinal", "nominal"];
const TYPE_OPTIONS = [
    "NUMERIC", "COMMA", "DOT", "SCIENTIFIC", "DATE", "DOLLAR",
    "CCA", "CCB", "CCC", "CCD", "CCE", "PERCENT", "STRING", "RESTRICTED_NUMERIC"
];

// Date format specifications
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

interface PropertiesEditorProps {
    onClose: () => void;
    variables: Variable[];
    caseLimit: string;
    valueLimit: string;
    onSave?: (variables: Variable[]) => void;
    containerType?: "dialog" | "sidebar";
}

const PropertiesEditorContent: FC<PropertiesEditorProps> = ({
    onClose,
    variables,
    caseLimit,
    valueLimit,
    onSave,
    containerType = "dialog"
}) => {
    const { data } = useDataStore();
    const { updateMultipleFields } = useVariableStore();
    const [originalVariables] = useState<Variable[]>(variables);
    const [selectedVariableIndex, setSelectedVariableIndex] = useState<number | null>(
        variables.length > 0 ? 0 : null
    );
    const [currentVariable, setCurrentVariable] = useState<Variable | null>(
        variables.length > 0 ? {
            ...variables[0],
            values: Array.isArray(variables[0].values) ? variables[0].values : [],
            missing: variables[0].missing
        } : null
    );
    const [modifiedVariables, setModifiedVariables] = useState<Variable[]>(
        variables.map((variable): Variable => ({
            ...variable,
            values: Array.isArray(variable.values) ? variable.values : [],
            missing: variable.missing
        }))
    );
    const [variableGridData, setVariableGridData] = useState<Record<number, any[]>>({});
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [showMeasureDropdown, setShowMeasureDropdown] = useState(false);
    const [showDateFormatDropdown, setShowDateFormatDropdown] = useState(false);
    const [labeledVariables, setLabeledVariables] = useState<Record<number, boolean>>({});
    const [gridData, setGridData] = useState<any[]>([]);
    const hotTableRef = useRef<any>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);
    const [suggestDialogOpen, setSuggestDialogOpen] = useState<boolean>(false);
    const [suggestedMeasure, setSuggestedMeasure] = useState<string>("");
    const [measurementExplanation, setMeasurementExplanation] = useState<string>("");
    const [unlabeledValuesCount, setUnlabeledValuesCount] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<string>("properties");

    const valueLabelsGridContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeTab === 'labels' && hotTableRef.current) {
            const hotInstance = (hotTableRef.current as any).hotInstance as Handsontable | undefined;
            if (hotInstance) {
                setTimeout(() => {
                    hotInstance.render();
                }, 50);
            }
        }
    }, [activeTab, gridData]);

    const getUniqueValuesWithCounts = useCallback((columnIndex: number, variableType: string) => {
        if (!data || data.length === 0) return [];
        const casesToScan = parseInt(caseLimit, 10) || data.length;
        const dataToScan = data.slice(0, casesToScan);
        const columnValues = dataToScan
            .map(row => row[columnIndex])
            .filter(value => {
                if (variableType === "STRING") {
                    return value !== undefined;
                } else {
                    return value !== "" && value !== undefined;
                }
            });
        const valueCounts: Record<string, number> = {};
        columnValues.forEach(value => {
            const strValue = String(value);
            valueCounts[strValue] = (valueCounts[strValue] || 0) + 1;
        });
        const uniqueValues = Object.entries(valueCounts).map(([value, count]) => ({
            value,
            count
        }));
        const limit = parseInt(valueLimit, 10) || uniqueValues.length;
        return uniqueValues.slice(0, limit);
    }, [data, caseLimit, valueLimit]);

    const calculateUnlabeledValues = useCallback((uniqueValuesData: any[], valueLabels: ValueLabel[]) => {
        const valueLabelsMap = new Map(
            valueLabels.map(vl => [String(vl.value), vl.label])
        );
        return uniqueValuesData.filter(
            item => !valueLabelsMap.has(String(item.value))
        ).length;
    }, []);

    useEffect(() => {
        if (!currentVariable) return;
        if (variableGridData[currentVariable.columnIndex]) {
            setGridData(variableGridData[currentVariable.columnIndex]);
            const savedGridData = variableGridData[currentVariable.columnIndex];
            const valueLabels = savedGridData
                .filter(row => row[4] !== '' && row[5] !== '')
                .map(row => ({
                    variableName: currentVariable.name,
                    value: isNaN(Number(row[4])) ? row[4] : Number(row[4]),
                    label: row[5]
                }));
            const uniqueValues = getUniqueValuesWithCounts(
                currentVariable.columnIndex,
                currentVariable.type
            );
            setUnlabeledValuesCount(calculateUnlabeledValues(uniqueValues, valueLabels));
        } else if (data && data.length > 0) {
            const uniqueValuesData = getUniqueValuesWithCounts(
                currentVariable.columnIndex,
                currentVariable.type
            );
            const valueLabelsMap = new Map(
                Array.isArray(currentVariable.values)
                    ? currentVariable.values.map(vl => [String(vl.value), vl.label])
                    : []
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
                    String(index + 1),
                    false,
                    isMissing,
                    item.count,
                    strValue,
                    label,
                ];
            });
            setGridData(newGridData);
            setVariableGridData(prev => ({
                ...prev,
                [currentVariable.columnIndex]: newGridData
            }));
            const unlabeledCount = calculateUnlabeledValues(
                uniqueValuesData,
                Array.isArray(currentVariable.values) ? currentVariable.values : []
            );
            setUnlabeledValuesCount(unlabeledCount);
        } else {
            const emptyGrid = [['1', false, false, 0, '', '']];
            setGridData(emptyGrid);
            setVariableGridData(prev => ({
                ...prev,
                [currentVariable.columnIndex]: emptyGrid
            }));
            setUnlabeledValuesCount(0);
        }
    }, [currentVariable, data, getUniqueValuesWithCounts, calculateUnlabeledValues, variableGridData]);

    const saveCurrentVariableState = (): Variable[] => {
        if (!currentVariable || selectedVariableIndex === null) return modifiedVariables;
        const valueLabels: ValueLabel[] = gridData
            .filter(row => row[4] !== '' && row[5] !== '')
            .map(row => ({
                variableName: currentVariable.name,
                value: isNaN(Number(row[4])) ? row[4] : Number(row[4]),
                label: row[5]
            }));
        const missingDiscreteValues = gridData
            .filter(row => row[2] && row[4] !== '')
            .map(row => isNaN(Number(row[4])) ? String(row[4]) : Number(row[4]));
        const newMissingSpec: MissingValuesSpec | null = missingDiscreteValues.length > 0
            ? { discrete: missingDiscreteValues }
            : null;
        const updatedVariable = {
            ...currentVariable,
            values: valueLabels,
            missing: newMissingSpec,
        };
        const updatedVariables = [...modifiedVariables];
        updatedVariables[selectedVariableIndex] = updatedVariable;
        setModifiedVariables(updatedVariables);
        setVariableGridData(prev => ({
            ...prev,
            [currentVariable.columnIndex]: [...gridData]
        }));
        return updatedVariables;
    };

    const handleVariableChange = (index: number) => {
        saveCurrentVariableState();
        setSelectedVariableIndex(index);
        const variable = modifiedVariables[index];
        setCurrentVariable({
            ...variable,
            values: Array.isArray(variable.values) ? variable.values : [],
            missing: variable.missing
        });
    };

    const handleVariableFieldChange = (field: keyof Variable, value: any) => {
        if (!currentVariable) return;
        const updatedVariable = { ...currentVariable, [field]: value };
        if (field === 'type' && isDateType(value)) {
            const defaultFormat = DATE_FORMAT_SPECS.find(spec => spec.type === value);
            if (defaultFormat) {
                updatedVariable.width = defaultFormat.width;
            }
        }
        if (field === 'type' && value !== currentVariable.type) {
            setVariableGridData(prev => {
                const newData = { ...prev };
                delete newData[currentVariable.columnIndex];
                return newData;
            });
        }
        setCurrentVariable(updatedVariable);
        const updatedVariables = [...modifiedVariables];
        if (selectedVariableIndex !== null) {
            updatedVariables[selectedVariableIndex] = updatedVariable;
            setModifiedVariables(updatedVariables);
        }
    };

    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={12} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={12} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={12} className="text-muted-foreground mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={12} className="text-muted-foreground mr-1 flex-shrink-0" />
                    : <Ruler size={12} className="text-muted-foreground mr-1 flex-shrink-0" />;
        }
    };

    const isDateType = (type: string): boolean => {
        const dateTypes = ["DATE", "ADATE", "EDATE", "SDATE", "JDATE", "QYR", "MOYR",
            "WKYR", "DATETIME", "TIME", "DTIME", "WKDAY", "MONTH"];
        return dateTypes.includes(type);
    };

    const isCurrencyType = (type: string): boolean => {
        const currencyTypes = ["CCA", "CCB", "CCC", "CCD", "CCE", "DOLLAR"];
        return currencyTypes.includes(type);
    };

    const getFormattedTypeName = (type: string): string => {
        switch (type) {
            case "NUMERIC": return "Numeric";
            case "COMMA": return "Comma";
            case "DOT": return "Dot";
            case "SCIENTIFIC": return "Scientific";
            case "DATE": return "Date";
            case "DOLLAR": return "Dollar";
            case "CCA": return "Currency A";
            case "CCB": return "Currency B";
            case "CCC": return "Currency C";
            case "CCD": return "Currency D";
            case "CCE": return "Currency E";
            case "PERCENT": return "Percent";
            case "STRING": return "String";
            case "RESTRICTED_NUMERIC": return "Restricted Numeric";
            default: return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        }
    };

    const formatDropdownText = (text: string): string => {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    };

    const handleDataChange = (changes: any[] | null, source: string) => {
        if (source === 'edit' && changes) {
            const newData = [...gridData];
            changes.forEach(([row, col, oldValue, newValue]) => {
                newData[row][col] = newValue;
                if ((col === 4 || col === 5) && newValue !== oldValue) {
                    newData[row][1] = true;
                }
            });
            setGridData(newData);
            if (currentVariable) {
                setVariableGridData(prev => ({
                    ...prev,
                    [currentVariable.columnIndex]: newData
                }));
                const currentLabels = newData
                    .filter(row => row[4] !== '' && row[5] !== '')
                    .map(row => ({
                        variableName: currentVariable.name,
                        value: isNaN(Number(row[4])) ? row[4] : Number(row[4]),
                        label: row[5]
                    }));
                const uniqueValues = getUniqueValuesWithCounts(
                    currentVariable.columnIndex,
                    currentVariable.type
                );
                const newUnlabeledCount = calculateUnlabeledValues(uniqueValues, currentLabels);
                setUnlabeledValuesCount(newUnlabeledCount);
            }
        }
    };

    const handleAutoLabel = () => {
        if (!currentVariable) return;
        const newGridData = gridData.map(row => {
            if (row[4] && !row[5]) {
                return [
                    row[0],
                    true,
                    row[2],
                    row[3],
                    row[4],
                    row[4],
                ];
            }
            return [...row];
        });
        setGridData(newGridData);
        setVariableGridData(prev => ({
            ...prev,
            [currentVariable.columnIndex]: newGridData
        }));
        if (currentVariable) {
            const currentLabels = newGridData
                .filter(row => row[4] !== '' && row[5] !== '')
                .map(row => ({
                    variableName: currentVariable.name,
                    value: isNaN(Number(row[4])) ? row[4] : Number(row[4]),
                    label: row[5]
                }));
            const uniqueValues = getUniqueValuesWithCounts(
                currentVariable.columnIndex,
                currentVariable.type
            );
            const newUnlabeledCount = calculateUnlabeledValues(uniqueValues, currentLabels);
            setUnlabeledValuesCount(newUnlabeledCount);
        }
    };

    const handleCopyFromVariable = () => {
        setErrorMessage("This feature would allow copying properties from another variable.");
        setErrorDialogOpen(true);
    };

    const handleCopyToVariables = () => {
        setErrorMessage("This feature would allow copying properties to other variables.");
        setErrorDialogOpen(true);
    };

    const handleSuggestMeasurement = () => {
        if (!currentVariable || !data || data.length === 0) return;
        const suggestion = suggestMeasurementLevel(currentVariable, data);
        setSuggestedMeasure(suggestion.level);
        setMeasurementExplanation(suggestion.explanation);
        setSuggestDialogOpen(true);
    };

    const isMissingValue = (value: number | string | undefined | null, missingSpec: MissingValuesSpec | null): boolean => {
        if (value === undefined || value === null || value === "" || missingSpec === null) {
            return false;
        }
        const strValue = String(value);
        if (missingSpec.discrete && missingSpec.discrete.some(mv => String(mv) === strValue)) {
            return true;
        }
        if (missingSpec.range && typeof value === 'number') {
            const { min, max } = missingSpec.range;
            if (min !== undefined && max !== undefined && value >= min && value <= max) {
                return true;
            }
            if (min !== undefined && max === undefined && value >= min) {
                return true;
            }
            if (min === undefined && max !== undefined && value <= max) {
                return true;
            }
        }
        return false;
    };

    const suggestMeasurementLevel = (variable: Variable, dataSet: any[]) => {
        const columnIndex = variable.columnIndex;
        const casesToScan = parseInt(caseLimit, 10) || dataSet.length;
        const dataToScan = dataSet.slice(0, casesToScan);
        const columnValues = dataToScan
            .map(row => row[columnIndex])
            .filter(value => {
                if (value === "" || value === undefined || value === null) return false;
                return !isMissingValue(value, variable.missing);
            });
        if (columnValues.length === 0) {
            return {
                level: "nominal",
                explanation: "No valid values were found after excluding missing values."
            };
        }
        const uniqueValues = new Set(columnValues.map(String));
        const uniqueCount = uniqueValues.size;
        const allNumeric = columnValues.every(
            value => typeof value === "number" || (!isNaN(Number(value)) && String(value).trim() !== "")
        );
        const allIntegers = allNumeric && columnValues.every(
            value => Number.isInteger(Number(value))
        );
        let hasNegatives = false;
        let minValue = Infinity;
        let maxValue = -Infinity;
        if (allNumeric) {
            columnValues.forEach(value => {
                const num = Number(value);
                if (num < 0) hasNegatives = true;
                if (num < minValue) minValue = num;
                if (num > maxValue) maxValue = num;
            });
        }
        const labeledValuesCount = Array.isArray(variable.values) ? variable.values.length : 0;
        const percentLabeled = uniqueCount > 0 ? (labeledValuesCount / uniqueCount) * 100 : 0;
        if (!allNumeric) {
            return {
                level: "nominal",
                explanation: "Contains non-numeric values, suggesting categorical data best treated as nominal."
            };
        } else if (uniqueCount <= 10 && allIntegers && minValue >= 0) {
            return {
                level: "ordinal",
                explanation: `Contains ${uniqueCount} unique integer values (ranging from ${minValue} to ${maxValue}), suggesting ordered categories.`
            };
        } else if (uniqueCount <= 20 && allIntegers) {
            return {
                level: "ordinal",
                explanation: `Contains ${uniqueCount} unique values with a limited range, suggesting ordered categories.`
            };
        } else if (labeledValuesCount > 0 && percentLabeled > 50) {
            return {
                level: "nominal",
                explanation: `${labeledValuesCount} of ${uniqueCount} values have labels (${percentLabeled.toFixed(1)}%), suggesting categorical data.`
            };
        } else if (allNumeric && uniqueCount > 20) {
            return {
                level: "scale",
                explanation: `Contains ${uniqueCount} unique numeric values with a wide range (${minValue} to ${maxValue}), suggesting continuous data.`
            };
        } else {
            return {
                level: "scale",
                explanation: "Contains numeric values with properties consistent with measurement data."
            };
        }
    };

    const handleAcceptSuggestion = () => {
        if (currentVariable && suggestedMeasure) {
            handleVariableFieldChange('measure', suggestedMeasure as any);
            setSuggestDialogOpen(false);
        }
    };

    const handleSave = async () => {
        const currentModifiedVariables = saveCurrentVariableState();
        try {
            for (const modifiedVariable of currentModifiedVariables) {
                const originalVariable = originalVariables.find(
                    v => v.columnIndex === modifiedVariable.columnIndex
                );
                if (originalVariable) {
                    await updateMultipleFields(modifiedVariable.columnIndex, modifiedVariable);
                }
            }
            if (onSave) {
                const updatedOriginalVariables = currentModifiedVariables.filter(
                    modVar => originalVariables.some(origVar => origVar.columnIndex === modVar.columnIndex)
                );
                onSave(updatedOriginalVariables);
            }
            console.log("Saving changes to selected variables");
            onClose();
        } catch (error) {
            console.error("Error saving variables:", error);
            setErrorMessage("Failed to save variable changes.");
            setErrorDialogOpen(true);
        }
    };

    const checkboxRenderer = (instance: any, td: HTMLTableCellElement, row: number, col: number, prop: string | number, value: any) => {
        td.innerHTML = '';
        td.style.textAlign = 'center';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = Boolean(value);
        checkbox.style.width = '12px';
        checkbox.style.height = '12px';
        checkbox.style.cursor = 'pointer';
        checkbox.style.margin = '1px';
        checkbox.addEventListener('change', () => {
            const newData = [...gridData];
            newData[row][col] = checkbox.checked;
            setGridData(newData);
            if (currentVariable) {
                setVariableGridData(prev => ({
                    ...prev,
                    [currentVariable.columnIndex]: newData
                }));
            }
        });
        td.appendChild(checkbox);
        return td;
    };

    const renderDropdown = (options: string[], currentValue: string, onChange: (value: string) => void, onCloseDropdown: () => void) => {
        return (
            <div className="absolute top-full left-0 z-10 mt-1 w-full bg-popover border border-border rounded shadow-lg max-h-40 overflow-y-auto">
                {options.map((option) => (
                    <div
                        key={option}
                        className="text-xs p-1 hover:bg-accent cursor-pointer text-popover-foreground"
                        onClick={() => {
                            onChange(option);
                            onCloseDropdown(); 
                        }}
                        title={formatDropdownText(option)}
                    >
                        {formatDropdownText(option)}
                    </div>
                ))}
            </div>
        );
    };

    const renderDateFormatDropdown = (currentVar: Variable | null, handleVarFieldChange: (field: keyof Variable, value: any) => void, setShowDd: (show: boolean) => void) => {
        if (!currentVar) return null;
        return (
            <div className="absolute top-full right-0 z-10 mt-1 w-60 bg-popover border border-border rounded shadow-lg max-h-40 overflow-y-auto">
                {DATE_FORMAT_SPECS.map((format, index) => (
                    <div
                        key={index}
                        className="text-xs p-1 hover:bg-accent cursor-pointer text-popover-foreground"
                        onClick={() => {
                            handleVarFieldChange('type', format.type);
                            handleVarFieldChange('width', format.width);
                            setShowDd(false);
                        }}
                        title={format.format}
                    >
                        {format.format}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col flex-grow h-full">
            <div className="grid grid-cols-12 gap-4 p-4 flex-grow overflow-y-auto">
                {/* Left Column - Scanned Variable List */}
                <div className="col-span-4 flex flex-col">
                    <div className="text-xs font-semibold mb-1 text-foreground">Scanned Variable List</div>
                    <div className="border border-border rounded flex-grow overflow-y-auto bg-card">
                        <div className="bg-muted border-b border-border">
                            <div className="grid grid-cols-12 text-xs font-semibold text-muted-foreground">
                                <div className="col-span-2 p-1 text-center border-r border-border overflow-hidden" title="Labeled">
                                    <span className="block truncate">Labeled</span>
                                </div>
                                <div className="col-span-4 p-1 text-center border-r border-border overflow-hidden" title="Measurement">
                                    <span className="block truncate">Measurement</span>
                                </div>
                                <div className="col-span-2 p-1 text-center border-r border-border overflow-hidden" title="Role">
                                    <span className="block truncate">Role</span>
                                </div>
                                <div className="col-span-4 p-1 text-center overflow-hidden" title="Variable">
                                    <span className="block truncate">Variable</span>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-y-auto">
                            {modifiedVariables.map((variable, index) => (
                                <div
                                    key={variable.columnIndex}
                                    className={`grid grid-cols-12 text-xs cursor-pointer border-b border-border hover:bg-accent ${selectedVariableIndex === index ? 'bg-primary text-primary-foreground' : 'text-card-foreground'}`}
                                    onClick={() => handleVariableChange(index)}
                                >
                                    <div className="col-span-2 p-1 text-center border-r border-border">
                                        <input
                                            type="checkbox"
                                            className="w-3 h-3 accent-primary"
                                            checked={variable.values.length > 0}
                                            readOnly
                                        />
                                    </div>
                                    <div className="col-span-4 p-1 text-center border-r border-border flex items-center justify-center"
                                         title={formatDropdownText(variable.measure)}>
                                        {getVariableIcon(variable)}
                                        <span className="truncate">{formatDropdownText(variable.measure)}</span>
                                    </div>
                                    <div className="col-span-2 p-1 text-center border-r border-border truncate"
                                         title={formatDropdownText(variable.role)}>
                                        {formatDropdownText(variable.role)}
                                    </div>
                                    <div className="col-span-4 p-1 text-center truncate"
                                         title={variable.name}>
                                        {variable.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <div>Cases scanned: <Input value={caseLimit} className="w-10 h-5 text-xs border border-input rounded px-1 bg-muted text-muted-foreground" readOnly /></div>
                        <div>Value list limit: <Input value={valueLimit} className="w-10 h-5 text-xs border border-input rounded px-1 bg-muted text-muted-foreground" readOnly /></div>
                    </div>
                </div>

                {/* Right Column - Variable Properties & Value Labels Editor with Tabs */}
                <div className="col-span-8 flex flex-col">
                    {currentVariable ? (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow">
                            <TabsList className="grid w-full grid-cols-2 mb-2">
                                <TabsTrigger value="properties">Properties</TabsTrigger>
                                <TabsTrigger value="labels">Value Labels</TabsTrigger>
                            </TabsList>
                            <TabsContent value="properties" className="flex-grow overflow-y-auto p-1">
                                <div className="space-y-3">
                                    {/* Current Variable */}
                                    <div className="grid grid-cols-12 items-center gap-x-2">
                                        <div className="col-span-4 text-xs font-semibold text-foreground text-right pr-1">Current Variable:</div>
                                        <div className="col-span-8">
                                            <Input
                                                value={currentVariable.name}
                                                onChange={(e) => handleVariableFieldChange('name', e.target.value)}
                                                className="h-5 w-full text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Label */}
                                    <div className="grid grid-cols-12 items-center gap-x-2">
                                        <div className="col-span-4 text-xs font-semibold text-foreground text-right pr-1">Label:</div>
                                        <div className="col-span-8">
                                            <Input
                                                value={currentVariable.label || ''}
                                                onChange={(e) => handleVariableFieldChange('label', e.target.value)}
                                                className="h-5 w-full text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Measurement Level */}
                                    <div className="grid grid-cols-12 items-center gap-x-2">
                                        <div className="col-span-4 text-xs font-semibold text-foreground text-right pr-1">Measurement Level:</div>
                                        <div className="col-span-8 flex">
                                            <div className="relative flex-grow">
                                                <div
                                                    className="flex items-center h-5 text-xs border border-input rounded bg-background px-1 w-full cursor-pointer hover:border-ring"
                                                    onClick={() => setShowMeasureDropdown(!showMeasureDropdown)}
                                                    title={formatDropdownText(currentVariable.measure)}
                                                >
                                                    {getVariableIcon(currentVariable)}
                                                    <span className="capitalize truncate text-foreground">{formatDropdownText(currentVariable.measure)}</span>
                                                    <ChevronDown size={12} className="ml-auto text-muted-foreground flex-shrink-0" />
                                                </div>
                                                {showMeasureDropdown && renderDropdown(
                                                    MEASURE_OPTIONS,
                                                    currentVariable.measure,
                                                    (value) => handleVariableFieldChange('measure', value),
                                                    () => setShowMeasureDropdown(false)
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Role */}
                                    <div className="grid grid-cols-12 items-center gap-x-2">
                                        <div className="col-span-4 text-xs font-semibold text-foreground text-right pr-1">Role:</div>
                                        <div className="col-span-8">
                                            <div className="relative w-full">
                                                <div
                                                    className="flex items-center h-5 text-xs border border-input rounded bg-background px-1 w-full cursor-pointer hover:border-ring"
                                                    onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                                                    title={formatDropdownText(currentVariable.role)}
                                                >
                                                    <span className="capitalize truncate text-foreground">{formatDropdownText(currentVariable.role)}</span>
                                                    <ChevronDown size={12} className="ml-auto text-muted-foreground flex-shrink-0" />
                                                </div>
                                                {showRoleDropdown && renderDropdown(
                                                    ROLE_OPTIONS,
                                                    currentVariable.role,
                                                    (value) => handleVariableFieldChange('role', value),
                                                    () => setShowRoleDropdown(false)
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Unlabeled values */}
                                    <div className="grid grid-cols-12 items-center gap-x-2">
                                        <div className="col-span-4 text-xs font-semibold text-foreground text-right pr-1">Unlabeled values:</div>
                                        <div className="col-span-8">
                                            <Input
                                                value={unlabeledValuesCount}
                                                className="w-full h-5 text-xs bg-muted text-muted-foreground border-input"
                                                readOnly
                                            />
                                        </div>
                                    </div>

                                    {/* Suggest Measurement Level Button - Moved Here */}
                                    <div className="grid grid-cols-12 items-center gap-x-2">
                                        <div className="col-span-4"></div>
                                        <div className="col-span-8">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="text-xs h-5 px-2 whitespace-nowrap"
                                                onClick={handleSuggestMeasurement}
                                            >
                                                Suggest Measurement Level
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Type & Format - Moved Here */}
                                    <div className="grid grid-cols-12 items-center gap-x-2">
                                        <div className="col-span-4 text-xs font-semibold text-foreground text-right pr-1">Type:</div>
                                        <div className="col-span-8 flex gap-x-1">
                                            <div className="relative flex-1">
                                                <div
                                                    className="flex items-center h-5 text-xs border border-input rounded bg-background px-1 w-full cursor-pointer hover:border-ring"
                                                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                                                    title={getFormattedTypeName(currentVariable.type)}
                                                >
                                                    <span className="capitalize truncate text-foreground">{getFormattedTypeName(currentVariable.type)}</span>
                                                    <ChevronDown size={12} className="ml-auto text-muted-foreground flex-shrink-0" />
                                                </div>
                                                {showTypeDropdown && renderDropdown(
                                                    TYPE_OPTIONS,
                                                    currentVariable.type,
                                                    (value) => handleVariableFieldChange('type', value),
                                                    () => setShowTypeDropdown(false)
                                                )}
                                            </div>
                                            <div className="relative flex-1">
                                                <div
                                                    className={`flex items-center h-5 text-xs border rounded px-1 w-full ${isDateType(currentVariable.type) ? 'bg-background border-input cursor-pointer hover:border-ring' : 'bg-muted border-input cursor-not-allowed text-muted-foreground/70'}`}
                                                    onClick={() => isDateType(currentVariable.type) && setShowDateFormatDropdown(!showDateFormatDropdown)}
                                                    title={isDateType(currentVariable.type) ? "Select date format" : "Format (only available for date types)"}
                                                >
                                                    <span className={`capitalize truncate ${isDateType(currentVariable.type) ? 'text-foreground' : 'text-muted-foreground/70'}`}>Format</span>
                                                    <ChevronDown size={12} className={`ml-auto flex-shrink-0 ${isDateType(currentVariable.type) ? 'text-muted-foreground' : 'text-muted-foreground/70'}`} />
                                                </div>
                                                {showDateFormatDropdown && isDateType(currentVariable.type) && renderDateFormatDropdown(currentVariable, handleVariableFieldChange, setShowDateFormatDropdown)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Width & Decimals - Moved Here */}
                                    <div className="grid grid-cols-12 items-center gap-x-2">
                                        <div className="col-span-4 text-xs font-semibold text-foreground text-right pr-1">Width:</div>
                                        <div className="col-span-3">
                                            <Input
                                                type="number"
                                                value={currentVariable.width}
                                                onChange={(e) => handleVariableFieldChange('width', parseInt(e.target.value) || 0)}
                                                className="h-5 w-full text-xs"
                                                disabled={isDateType(currentVariable.type)}
                                            />
                                        </div>
                                        <div className="col-span-2 text-xs font-semibold text-foreground text-right pr-1">Decimals:</div>
                                        <div className="col-span-3">
                                            <Input
                                                type="number"
                                                value={currentVariable.decimals}
                                                onChange={(e) => handleVariableFieldChange('decimals', parseInt(e.target.value) || 0)}
                                                className="h-5 w-full text-xs"
                                                disabled={isDateType(currentVariable.type)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="labels" className="flex-grow overflow-y-auto p-1 flex flex-col">
                                {/* Value Labels Grid */}
                                <div className="">
                                    <div className="flex items-center mb-1">
                                        <div className="text-xs font-semibold text-foreground mr-1">
                                            Value Labels for {currentVariable.name}:
                                        </div>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info size={12} className="text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    <p className="text-xs">
                                                        Enter or paste values and their labels. Changed rows are indicated.
                                                        <br />Use the checkbox to mark values as missing.
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <span className="ml-auto text-xs text-muted-foreground">
                                            Unlabeled Values: {unlabeledValuesCount}
                                        </span>
                                    </div>
                                    {/* Explicit pixel height via inline style, overflow hidden. */}
                                    <div 
                                        ref={valueLabelsGridContainerRef} 
                                        style={{ height: '200px', overflow: 'hidden' }} 
                                        className="border border-border rounded"
                                    >
                                        <HotTable
                                            ref={hotTableRef}
                                            data={gridData}
                                            columns={[
                                                { data: 0, title: '#', readOnly: true, width: 30, className: 'htCenter htMiddle text-xs text-muted-foreground bg-muted border-r-border' },
                                                { data: 1, title: '<span class="text-destructive">*</span>', renderer: checkboxRenderer, readOnly: true, width: 30, className: 'htCenter htMiddle text-xs bg-muted border-r-border' },
                                                { data: 2, title: 'Missing', renderer: checkboxRenderer, width: 50, className: 'htCenter htMiddle text-xs bg-muted border-r-border' },
                                                { data: 3, title: 'Count', type: 'numeric', readOnly: true, width: 50, className: 'htRight htMiddle text-xs text-muted-foreground bg-muted border-r-border' },
                                                { data: 4, title: 'Value', width: 100, className: 'htLeft htMiddle text-xs text-foreground' },
                                                { data: 5, title: 'Label', width: 150, className: 'htLeft htMiddle text-xs text-foreground' },
                                            ]}
                                            rowHeaders={false}
                                            colHeaders={true}
                                            manualColumnResize={true}
                                            manualRowResize={true}
                                            height="100%"
                                            selectionMode="single"
                                            className="htXSmall htCustomTheme"
                                            licenseKey="non-commercial-and-evaluation"
                                            afterChange={handleDataChange}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex gap-1">
                                            <Button variant="outline" size="sm" className="text-xs h-6 px-2" onClick={handleAutoLabel}>Auto Label</Button>
                                            {/* <Button variant="outline" size="sm" className="text-xs h-6 px-2" onClick={handleCopyFromVariable}>Copy From...</Button> */}
                                            {/* <Button variant="outline" size="sm" className="text-xs h-6 px-2" onClick={handleCopyToVariables}>Copy To...</Button> */}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="text-center text-sm text-muted-foreground py-10">
                            Select a variable from the list to view and edit its properties.
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 py-3 border-t border-border bg-muted flex-shrink-0">
                <div className="flex items-center justify-between">
                    <Button variant="link" size="sm" className="text-xs p-0 text-muted-foreground hover:text-foreground">
                        <Info size={14} className="mr-1"/> Help
                    </Button>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={onClose}>Cancel</Button>
                        <Button size="sm" className="text-xs h-7" onClick={handleSave}>OK</Button>
                    </div>
                </div>
            </div>

            {/* Error Dialog */}
            <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-popover border-border">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Error</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-start space-x-3 py-4">
                        <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-popover-foreground">
                            {errorMessage}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setErrorDialogOpen(false)}>OK</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Suggest Measurement Level Dialog */}
            <Dialog open={suggestDialogOpen} onOpenChange={setSuggestDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-popover border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Suggested Measurement Level</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <p className="text-sm text-popover-foreground">
                            Based on the data, we suggest setting the measurement level to <strong className="text-primary">{suggestedMeasure}</strong>.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Explanation: {measurementExplanation}
                        </p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setSuggestDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAcceptSuggestion}>Accept Suggestion</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// Main component that handles different container types
const PropertiesEditor: FC<PropertiesEditorProps> = ({ 
    onClose, 
    variables, 
    caseLimit, 
    valueLimit, 
    onSave,
    containerType = "dialog" 
}) => {
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <PropertiesEditorContent 
                        onClose={onClose} 
                        variables={variables} 
                        caseLimit={caseLimit} 
                        valueLimit={valueLimit}
                        onSave={onSave}
                        containerType={containerType}
                    />
                </div>
            </div>
        );
    }

    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-[880px] max-h-[90vh] p-0 bg-background">
                <DialogHeader className="px-4 py-3 border-b border-border">
                    <DialogTitle className="flex items-center text-sm font-semibold text-foreground">
                        Define Variable Properties
                    </DialogTitle>
                </DialogHeader>

                <PropertiesEditorContent 
                    onClose={onClose} 
                    variables={variables} 
                    caseLimit={caseLimit} 
                    valueLimit={valueLimit}
                    onSave={onSave}
                    containerType={containerType}
                />
            </DialogContent>
        </Dialog>
    );
};

export default PropertiesEditor;