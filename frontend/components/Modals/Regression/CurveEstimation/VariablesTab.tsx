import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    ChevronRight,
    InfoIcon,
    Ruler,
    Shapes,
    BarChartHorizontal
} from 'lucide-react';
import { Variable, VariableType } from '@/types/Variable';

interface VariablesTabProps {
    availableVariables: Variable[];
    highlightedVariable: string | null;
    setHighlightedVariable: (id: string | null) => void;
    selectedDependentVariable: Variable | null;
    selectedIndependentVariables: Variable[];
    selectedCaseLabels: Variable | null;
    handleDependentDoubleClick: (variable: Variable) => void;
    handleIndependentDoubleClick: (variable: Variable) => void;
    handleCaseLabelsDoubleClick: (variable: Variable) => void;
    moveToDependent: () => void;
    moveToIndependent: () => void;
    moveToCaseLabels: () => void;
    removeDependent: () => void;
    removeIndependent: (variable: Variable) => void;
    removeCaseLabels: () => void;
    isProcessing: boolean;
}

const VariablesTab: React.FC<VariablesTabProps> = ({
                                                       availableVariables,
                                                       highlightedVariable,
                                                       setHighlightedVariable,
                                                       selectedDependentVariable,
                                                       selectedIndependentVariables,
                                                       selectedCaseLabels,
                                                       handleDependentDoubleClick,
                                                       handleIndependentDoubleClick,
                                                       handleCaseLabelsDoubleClick,
                                                       moveToDependent,
                                                       moveToIndependent,
                                                       moveToCaseLabels,
                                                       removeDependent,
                                                       removeIndependent,
                                                       removeCaseLabels,
                                                       isProcessing
                                                   }) => {
    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-[#888888] mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
        }
    };

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const handleVariableClick = (variableId: string) => {
        setHighlightedVariable(highlightedVariable === variableId ? null : variableId);
    };

    return (
        <div className="grid grid-cols-2 gap-6">
            {/* Left side - Available Variables */}
            <div>
                <div className="text-sm mb-2 font-medium">Variables:</div>
                <div className="border border-[#E6E6E6] rounded-md p-2 h-[320px] overflow-y-auto">
                    {availableVariables.map((variable) => (
                        <TooltipProvider key={variable.columnIndex}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={`flex items-center p-1.5 mb-1 cursor-pointer border rounded-md hover:bg-[#F7F7F7] ${
                                            highlightedVariable === variable.columnIndex.toString()
                                                ? "bg-[#E6E6E6] border-[#888888]"
                                                : "border-[#CCCCCC]"
                                        }`}
                                        onClick={() => handleVariableClick(variable.columnIndex.toString())}
                                        onDoubleClick={() => handleDependentDoubleClick(variable)}
                                    >
                                        <div className="flex items-center w-full">
                                            {getVariableIcon(variable)}
                                            <span className="text-sm truncate">{getDisplayName(variable)}</span>
                                        </div>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p className="text-xs">{getDisplayName(variable)}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                    {availableVariables.length === 0 && (
                        <div className="flex items-center justify-center h-full text-sm text-gray-400">
                            No variables available
                        </div>
                    )}
                </div>
                <div className="text-xs mt-2 text-[#888888] flex items-center">
                    <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                    <span>Double-click to move variables. Single-click to select.</span>
                </div>
            </div>

            {/* Right side - Variable Assignments */}
            <div className="space-y-5">
                {/* Dependent Variable */}
                <div>
                    <div className="text-sm mb-2 font-medium">Dependent Variable:</div>
                    <div className="flex mb-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="mr-2 p-0 h-8 w-8 flex items-center justify-center"
                            onClick={moveToDependent}
                            disabled={!highlightedVariable || isProcessing}
                        >
                            <ChevronRight size={16} />
                        </Button>
                        <div
                            className={`border rounded-md h-8 flex-grow flex items-center px-3 
              ${selectedDependentVariable ? 'bg-[#F7F7F7] cursor-pointer' : 'bg-[#F0F0F0]'}`}
                            onClick={removeDependent}
                        >
                            {selectedDependentVariable ? (
                                <div className="flex items-center w-full text-sm">
                                    {getVariableIcon(selectedDependentVariable)}
                                    <span className="truncate">{getDisplayName(selectedDependentVariable)}</span>
                                </div>
                            ) : (
                                <span className="text-gray-400 text-sm">[None]</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Independent Variables */}
                <div>
                    <div className="text-sm mb-2 font-medium">Independent Variables:</div>
                    <div className="flex">
                        <Button
                            variant="outline"
                            size="sm"
                            className="mr-2 p-0 h-8 w-8 flex items-center justify-center align-top"
                            onClick={moveToIndependent}
                            disabled={!highlightedVariable || isProcessing}
                        >
                            <ChevronRight size={16} />
                        </Button>
                        <div className="border rounded-md min-h-[180px] w-full p-2 overflow-y-auto">
                            {selectedIndependentVariables.length > 0 ? (
                                selectedIndependentVariables.map((variable) => (
                                    <div
                                        key={variable.columnIndex}
                                        className="flex items-center p-1.5 mb-1 border rounded-md cursor-pointer hover:bg-[#F7F7F7]"
                                        onClick={() => removeIndependent(variable)}
                                    >
                                        <div className="flex items-center w-full text-sm">
                                            {getVariableIcon(variable)}
                                            <span className="truncate">{getDisplayName(variable)}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                                    [None]
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Case Labels */}
                <div>
                    <div className="text-sm mb-2 font-medium">Case Labels:</div>
                    <div className="flex">
                        <Button
                            variant="outline"
                            size="sm"
                            className="mr-2 p-0 h-8 w-8 flex items-center justify-center"
                            onClick={moveToCaseLabels}
                            disabled={!highlightedVariable || isProcessing}
                        >
                            <ChevronRight size={16} />
                        </Button>
                        <div
                            className={`border rounded-md h-8 flex-grow flex items-center px-3 
              ${selectedCaseLabels ? 'bg-[#F7F7F7] cursor-pointer' : 'bg-[#F0F0F0]'}`}
                            onClick={removeCaseLabels}
                        >
                            {selectedCaseLabels ? (
                                <div className="flex items-center w-full text-sm">
                                    {getVariableIcon(selectedCaseLabels)}
                                    <span className="truncate">{getDisplayName(selectedCaseLabels)}</span>
                                </div>
                            ) : (
                                <span className="text-gray-400 text-sm">[None]</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;