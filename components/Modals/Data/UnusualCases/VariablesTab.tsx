import React, { JSX } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { InfoIcon, CornerDownRight, CornerDownLeft } from "lucide-react";
import { Variable } from "@/types/Variable";

interface VariablesTabProps {
    storeVariables: Variable[];
    analysisVariables: Variable[];
    caseIdentifierVariables: Variable[];
    highlightedVariable: {id: string, source: 'available' | 'analysis' | 'identifier'} | null;
    handleVariableSelect: (columnIndex: number, source: 'available' | 'analysis' | 'identifier') => void;
    handleVariableDoubleClick: (columnIndex: number, source: 'available' | 'analysis' | 'identifier') => void;
    getVariableIcon: (variable: Variable) => JSX.Element;
    getDisplayName: (variable: Variable) => string;
    handleTopTransferClick: () => void;
    handleBottomTransferClick: () => void;
}

const VariablesTab: React.FC<VariablesTabProps> = ({
                                                       storeVariables,
                                                       analysisVariables,
                                                       caseIdentifierVariables,
                                                       highlightedVariable,
                                                       handleVariableSelect,
                                                       handleVariableDoubleClick,
                                                       getVariableIcon,
                                                       getDisplayName,
                                                       handleTopTransferClick,
                                                       handleBottomTransferClick
                                                   }) => {
    const renderVariableList = (variables: Variable[], source: 'available' | 'analysis' | 'identifier', height: string) => (
        <div className="border border-[#E6E6E6] p-2 rounded-md overflow-y-auto overflow-x-hidden" style={{ height }}>
            <div className="space-y-1">
                {variables.map((variable) => (
                    <TooltipProvider key={variable.columnIndex}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-[#F7F7F7] ${
                                        highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === source
                                            ? "bg-[#E6E6E6] border-[#888888]"
                                            : "border-[#CCCCCC]"
                                    }`}
                                    onClick={() => handleVariableSelect(variable.columnIndex, source)}
                                    onDoubleClick={() => handleVariableDoubleClick(variable.columnIndex, source)}
                                >
                                    <div className="flex items-center w-full">
                                        {getVariableIcon(variable)}
                                        <span className="text-xs truncate">{getDisplayName(variable)}</span>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p className="text-xs">{getDisplayName(variable)}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-8 gap-6">
            <div className="col-span-3">
                <div className="text-sm mb-2 font-medium">Variables:</div>
                {renderVariableList(storeVariables, 'available', '300px')}
                <div className="text-xs mt-2 text-[#888888] flex items-center">
                    <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                    <span>To change a variable&apos;s measurement level, right click on it in the Variables list.</span>
                </div>
            </div>

            <div className="col-span-1 flex flex-col items-center justify-center">
                <div className="flex flex-col space-y-32">
                    <Button
                        variant="outline"
                        size="sm"
                        className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                        onClick={handleTopTransferClick}
                        disabled={!highlightedVariable || (highlightedVariable.source !== 'available' && highlightedVariable.source !== 'analysis')}
                    >
                        {highlightedVariable?.source === 'analysis' ?
                            <CornerDownLeft size={16} /> :
                            <CornerDownRight size={16} />
                        }
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                        onClick={handleBottomTransferClick}
                        disabled={!highlightedVariable || (highlightedVariable.source !== 'available' && highlightedVariable.source !== 'identifier')}
                    >
                        {highlightedVariable?.source === 'identifier' ?
                            <CornerDownLeft size={16} /> :
                            <CornerDownRight size={16} />
                        }
                    </Button>
                </div>
            </div>

            <div className="col-span-4 space-y-6">
                <div>
                    <div className="text-sm mb-2 font-medium">Analysis Variables:</div>
                    {renderVariableList(analysisVariables, 'analysis', '150px')}
                </div>

                <div>
                    <div className="text-sm mb-2 font-medium">Case Identifier Variable:</div>
                    {renderVariableList(caseIdentifierVariables, 'identifier', '60px')}
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;