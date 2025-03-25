"use client";

import React, { FC, useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUp, ArrowDown, AlertCircle } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { useVariableStore } from "@/stores/useVariableStore";
import { useModalStore } from "@/stores/useModalStore";
import { Variable } from "@/types/Variable";

interface DuplicateCasesProps {
    onClose?: () => void;
}

const DuplicateCases: FC<DuplicateCasesProps> = ({ onClose }) => {
    const { closeModal } = useModalStore();
    const { variables } = useVariableStore();

    const [sourceVariables, setSourceVariables] = useState<Variable[]>(variables || []);
    const [matchingVariables, setMatchingVariables] = useState<Variable[]>([]);
    const [sortingVariables, setSortingVariables] = useState<Variable[]>([]);

    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'source' | 'matching' | 'sorting'} | null>(null);

    const [sortOrder, setSortOrder] = useState<"ascending" | "descending">("ascending");
    const [primaryCaseIndicator, setPrimaryCaseIndicator] = useState<"last" | "first">("last");
    const [primaryName, setPrimaryName] = useState<string>("PrimaryLast1");
    const [filterByIndicator, setFilterByIndicator] = useState<boolean>(false);
    const [sequentialCount, setSequentialCount] = useState<boolean>(false);
    const [sequentialName, setSequentialName] = useState<string>("MatchSequence");
    const [moveMatchingToTop, setMoveMatchingToTop] = useState<boolean>(true);
    const [displayFrequencies, setDisplayFrequencies] = useState<boolean>(true);

    // Error dialog state
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);

    // Update variables if store variables change
    useEffect(() => {
        if (variables && variables.length > 0) {
            setSourceVariables(variables);
        }
    }, [variables]);

    const handleVariableSelect = (columnIndex: number, source: string) => {
        if (highlightedVariable?.id === columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: columnIndex.toString(), source: source as 'source' | 'matching' | 'sorting' });
        }
    };

    const handleVariableDoubleClick = (columnIndex: number, source: string) => {
        if (source === 'source') {
            const variable = sourceVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                setMatchingVariables(prev => [...prev, variable]);
                setSourceVariables(prev => prev.filter(v => v.columnIndex !== columnIndex));
            }
        } else if (source === 'matching') {
            const variable = matchingVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                setSourceVariables(prev => [...prev, variable]);
                setMatchingVariables(prev => prev.filter(v => v.columnIndex !== columnIndex));
            }
        } else if (source === 'sorting') {
            const variable = sortingVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                setSourceVariables(prev => [...prev, variable]);
                setSortingVariables(prev => prev.filter(v => v.columnIndex !== columnIndex));
            }
        }
    };

    const handleTransferToMatching = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'source') {
            const sourceId = parseInt(highlightedVariable.id);
            const variable = sourceVariables.find(v => v.columnIndex === sourceId);
            if (variable) {
                setMatchingVariables(prev => [...prev, variable]);
                setSourceVariables(prev => prev.filter(v => v.columnIndex !== sourceId));
                setHighlightedVariable(null);
            }
        }
    };

    const handleMoveFromMatching = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'matching') {
            const sourceId = parseInt(highlightedVariable.id);
            const variable = matchingVariables.find(v => v.columnIndex === sourceId);
            if (variable) {
                setSourceVariables(prev => [...prev, variable]);
                setMatchingVariables(prev => prev.filter(v => v.columnIndex !== sourceId));
                setHighlightedVariable(null);
            }
        }
    };

    const handleTransferToSorting = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'source') {
            const sourceId = parseInt(highlightedVariable.id);
            const variable = sourceVariables.find(v => v.columnIndex === sourceId);
            if (variable) {
                setSortingVariables(prev => [...prev, variable]);
                setSourceVariables(prev => prev.filter(v => v.columnIndex !== sourceId));
                setHighlightedVariable(null);
            }
        }
    };

    const handleMoveFromSorting = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'sorting') {
            const sourceId = parseInt(highlightedVariable.id);
            const variable = sortingVariables.find(v => v.columnIndex === sourceId);
            if (variable) {
                setSourceVariables(prev => [...prev, variable]);
                setSortingVariables(prev => prev.filter(v => v.columnIndex !== sourceId));
                setHighlightedVariable(null);
            }
        }
    };

    const handleTopArrowClick = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'source') {
            handleTransferToMatching();
        } else if (highlightedVariable.source === 'matching') {
            handleMoveFromMatching();
        }
    };

    const handleBottomArrowClick = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'source') {
            handleTransferToSorting();
        } else if (highlightedVariable.source === 'sorting') {
            handleMoveFromSorting();
        }
    };

    const handleMoveUp = (source: 'matching' | 'sorting') => {
        if (!highlightedVariable || highlightedVariable.source !== source) return;

        const variables = source === 'matching' ? [...matchingVariables] : [...sortingVariables];
        const index = variables.findIndex(v => v.columnIndex === parseInt(highlightedVariable.id));

        if (index > 0) {
            const temp = variables[index];
            variables[index] = variables[index - 1];
            variables[index - 1] = temp;

            if (source === 'matching') {
                setMatchingVariables(variables);
            } else {
                setSortingVariables(variables);
            }
        }
    };

    const handleMoveDown = (source: 'matching' | 'sorting') => {
        if (!highlightedVariable || highlightedVariable.source !== source) return;

        const variables = source === 'matching' ? [...matchingVariables] : [...sortingVariables];
        const index = variables.findIndex(v => v.columnIndex === parseInt(highlightedVariable.id));

        if (index < variables.length - 1) {
            const temp = variables[index];
            variables[index] = variables[index + 1];
            variables[index + 1] = temp;

            if (source === 'matching') {
                setMatchingVariables(variables);
            } else {
                setSortingVariables(variables);
            }
        }
    };

    const handleReset = () => {
        setSourceVariables(variables || []);
        setMatchingVariables([]);
        setSortingVariables([]);
        setHighlightedVariable(null);
        setSortOrder("ascending");
        setPrimaryCaseIndicator("last");
        setPrimaryName("PrimaryLast1");
        setFilterByIndicator(false);
        setSequentialCount(false);
        setSequentialName("MatchSequence");
        setMoveMatchingToTop(true);
        setDisplayFrequencies(true);
    };

    const handleConfirm = () => {
        if (matchingVariables.length === 0) {
            setErrorMessage("No matching variables have been selected.");
            setErrorDialogOpen(true);
            return;
        }

        // Process the duplicate cases
        handleClose();
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            closeModal();
        }
    };

    const selectedVariablesCount = matchingVariables.length + sortingVariables.length;

    // Fixed renderVariableList that properly handles nesting with ScrollArea
    const renderVariableList = (variables: Variable[], source: 'source' | 'matching' | 'sorting', height: string) => (
        <div className="border border-[#E6E6E6] rounded overflow-hidden" style={{ height }}>
            <div className="bg-[#F7F7F7] flex border-b border-[#E6E6E6]">
                <div className="text-left px-2 py-1 text-xs font-medium text-[#444444] flex-1">Name</div>
                <div className="text-left px-2 py-1 text-xs font-medium text-[#444444] flex-1">Type</div>
            </div>

            <ScrollArea className="h-[calc(100%-28px)]">
                <div className="w-full">
                    {variables.map((variable) => (
                        <div
                            key={variable.columnIndex}
                            className={`flex cursor-pointer hover:bg-[#F7F7F7] ${
                                highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === source
                                    ? 'bg-[#F7F7F7] border-l-2 border-l-[#000000]'
                                    : 'border-l-2 border-l-transparent'
                            }`}
                            onClick={() => handleVariableSelect(variable.columnIndex, source)}
                            onDoubleClick={() => handleVariableDoubleClick(variable.columnIndex, source)}
                        >
                            <div className="px-2 py-1 text-xs border-b border-[#E6E6E6] text-[#000000] flex-1">{variable.name}</div>
                            <div className="px-2 py-1 text-xs border-b border-[#E6E6E6] text-[#444444] flex-1">{variable.type}</div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );

    const renderTransferControl = () => (
        <div className="flex flex-col items-center justify-center h-full space-y-2">
            <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 border-[#CCCCCC]"
                onClick={handleTopArrowClick}
            >
                ▲
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 border-[#CCCCCC]"
                onClick={handleBottomArrowClick}
            >
                ▼
            </Button>
        </div>
    );

    return (
        <>
            <DialogContent className="max-w-[750px] p-0 bg-white border border-[#E6E6E6] max-h-[90vh] overflow-hidden shadow-[0px_4px_12px_rgba(0,0,0,0.08)]">
                <DialogHeader className="px-6 py-5 bg-[#F7F7F7]">
                    <DialogTitle className="text-lg font-semibold text-[#000000]">Identify Duplicate Cases</DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-auto p-6">
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-5">
                            <div className="text-xs font-medium mb-1 text-[#000000]">Variables:</div>
                            {renderVariableList(sourceVariables, 'source', '250px')}
                        </div>

                        <div className="col-span-1 flex items-center justify-center">
                            {renderTransferControl()}
                        </div>

                        <div className="col-span-6 space-y-4">
                            <div>
                                <div className="text-xs font-medium mb-1 text-[#000000]">Define matching cases by:</div>
                                {renderVariableList(matchingVariables, 'matching', '110px')}
                                <div className="flex gap-4 mt-2">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 border-[#CCCCCC]"
                                                    onClick={() => handleMoveUp('matching')}
                                                    disabled={!highlightedVariable || highlightedVariable.source !== 'matching'}
                                                >
                                                    <ArrowUp size={12} />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">
                                                <p className="text-xs">Move Up</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 border-[#CCCCCC]"
                                                    onClick={() => handleMoveDown('matching')}
                                                    disabled={!highlightedVariable || highlightedVariable.source !== 'matching'}
                                                >
                                                    <ArrowDown size={12} />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">
                                                <p className="text-xs">Move Down</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-medium mb-1 text-[#000000]">Sort within matching groups by:</div>
                                {renderVariableList(sortingVariables, 'sorting', '80px')}

                                <div className="flex items-center mt-2 gap-4">
                                    <div className="flex items-center gap-1">
                                        <Checkbox
                                            id="ascending"
                                            checked={sortOrder === "ascending"}
                                            onCheckedChange={() => setSortOrder("ascending")}
                                            className="h-3 w-3 border-[#CCCCCC]"
                                        />
                                        <Label htmlFor="ascending" className="text-xs text-[#444444]">Ascending</Label>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Checkbox
                                            id="descending"
                                            checked={sortOrder === "descending"}
                                            onCheckedChange={() => setSortOrder("descending")}
                                            className="h-3 w-3 border-[#CCCCCC]"
                                        />
                                        <Label htmlFor="descending" className="text-xs text-[#444444]">Descending</Label>
                                    </div>

                                    <div className="flex gap-1 ml-auto">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 border-[#CCCCCC]"
                                                        onClick={() => handleMoveUp('sorting')}
                                                        disabled={!highlightedVariable || highlightedVariable.source !== 'sorting'}
                                                    >
                                                        <ArrowUp size={12} />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">
                                                    <p className="text-xs">Move Up</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 border-[#CCCCCC]"
                                                        onClick={() => handleMoveDown('sorting')}
                                                        disabled={!highlightedVariable || highlightedVariable.source !== 'sorting'}
                                                    >
                                                        <ArrowDown size={12} />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">
                                                    <p className="text-xs">Move Down</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs mt-1 text-[#444444]">
                                Number of matching and sorting variables: {selectedVariablesCount}
                            </div>
                        </div>
                    </div>

                    <div className="border border-[#E6E6E6] rounded bg-white p-4 mt-6">
                        <div className="text-xs font-medium mb-3 text-[#000000]">Variables to Create</div>

                        <div className="mb-4">
                            <div className="flex items-start">
                                <Checkbox
                                    id="primaryIndicator"
                                    checked={true}
                                    className="h-3 w-3 mt-1 border-[#CCCCCC]"
                                />
                                <div className="ml-2">
                                    <Label htmlFor="primaryIndicator" className="text-xs text-[#444444]">
                                        Indicator of primary cases (1=unique or primary, 0=duplicate)
                                    </Label>
                                    <div className="ml-4 mt-2">
                                        <div className="flex items-center gap-1">
                                            <Checkbox
                                                id="last"
                                                checked={primaryCaseIndicator === "last"}
                                                onCheckedChange={() => setPrimaryCaseIndicator("last")}
                                                className="h-3 w-3 border-[#CCCCCC]"
                                            />
                                            <Label htmlFor="last" className="text-xs text-[#444444]">Last case in each group is primary</Label>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Checkbox
                                                id="first"
                                                checked={primaryCaseIndicator === "first"}
                                                onCheckedChange={() => setPrimaryCaseIndicator("first")}
                                                className="h-3 w-3 border-[#CCCCCC]"
                                            />
                                            <Label htmlFor="first" className="text-xs text-[#444444]">First case in each group is primary</Label>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Checkbox
                                                id="filterIndicator"
                                                checked={filterByIndicator}
                                                onCheckedChange={(checked) => setFilterByIndicator(Boolean(checked))}
                                                className="h-3 w-3 border-[#CCCCCC]"
                                            />
                                            <Label htmlFor="filterIndicator" className="text-xs text-[#444444]">Filter by indicator values</Label>
                                        </div>
                                    </div>

                                    <div className="flex items-center mt-2">
                                        <Label htmlFor="primaryName" className="text-xs text-[#444444] w-12">Name:</Label>
                                        <Input
                                            id="primaryName"
                                            value={primaryName}
                                            onChange={(e) => setPrimaryName(e.target.value)}
                                            className="h-7 text-xs border-[#CCCCCC]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-[#E6E6E6] my-3" />

                        <div>
                            <div className="flex items-start">
                                <Checkbox
                                    id="sequentialCount"
                                    checked={sequentialCount}
                                    onCheckedChange={(checked) => setSequentialCount(Boolean(checked))}
                                    className="h-3 w-3 mt-1 border-[#CCCCCC]"
                                />
                                <div className="ml-2">
                                    <Label htmlFor="sequentialCount" className="text-xs text-[#444444]">
                                        Sequential count of matching case in each group (0=nonmatching case)
                                    </Label>
                                    <div className="flex items-center mt-2">
                                        <Label htmlFor="sequentialName" className="text-xs text-[#444444] w-12">Name:</Label>
                                        <Input
                                            id="sequentialName"
                                            value={sequentialName}
                                            onChange={(e) => setSequentialName(e.target.value)}
                                            className="h-7 text-xs border-[#CCCCCC]"
                                            disabled={!sequentialCount}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border border-[#E6E6E6] rounded bg-white p-4 mt-4">
                        <div className="text-xs font-medium mb-2 text-[#000000]">Additional Options</div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-1">
                                <Checkbox
                                    id="moveToTop"
                                    checked={moveMatchingToTop}
                                    onCheckedChange={(checked) => setMoveMatchingToTop(Boolean(checked))}
                                    className="h-3 w-3 border-[#CCCCCC]"
                                />
                                <Label htmlFor="moveToTop" className="text-xs text-[#444444]">
                                    Move matching cases to the top of the file
                                </Label>
                            </div>
                            <div className="flex items-center gap-1">
                                <Checkbox
                                    id="displayFrequencies"
                                    checked={displayFrequencies}
                                    onCheckedChange={(checked) => setDisplayFrequencies(Boolean(checked))}
                                    className="h-3 w-3 border-[#CCCCCC]"
                                />
                                <Label htmlFor="displayFrequencies" className="text-xs text-[#444444]">
                                    Display frequencies for created variables
                                </Label>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="flex justify-end space-x-2 p-4 bg-[#F7F7F7] border-t border-[#E6E6E6]">
                    <Button
                        className="h-8 px-4 bg-[#000000] text-white hover:bg-opacity-90 text-xs"
                        onClick={handleConfirm}
                    >
                        OK
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 px-3 text-[#000000] border-[#CCCCCC] hover:bg-[#F7F7F7] text-xs"
                    >
                        Paste
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 px-3 text-[#000000] border-[#CCCCCC] hover:bg-[#F7F7F7] text-xs"
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 px-3 text-[#000000] border-[#CCCCCC] hover:bg-[#F7F7F7] text-xs"
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 px-3 text-[#000000] border-[#CCCCCC] hover:bg-[#F7F7F7] text-xs"
                    >
                        Help
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* Error Dialog */}
            <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent className="max-w-[450px] p-4">
                    <DialogHeader className="p-0 mb-2">
                        <DialogTitle>Statify</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-4">
                        <AlertCircle className="h-10 w-10 text-blue-500" />
                        <div>
                            <p className="text-sm mt-2">{errorMessage}</p>
                        </div>
                    </div>

                    <DialogFooter className="flex justify-center mt-4">
                        <Button
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => setErrorDialogOpen(false)}
                        >
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DuplicateCases;