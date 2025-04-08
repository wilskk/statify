import React, { FC, JSX } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CornerDownRight, CornerDownLeft, InfoIcon } from "lucide-react";
import { Variable } from "@/types/Variable";

interface VariableTabProps {
    sourceVariables: Variable[];
    matchingVariables: Variable[];
    sortingVariables: Variable[];
    highlightedVariable: { id: string, source: 'source' | 'matching' | 'sorting' } | null;
    sortOrder: "ascending" | "descending";
    setSortOrder: (value: "ascending" | "descending") => void;
    handleVariableSelect: (columnIndex: number, source: 'source' | 'matching' | 'sorting') => void;
    handleVariableDoubleClick: (columnIndex: number, source: 'source' | 'matching' | 'sorting') => void;
    handleTransferToMatching: () => void;
    handleMoveFromMatching: () => void;
    handleTransferToSorting: () => void;
    handleMoveFromSorting: () => void;
    getVariableIcon: (variable: Variable) => JSX.Element;
    getDisplayName: (variable: Variable) => string;
}

const VariableTab: FC<VariableTabProps> = ({
                                               sourceVariables,
                                               matchingVariables,
                                               sortingVariables,
                                               highlightedVariable,
                                               sortOrder,
                                               setSortOrder,
                                               handleVariableSelect,
                                               handleVariableDoubleClick,
                                               handleTransferToMatching,
                                               handleMoveFromMatching,
                                               handleTransferToSorting,
                                               handleMoveFromSorting,
                                               getVariableIcon,
                                               getDisplayName
                                           }) => {
    const renderVariableList = (variables: Variable[], source: 'source' | 'matching' | 'sorting', height: string) => (
        <div className="border border-[#E6E6E6] p-2 rounded-md overflow-y-auto overflow-x-hidden" style={{ height }}>
            <div className="space-y-1">
                {variables.length === 0 ? (
                    <div className="px-2 py-1 text-xs text-[#888888] italic">No variables</div>
                ) : (
                    variables.map((variable) => (
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
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-8 gap-6">
            <div className="col-span-3">
                <div className="text-sm mb-2 font-medium">Source Variables:</div>
                {renderVariableList(sourceVariables, 'source', '300px')}
                <div className="text-xs mt-2 text-[#888888] flex items-center">
                    <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                    <span>Double-click variables to move them between lists</span>
                </div>
            </div>

            <div className="col-span-1 flex flex-col items-center justify-center">
                <div className="flex flex-col space-y-32">
                    <Button
                        variant="outline"
                        size="sm"
                        className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                        onClick={highlightedVariable?.source === 'matching' ? handleMoveFromMatching : handleTransferToMatching}
                        disabled={!highlightedVariable || (highlightedVariable.source !== 'source' && highlightedVariable.source !== 'matching')}
                    >
                        {highlightedVariable?.source === 'matching' ?
                            <CornerDownLeft size={16} /> :
                            <CornerDownRight size={16} />
                        }
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                        onClick={highlightedVariable?.source === 'sorting' ? handleMoveFromSorting : handleTransferToSorting}
                        disabled={!highlightedVariable || (highlightedVariable.source !== 'source' && highlightedVariable.source !== 'sorting')}
                    >
                        {highlightedVariable?.source === 'sorting' ?
                            <CornerDownLeft size={16} /> :
                            <CornerDownRight size={16} />
                        }
                    </Button>
                </div>
            </div>

            <div className="col-span-4 space-y-6">
                <div>
                    <div className="text-sm mb-2 font-medium">Define matching cases by:</div>
                    {renderVariableList(matchingVariables, 'matching', '150px')}
                </div>

                <div>
                    <div className="text-sm mb-2 font-medium">Sort within matching groups by:</div>
                    {renderVariableList(sortingVariables, 'sorting', '60px')}
                    <div className="flex items-center mt-2">
                        <div className="ml-auto flex items-center space-x-4">
                            <div className="flex items-center">
                                <Checkbox
                                    id="ascending"
                                    checked={sortOrder === "ascending"}
                                    onCheckedChange={() => setSortOrder("ascending")}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="ascending" className="text-xs cursor-pointer">
                                    Ascending
                                </Label>
                            </div>
                            <div className="flex items-center">
                                <Checkbox
                                    id="descending"
                                    checked={sortOrder === "descending"}
                                    onCheckedChange={() => setSortOrder("descending")}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="descending" className="text-xs cursor-pointer">
                                    Descending
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariableTab;