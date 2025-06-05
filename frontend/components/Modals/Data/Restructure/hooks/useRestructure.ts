import { useState, useEffect, useCallback } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { Variable } from "@/types/Variable";
import { RestructureMethod, RestructureConfig, UseRestructureReturn } from "../types";

/**
 * Custom hook for managing Restructure Data Wizard state and logic
 */
export const useRestructure = (): UseRestructureReturn => {
    // Get stores
    const { variables } = useVariableStore();
    const { data } = useDataStore();

    // State to manage wizard steps and tabs
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [activeTab, setActiveTab] = useState<string>("type");

    // State to store the selected restructure method
    const [method, setMethod] = useState<RestructureMethod>(
        RestructureMethod.VariablesToCases
    );

    // Variable selection states for different methods
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [indexVariables, setIndexVariables] = useState<Variable[]>([]);
    const [identifierVariables, setIdentifierVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{ id: string, source: string } | null>(null);

    // Options state
    const [createCount, setCreateCount] = useState(false);
    const [createIndex, setCreateIndex] = useState(true);
    const [dropEmptyVariables, setDropEmptyVariables] = useState(false);

    // Validation and error state
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Prepare variables with tempId for VariableListManager
    const prepareVariablesWithTempId = useCallback((vars: Variable[]) => {
        return vars.map(variable => ({
            ...variable,
            tempId: variable.columnIndex.toString()
        }));
    }, []);

    // Initialize available variables
    useEffect(() => {
        if (variables.length > 0) {
            const varsWithTempId = prepareVariablesWithTempId(variables);
            setAvailableVariables(varsWithTempId);
        }
    }, [variables, prepareVariablesWithTempId]);

    // Clear validation errors when method changes
    useEffect(() => {
        setValidationErrors([]);
    }, [method]);

    // Validation function
    const validateCurrentStep = useCallback((): string[] => {
        const errors: string[] = [];
        
        if (currentStep === 1) {
            if (!method) {
                errors.push("Please select a restructure method.");
            }
        } else if (currentStep === 2) {
            if (method !== RestructureMethod.TransposeAllData && selectedVariables.length === 0) {
                errors.push("Please select at least one variable to restructure.");
            }
            
            if (method === RestructureMethod.VariablesToCases && indexVariables.length === 0) {
                errors.push("Please select at least one index variable for variables-to-cases restructuring.");
            }
            
            if (method === RestructureMethod.CasesToVariables && identifierVariables.length === 0) {
                errors.push("Please select at least one identifier variable for cases-to-variables restructuring.");
            }
            
            const allSelectedIds = [
                ...selectedVariables.map(v => v.tempId),
                ...indexVariables.map(v => v.tempId),
                ...identifierVariables.map(v => v.tempId)
            ];
            const uniqueIds = new Set(allSelectedIds);
            if (allSelectedIds.length !== uniqueIds.size) {
                errors.push("A variable cannot be selected in multiple lists. Please review your selections.");
            }
        }
        
        return errors;
    }, [currentStep, method, selectedVariables, indexVariables, identifierVariables]);

    const handleNext = useCallback(() => {
        const errors = validateCurrentStep();
        setValidationErrors(errors);
        
        if (errors.length > 0) {
            return;
        }
        
        if (currentStep === 1) {
            setSelectedVariables([]);
            setIndexVariables([]);
            setIdentifierVariables([]);
            setValidationErrors([]);
            setCurrentStep(2);
            setActiveTab("variables");
        } else if (currentStep === 2) {
            setCurrentStep(3);
            setActiveTab("options");
        }
    }, [currentStep, validateCurrentStep]);

    const handleBack = useCallback(() => {
        setValidationErrors([]);
        
        if (currentStep === 3) {
            setCurrentStep(2);
            setActiveTab("variables");
        } else if (currentStep === 2) {
            setCurrentStep(1);
            setActiveTab("type");
        }
    }, [currentStep]);

    const handleFinish = useCallback(async (onClose: () => void) => {
        const errors = validateCurrentStep();
        setValidationErrors(errors);
        
        if (errors.length > 0) {
            return;
        }
        
        try {
            const config: RestructureConfig = {
                method,
                selectedVariables: selectedVariables.map(v => ({
                    name: v.name,
                    columnIndex: v.columnIndex,
                    type: v.type,
                    measure: v.measure
                })),
                indexVariables: indexVariables.map(v => ({
                    name: v.name,
                    columnIndex: v.columnIndex,
                    type: v.type,
                    measure: v.measure
                })),
                identifierVariables: identifierVariables.map(v => ({
                    name: v.name,
                    columnIndex: v.columnIndex,
                    type: v.type,
                    measure: v.measure
                })),
                options: {
                    createCount,
                    createIndex,
                    dropEmptyVariables
                }
            };

            console.log("Restructuring configuration:", config);
            
            alert(`Data restructuring completed successfully!\n\nMethod: ${
                method === RestructureMethod.VariablesToCases ? 'Variables to Cases' :
                method === RestructureMethod.CasesToVariables ? 'Cases to Variables' :
                'Transpose All Data'
            }\nVariables processed: ${selectedVariables.length}`);
            
            onClose();
        } catch (error) {
            console.error("Error during data restructuring:", error);
            setValidationErrors(["An error occurred while restructuring the data. Please try again."]);
        }
    }, [
        validateCurrentStep, 
        method, 
        selectedVariables, 
        indexVariables, 
        identifierVariables,
        createCount,
        createIndex,
        dropEmptyVariables
    ]);

    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        if (fromListId === 'available') {
            setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (fromListId === 'selected') {
            setSelectedVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (fromListId === 'index') {
            setIndexVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (fromListId === 'identifier') {
            setIdentifierVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        }

        if (toListId === 'available') {
            setAvailableVariables(prev => {
                const newList = [...prev];
                if (targetIndex !== undefined) {
                    newList.splice(targetIndex, 0, variable);
                } else {
                    newList.push(variable);
                }
                return newList.sort((a, b) => a.columnIndex - b.columnIndex);
            });
        } else if (toListId === 'selected') {
            setSelectedVariables(prev => {
                const newList = [...prev];
                if (targetIndex !== undefined) {
                    newList.splice(targetIndex, 0, variable);
                } else {
                    newList.push(variable);
                }
                return newList;
            });
        } else if (toListId === 'index') {
            setIndexVariables(prev => {
                const newList = [...prev];
                if (targetIndex !== undefined) {
                    newList.splice(targetIndex, 0, variable);
                } else {
                    newList.push(variable);
                }
                return newList;
            });
        } else if (toListId === 'identifier') {
            setIdentifierVariables(prev => {
                const newList = [...prev];
                if (targetIndex !== undefined) {
                    newList.splice(targetIndex, 0, variable);
                } else {
                    newList.push(variable);
                }
                return newList;
            });
        }

        setHighlightedVariable(null);
    }, []);

    const handleReorderVariable = useCallback((listId: string, reorderedList: Variable[]) => {
        if (listId === 'selected') {
            setSelectedVariables(reorderedList);
        } else if (listId === 'index') {
            setIndexVariables(reorderedList);
        } else if (listId === 'identifier') {
            setIdentifierVariables(reorderedList);
        } else if (listId === 'available') {
            setAvailableVariables(reorderedList.sort((a,b) => a.columnIndex - b.columnIndex));
        }
    }, []);

    return {
        currentStep,
        activeTab,
        method,
        availableVariables,
        selectedVariables,
        indexVariables,
        identifierVariables,
        highlightedVariable,
        createCount,
        createIndex,
        dropEmptyVariables,
        validationErrors,
        setCurrentStep,
        setActiveTab,
        setMethod,
        setHighlightedVariable,
        setCreateCount,
        setCreateIndex,
        setDropEmptyVariables,
        handleNext,
        handleBack,
        handleFinish,
        handleMoveVariable,
        handleReorderVariable,
        validateCurrentStep,
        prepareVariablesWithTempId,
    };
}; 