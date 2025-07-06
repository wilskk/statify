import React, { FC, useCallback, useMemo, Dispatch, SetStateAction, useState } from "react";
import { Ruler, Shapes, BarChartHorizontal, InfoIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { Variable } from "@/types/Variable";
import { VariablesTabProps, ExpectedValueOptions } from "../types";

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    testVariables,
    expectedRange,
    setExpectedRange,
    rangeValue,
    setRangeValue,
    expectedValue,
    setExpectedValue,
    expectedValueList,
    setExpectedValueList,
    displayStatistics,
    setDisplayStatistics,
    highlightedExpectedValueIndex,
    setHighlightedExpectedValueIndex,
    addExpectedValue,
    removeExpectedValue,
    changeExpectedValue,
    highlightedVariable,
    setHighlightedVariable,
    moveToTestVariables,
    moveToAvailableVariables,
    reorderVariables,
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    const variableIdKeyToUse: keyof Variable = 'tempId';
    const [allowUnknown, setAllowUnknown] = useState(false);

    const getDisplayName = (variable: Variable) => {
        if (!variable.label) return variable.name;
        return `${variable.label} [${variable.name}]`;
    };

    const isVariableDisabled = useCallback((variable: Variable): boolean => {   
        const isNormallyValid = (variable.type === 'NUMERIC' || variable.type === 'DATE') &&
                                (variable.measure === 'scale' || variable.measure === 'ordinal');
        
        if (isNormallyValid) return false;
        if (variable.measure === 'unknown') return !allowUnknown;
        
        return true;
    }, [allowUnknown]);

    const handleDoubleClick = (variable: Variable, sourceListId: string) => {
        if (sourceListId === 'available' && isVariableDisabled(variable)) {
            return;
        }
        
        if (sourceListId === 'available') {
            moveToTestVariables(variable);
        } else if (sourceListId === 'test') {
            moveToAvailableVariables(variable);
        }
    };

    const targetLists: TargetListConfig[] = [
        {
            id: 'test',
            title: 'Test Variable(s)',
            variables: testVariables,
            height: '300px',
            draggableItems: true,
            droppable: true
        }
    ];

    const managerHighlightedVariable = highlightedVariable
        ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
        : null;

    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        if (value && (value.source === 'available' || value.source === 'test')) {
            setHighlightedVariable({ tempId: value.id, source: value.source as 'available' | 'test' });
        } else {
            setHighlightedVariable(null);
        }
    }, [setHighlightedVariable]);

    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        if (toListId === 'test' && isVariableDisabled(variable)) {
            return;
        }
        
        if (toListId === 'test') {
            moveToTestVariables(variable, targetIndex);
        } else if (toListId === 'available') {
            moveToAvailableVariables(variable);
        }
    }, [moveToTestVariables, moveToAvailableVariables, isVariableDisabled]);

    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'test') {
            reorderVariables('test', variables);
        }
    }, [reorderVariables]);

    const isTourElementActive = useCallback((elementId: string) => {
        if (!tourActive || currentStep >= tourSteps.length) return false;
        return tourSteps[currentStep]?.targetId === elementId;
    }, [tourActive, currentStep, tourSteps]);

    const renderExpectedRange = () => (
        <div>
            <div className="text-sm font-medium text-foreground mb-1.5 px-1 flex items-center h-6">
                <span className="flex-1">Expected Range</span>
            </div>
            <div className="border border-border py-2 px-4 rounded-md bg-background">
                <RadioGroup
                    value={expectedRange.getFromData ? "getFromData" : "useSpecifiedRange"}
                    className="gap-2"
                    onValueChange={(value) => {
                        setExpectedRange({
                            ...expectedRange,
                            getFromData: value === "getFromData",
                            useSpecifiedRange: value === "useSpecifiedRange"
                        });
                    }}
                >
                    <div className="flex items-center">
                        <RadioGroupItem
                            value="getFromData"
                            id="getFromData"
                            className="mr-2 h-4 w-4"
                        />
                        <Label htmlFor="getFromData" className="text-sm">Get from data</Label>  
                    </div>
                    <div className="flex items-center">
                        <RadioGroupItem
                            value="useSpecifiedRange"
                            id="useSpecifiedRange"
                            className="mr-2 h-4 w-4"
                        />
                        <Label htmlFor="useSpecifiedRange" className="text-sm">Use specified range</Label>
                    </div>
                </RadioGroup>
                <div className="grid gap-1 mt-1 ml-6">
                    <div className="grid grid-cols-[50px_1fr] gap-1 flex items-center space-x-2">
                        <Label htmlFor="lowerValue" className={`col-span-1 text-sm ${!expectedRange.useSpecifiedRange ? 'opacity-50' : ''}`}>Lower:</Label>
                        <Input
                            id="lowerValue"
                            type="number"
                            disabled={!expectedRange.useSpecifiedRange}
                            value={rangeValue.lowerValue || ""}
                            onChange={(e) => setRangeValue({
                                ...rangeValue,
                                lowerValue: e.target.value ? Number(e.target.value) : null
                            })}
                            className="w-20 h-8 text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-[50px_1fr] gap-1 flex items-center space-x-2">
                        <Label htmlFor="upperValue" className={`col-span-1 text-sm ${!expectedRange.useSpecifiedRange ? 'opacity-50' : ''}`}>Upper:</Label>
                        <Input
                            id="upperValue"
                            type="number"
                            disabled={!expectedRange.useSpecifiedRange}
                            value={rangeValue.upperValue || ""}
                            onChange={(e) => setRangeValue({
                                ...rangeValue,
                                upperValue: e.target.value ? Number(e.target.value) : null
                            })}
                            className="w-20 h-8 text-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    // Referensi: Descriptive/components/VariablesTab.tsx bagian renderSelectedFooter
    // Modifikasi: Tambahkan button add, change, dan remove untuk expectedValueList
    const renderExpectedValue = () => (
        <div>
            <div className="text-sm font-medium text-foreground mb-1.5 px-1 flex items-center h-6">
                <span className="flex-1">Expected Value</span>
            </div>
            <div className="border border-border py-2 px-4 rounded-md bg-background">
                <RadioGroup
                    value={expectedValue.allCategoriesEqual ? "allCategoriesEqual" : "values"}
                    className="gap-2"
                    onValueChange={(value) => setExpectedValue({
                        ...expectedValue,
                        allCategoriesEqual: value === "allCategoriesEqual",
                        values: value === "values"
                    })}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem
                            value="allCategoriesEqual"
                            id="allCategoriesEqual"
                            className="h-4 w-4"
                        />
                        <Label htmlFor="allCategoriesEqual" className="text-sm">All categories equal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem
                            value="values"
                            id="values"
                            className="h-4 w-4"
                        />
                        <Label htmlFor="values" className="text-sm">Values:</Label>
                        <Input
                            id="values"
                            type="number"
                            disabled={!expectedValue.values}
                            value={expectedValue.inputValue ?? ""}
                            onChange={(e) => setExpectedValue({
                                ...expectedValue,
                                inputValue: e.target.value !== "" ? Number(e.target.value) : null
                            })}
                            className="w-20 h-8 text-sm"
                        />
                    </div>
                </RadioGroup>
                <div className="grid grid-cols-[auto_auto_1fr] gap-1 mt-1 ml-6">
                    <div className="flex flex-col justify-center space-y-1 w-max">
                        <Button
                            variant="outline"
                            className="h-8 text-xs"
                            disabled={
                                expectedValue.allCategoriesEqual ||
                                expectedValue.inputValue === null || 
                                expectedValue.inputValue === 0
                            }
                            onClick={addExpectedValue}
                        >
                            Add
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 text-xs"
                            disabled={highlightedExpectedValueIndex === null || expectedValue.allCategoriesEqual || expectedValue.inputValue === null}
                            onClick={() => {
                                if (highlightedExpectedValueIndex !== null && expectedValueList[highlightedExpectedValueIndex] !== undefined) {
                                    changeExpectedValue(expectedValueList[highlightedExpectedValueIndex]);
                                    setHighlightedExpectedValueIndex(null);
                                }
                            }}
                        >
                            Change
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 text-xs"
                            disabled={highlightedExpectedValueIndex === null || expectedValue.allCategoriesEqual}
                            onClick={() => {
                                if (highlightedExpectedValueIndex !== null && expectedValueList[highlightedExpectedValueIndex] !== undefined) {
                                    removeExpectedValue(expectedValueList[highlightedExpectedValueIndex]);
                                    setHighlightedExpectedValueIndex(null);
                                }
                            }}
                        >
                            Remove
                        </Button>
                    </div>
                    <div
                        className={`
                            border p-1 rounded-md w-full transition-colors relative bg-background overflow-y-auto overflow-x-hidden
                            ${expectedValue.allCategoriesEqual ? 'opacity-50' : ''}
                        `}
                        style={{ height: "172px", minWidth: "62px"}}
                    >
                        <div className="space-y-0.5 p-0.5 transition-all duration-150">
                            {expectedValueList.map((value, index) => (
                                <div
                                    key={`${value}-${index}`}
                                    className={`
                                        items-center p-1 border rounded-md group relative transition-all duration-150 ease-in-out text-sm w-12
                                        ${expectedValue.allCategoriesEqual ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                        ${highlightedExpectedValueIndex === index ? "bg-accent border-primary" : "border-border"}
                                        ${highlightedExpectedValueIndex === index ? "" : "hover:bg-accent"}
                                    `}
                                    style={{
                                        borderTopStyle: 'solid',
                                        borderTopWidth: '1px',
                                        borderTopColor: highlightedExpectedValueIndex === index ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                        paddingTop: '4px',
                                        paddingBottom: '4px',
                                        borderLeftWidth: '1px',
                                        borderRightWidth: '1px',
                                        borderBottomWidth: '1px',
                                        borderLeftColor: highlightedExpectedValueIndex === index ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                        borderRightColor: highlightedExpectedValueIndex === index ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                        borderBottomColor: highlightedExpectedValueIndex === index ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                    }}
                                    onClick={() => !expectedValue.allCategoriesEqual && setHighlightedExpectedValueIndex(index)}
                                >
                                    <div className="flex items-center w-full truncate">
                                        <span className="truncate">{value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAllowUnknown = () => (
        <>
            <div className="flex items-center mt-2 p-1.5">
                <Checkbox
                    id="allowUnknown"
                    checked={allowUnknown}
                    onCheckedChange={(checked: boolean) => setAllowUnknown(checked)}
                    className="mr-2 h-4 w-4"
                />
                <Label htmlFor="allowUnknown" className="text-sm cursor-pointer">
                    Treat &apos;unknown&apos; as Scale and allow selection
                </Label>
            </div>
        </>
    );

    return (
        <div className="space-y-2">
            <VariableListManager
                availableVariables={availableVariables}
                targetLists={targetLists}
                variableIdKey={variableIdKeyToUse}
                highlightedVariable={managerHighlightedVariable}
                setHighlightedVariable={setManagerHighlightedVariable}
                onMoveVariable={handleMoveVariable}
                onReorderVariable={handleReorderVariables}
                onVariableDoubleClick={handleDoubleClick}
                getDisplayName={getDisplayName}
                isVariableDisabled={isVariableDisabled}
                showArrowButtons={true}
                renderExtraInfoContent={renderAllowUnknown}
            />

            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
                {/* Available Variables Column (Left) */}
                <div className="col-span-1 flex flex-col">
                    {renderExpectedRange()}
                </div>

                <div className="col-span-1"></div>

                {/* Target Lists Column (Right) */}
                <div className="col-span-1 flex flex-col space-y-2" id="selected-variables-wrapper">
                    {renderExpectedValue()}
                </div>
            </div>

            <div id="chi-square-available-variables" className="absolute top-0 left-0 w-[48%] h-full pointer-events-none rounded-md">
                <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'chi-square-available-variables')} />
            </div>
            <div id="chi-square-test-variables" className="absolute top-0 right-0 w-[48%] h-full pointer-events-none rounded-md">
                <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'chi-square-test-variables')} />
            </div>
        </div>
    );
};

export default VariablesTab;