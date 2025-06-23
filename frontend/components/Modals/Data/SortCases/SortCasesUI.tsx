"use client";

import React, { FC, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
    Ruler, 
    Shapes, 
    BarChartHorizontal, 
    ChevronUp, 
    ChevronDown, 
    HelpCircle 
} from "lucide-react";
import { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from "@/components/Common/VariableListManager";
import { SortCasesUIProps, SortVariableConfig } from "./types";

const SortCasesUIContent: React.FC<SortCasesUIProps> = ({ 
    onClose,
    containerType = "dialog",
    availableVariables,
    sortByConfigs,
    defaultSortOrder, 
    setDefaultSortOrder,
    highlightedVariable, 
    setHighlightedVariable,
    getSortByVariables,
    handleMoveVariable,
    handleReorderVariable,
    changeSortDirection,
    moveVariableUp,
    moveVariableDown,
    handleOk,
    handleReset,
}) => {
    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale": return <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "nominal": return <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "ordinal": return <BarChartHorizontal size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        }
    };

    const getDisplayName = (variable: Variable): string => {
        return variable.label ? `${variable.label} [${variable.name}]` : variable.name;
    };

    const getSortByDisplayName = useCallback((variable: Variable): string => {
        const config = sortByConfigs.find((c: SortVariableConfig) => c.variable.tempId === variable.tempId);
        const directionSymbol = config?.direction === 'asc' ? '▲' : '▼';
        return `${getDisplayName(variable)} ${directionSymbol}`;
    }, [sortByConfigs]);

    const renderSortByListFooter = () => {
        if (!highlightedVariable || highlightedVariable.source !== 'sortBy') return null;
        
        const selectedTempId = highlightedVariable.id;
        const selectedConfig = sortByConfigs.find((c: SortVariableConfig) => c.variable.tempId === selectedTempId);
        if (!selectedConfig) return null;

        return (
            <div className="mt-2 space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium">Sort Order:</div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline" size="sm" className="h-7 px-2 text-xs"
                                onClick={() => moveVariableUp(selectedTempId)}
                                disabled={sortByConfigs.findIndex((c: SortVariableConfig) => c.variable.tempId === selectedTempId) === 0}
                            >
                                <ChevronUp size={14} className="mr-1" /> Move Up
                            </Button>
                            <Button
                                variant="outline" size="sm" className="h-7 px-2 text-xs"
                                onClick={() => moveVariableDown(selectedTempId)}
                                disabled={sortByConfigs.findIndex((c: SortVariableConfig) => c.variable.tempId === selectedTempId) === sortByConfigs.length - 1}
                            >
                                <ChevronDown size={14} className="mr-1" /> Move Down
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                        <Label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox checked={selectedConfig.direction === "asc"} onCheckedChange={() => changeSortDirection(selectedTempId, 'asc')} />
                            <span className="text-sm">Ascending</span>
                        </Label>
                        <Label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox checked={selectedConfig.direction === "desc"} onCheckedChange={() => changeSortDirection(selectedTempId, 'desc')} />
                            <span className="text-sm">Descending</span>
                        </Label>
                    </div>
                </div>
            </div>
        );
    };

    const sortByListConfig: TargetListConfig = {
        id: 'sortBy',
        title: 'Sort By:',
        variables: getSortByVariables(),
        height: '16rem',
        droppable: true,
        draggableItems: true
    };
    
    const renderDefaultSortOrderControls = useCallback(() => {
        if (highlightedVariable?.source === 'sortBy') return null;
        
        return (
            <div className="mt-2 p-1.5 rounded bg-accent border border-border">
                <div className="text-xs font-medium mb-1">Default Sort Order:</div>
                <div className="flex flex-col space-y-1">
                    <Label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={defaultSortOrder === "asc"} onCheckedChange={() => setDefaultSortOrder("asc")} />
                        <span className="text-xs">Ascending</span>
                    </Label>
                    <Label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={defaultSortOrder === "desc"} onCheckedChange={() => setDefaultSortOrder("desc")} />
                        <span className="text-xs">Descending</span>
                    </Label>
                </div>
            </div>
        );
    }, [defaultSortOrder, highlightedVariable, setDefaultSortOrder]);

    return (
        <>
            {containerType === "dialog" && (
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold">Sort Cases</DialogTitle>
                </DialogHeader>
            )}
            <div className="p-6 overflow-y-auto flex-grow">
                <div className="grid grid-cols-1 gap-6">
                    <VariableListManager
                        availableVariables={availableVariables}
                        targetLists={[sortByListConfig]}
                        variableIdKey="tempId"
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        onMoveVariable={handleMoveVariable}
                        onReorderVariable={handleReorderVariable}
                        getVariableIcon={getVariableIcon}
                        getDisplayName={sortByConfigs.length > 0 ? getSortByDisplayName : getDisplayName}
                        renderListFooter={renderSortByListFooter}
                        showArrowButtons={true}
                        availableListHeight="16rem"
                        renderRightColumnFooter={renderDefaultSortOrderControls}
                    />
                </div>
            </div>
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                    <HelpCircle size={18} className="mr-1" />
                </div>
                <div>
                    <Button variant="outline" className="mr-2" onClick={handleReset}>Reset</Button>
                    <Button variant="outline" className="mr-2" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleOk}>OK</Button>
                </div>
            </div>
        </>
    );
};

export const SortCasesUI: FC<SortCasesUIProps> = (props) => {
    const { containerType = "dialog", onClose } = props;

    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <SortCasesUIContent {...props} />
                </div>
            </div>
        );
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-lg p-0 bg-card border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
                <SortCasesUIContent {...props} />
            </DialogContent>
        </Dialog>
    );
}; 