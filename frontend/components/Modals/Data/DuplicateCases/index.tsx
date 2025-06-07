"use client";

import React, { FC, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Variable } from "@/types/Variable";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    AlertCircle,
    HelpCircle
} from "lucide-react";
import VariableTab from "./VariableTab";
import OptionsTab from "./OptionsTab";
import { DuplicateCasesProps } from "./types";
import { useDuplicateCases } from "./hooks/useDuplicateCases";

// Main content component separated from container logic
const DuplicateCasesContent: FC<DuplicateCasesProps> = ({ onClose, containerType = "dialog" }) => {
    const {
        sourceVariables,
        matchingVariables,
        sortingVariables,
        highlightedVariable, setHighlightedVariable,
        activeTab, setActiveTab,
        sortOrder, setSortOrder,
        primaryCaseIndicator, setPrimaryCaseIndicator,
        primaryName, setPrimaryName,
        filterByIndicator, setFilterByIndicator,
        sequentialCount, setSequentialCount,
        sequentialName, setSequentialName,
        moveMatchingToTop, setMoveMatchingToTop,
        displayFrequencies, setDisplayFrequencies,
        errorMessage, errorDialogOpen, setErrorDialogOpen,
        isProcessing,
        handleMoveVariable,
        handleReorderVariable,
        handleReset,
        handleConfirm,
    } = useDuplicateCases({ onClose });

    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        }
    };

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    return (
        <>
            <div className={`flex flex-col ${containerType === "sidebar" ? "h-full overflow-hidden" : "max-h-[85vh]"}`}>
                {containerType === "dialog" && (
                    <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                        <DialogTitle className="text-[22px] font-semibold text-foreground">Identify Duplicate Cases</DialogTitle>
                    </DialogHeader>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow overflow-hidden">
                    <div className="border-b border-border flex-shrink-0">
                        <TabsList className="bg-muted rounded-none h-9 p-0">
                            <TabsTrigger
                                value="variables"
                                className={`px-4 h-8 rounded-none text-sm ${activeTab === 'variables' ? 'bg-background border-t border-l border-r border-border text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                            >
                                Variables
                            </TabsTrigger>
                            <TabsTrigger
                                value="options"
                                className={`px-4 h-8 rounded-none text-sm ${activeTab === 'options' ? 'bg-background border-t border-l border-r border-border text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                            >
                                Options
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                        <VariableTab
                            sourceVariables={sourceVariables}
                            matchingVariables={matchingVariables}
                            sortingVariables={sortingVariables}
                            highlightedVariable={highlightedVariable}
                            setHighlightedVariable={setHighlightedVariable}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            handleMoveVariable={handleMoveVariable}
                            handleReorderVariable={handleReorderVariable}
                            getVariableIcon={getVariableIcon}
                            getDisplayName={getDisplayName}
                            containerType={containerType}
                        />
                    </TabsContent>

                    <TabsContent value="options" className="p-6 overflow-y-auto flex-grow">
                        <OptionsTab
                            primaryCaseIndicator={primaryCaseIndicator}
                            setPrimaryCaseIndicator={setPrimaryCaseIndicator}
                            primaryName={primaryName}
                            setPrimaryName={setPrimaryName}
                            sequentialCount={sequentialCount}
                            setSequentialCount={setSequentialCount}
                            sequentialName={sequentialName}
                            setSequentialName={setSequentialName}
                            moveMatchingToTop={moveMatchingToTop}
                            setMoveMatchingToTop={setMoveMatchingToTop}
                            containerType={containerType}
                        />
                    </TabsContent>
                </Tabs>

                <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                    {/* Left: Help icon */}
                    <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                        <HelpCircle size={18} className="mr-1" />
                    </div>
                    {/* Right: Buttons */}
                    <div>
                        <Button
                            variant="outline"
                            className="mr-2"
                            onClick={handleReset}
                            disabled={isProcessing}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="outline"
                            className="mr-2"
                            onClick={onClose}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={isProcessing}
                        >
                            {isProcessing ? "Processing..." : "OK"}
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent className="max-w-[400px] p-6 bg-popover border border-border shadow-md rounded-md">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-[18px] font-semibold text-popover-foreground">IBM SPSS Statistics</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-4 items-start">
                        <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-popover-foreground">{errorMessage}</p>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4"
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

// Main component that handles different container types
const DuplicateCases: FC<DuplicateCasesProps> = ({ onClose, containerType = "dialog" }) => {
    // If sidebar mode, use a div container
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <DuplicateCasesContent onClose={onClose} containerType={containerType} />
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-[650px] p-0 bg-popover border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
                <DuplicateCasesContent onClose={onClose} containerType={containerType} />
            </DialogContent>
        </Dialog>
    );
};

export default DuplicateCases;