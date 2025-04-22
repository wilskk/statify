import React, { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Variable } from "@/types/Variable";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    ChevronRight,
    InfoIcon,
    GripVertical,
    MoveHorizontal
} from "lucide-react";

interface VariablesTabProps {
    storeVariables: Variable[];
    highlightedVariable: string | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<string | null>>;
    numeratorVariable: Variable | null;
    denominatorVariable: Variable | null;
    groupVariable: Variable | null;
    setAsNumerator: () => void;
    setAsDenominator: () => void;
    setAsGroupVariable: () => void;
}

type VariableListType = 'store' | 'numerator' | 'denominator' | 'group';

const VariablesTab: FC<VariablesTabProps> = ({
                                                 storeVariables,
                                                 highlightedVariable,
                                                 setHighlightedVariable,
                                                 numeratorVariable,
                                                 denominatorVariable,
                                                 groupVariable,
                                                 setAsNumerator,
                                                 setAsDenominator,
                                                 setAsGroupVariable
                                             }) => {
    // Drag and drop state
    const [draggedItem, setDraggedItem] = useState<{ variable: Variable, source: VariableListType } | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState<VariableListType | null>(null);

    const handleVariableClick = (columnIndex: string) => {
        setHighlightedVariable(columnIndex === highlightedVariable ? null : columnIndex);
    };

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

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, variable: Variable, source: VariableListType) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            columnIndex: variable.columnIndex,
            source
        }));
        e.dataTransfer.effectAllowed = 'move';
        setDraggedItem({ variable, source });
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setIsDraggingOver(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetList: VariableListType) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDraggingOver(targetList);
    };

    const handleDragLeave = () => {
        setIsDraggingOver(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetList: VariableListType) => {
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            const { columnIndex, source } = data;

            // Find the variable by columnIndex
            let variable: Variable | undefined;

            switch (source) {
                case 'store':
                    variable = storeVariables.find(v => v.columnIndex.toString() === columnIndex.toString());
                    break;
                case 'numerator':
                    if (numeratorVariable && numeratorVariable.columnIndex.toString() === columnIndex.toString()) {
                        variable = numeratorVariable;
                    }
                    break;
                case 'denominator':
                    if (denominatorVariable && denominatorVariable.columnIndex.toString() === columnIndex.toString()) {
                        variable = denominatorVariable;
                    }
                    break;
                case 'group':
                    if (groupVariable && groupVariable.columnIndex.toString() === columnIndex.toString()) {
                        variable = groupVariable;
                    }
                    break;
            }

            if (!variable) return;

            // Set the highlighted variable (required for the existing API)
            setHighlightedVariable(variable.columnIndex.toString());

            // Special handling for dragging back to store list - need to remove from current assignment
            if (targetList === 'store') {
                // If the source isn't store, we need to remove it from its current assignment
                if (source === 'numerator' && numeratorVariable) {
                    // We use a timeout to make sure the UI updates properly
                    setTimeout(() => {
                        // Need to implement mechanism to clear numerator
                        // For now we just do nothing - user needs to use other UI methods
                    }, 0);
                }
                if (source === 'denominator' && denominatorVariable) {
                    // Need to implement mechanism to clear denominator
                }
                if (source === 'group' && groupVariable) {
                    // Need to implement mechanism to clear group
                }

                // Skip further processing since we're just removing from assignment
                setIsDraggingOver(null);
                setDraggedItem(null);
                return;
            }

            // Assign the variable based on the target list
            switch (targetList) {
                case 'numerator':
                    setTimeout(() => setAsNumerator(), 0);
                    break;
                case 'denominator':
                    setTimeout(() => setAsDenominator(), 0);
                    break;
                case 'group':
                    setTimeout(() => setAsGroupVariable(), 0);
                    break;
            }
        } catch (error) {
            console.error('[handleDrop] Error:', error);
        }

        setIsDraggingOver(null);
        setDraggedItem(null);
    };

    // Render a variable item with drag capability
    const renderVariableItem = (variable: Variable, source: VariableListType) => {
        const isDraggingThis = draggedItem?.variable.columnIndex === variable.columnIndex && draggedItem.source === source;

        return (
            <TooltipProvider key={variable.columnIndex}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={`flex items-center p-1 cursor-grab border rounded-md group relative
                                ${isDraggingThis ? "opacity-40 bg-[#FAFAFA]" : "hover:bg-[#F5F5F5]"}
                                ${highlightedVariable === variable.columnIndex.toString()
                                ? "bg-[#E6E6E6] border-[#888888]"
                                : "border-[#CCCCCC]"
                            }`}
                            onClick={() => handleVariableClick(variable.columnIndex.toString())}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, variable, source)}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="flex items-center w-full">
                                <GripVertical size={14} className="text-[#AAAAAA] mr-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
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
        );
    };

    // Render a drop target for a single variable
    const renderSingleDropTarget = (
        title: string,
        targetList: VariableListType,
        currentVariable: Variable | null,
        setFunction: () => void
    ) => (
        <div className="mb-3">
            <div className="text-sm mb-1">{title}:</div>
            <div className="flex">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 mr-2 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                    onClick={setFunction}
                    disabled={!highlightedVariable}
                >
                    <ChevronRight size={16} />
                </Button>
                <div
                    className={`border rounded-md h-8 flex-grow flex items-center px-2 
                        ${isDraggingOver === targetList
                        ? "border-blue-500 bg-blue-50"
                        : "border-[#E6E6E6] bg-[#F7F7F7]"
                    }`}
                    onDragOver={(e) => handleDragOver(e, targetList)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, targetList)}
                    draggable={!!currentVariable}
                    onDragStart={(e) => currentVariable && handleDragStart(e, currentVariable, targetList)}
                >
                    {!currentVariable && isDraggingOver === targetList && (
                        <div className="w-full flex justify-center items-center text-blue-500 text-xs">
                            Drop to set {title.toLowerCase()}
                        </div>
                    )}

                    {currentVariable ? (
                        <span className="text-xs truncate flex items-center">
                            {getVariableIcon(currentVariable)}
                            {getDisplayName(currentVariable)}
                        </span>
                    ) : (
                        <span className="text-xs text-[#888888]">
                            {isDraggingOver === targetList ? "" : "Drag a variable here"}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-6 gap-6">
                {/* Left side - Variable list */}
                <div className="col-span-3">
                    <div className="text-sm mb-2 font-medium">Variables:</div>
                    <div
                        className={`border p-2 rounded-md overflow-y-auto overflow-x-hidden transition-colors ${
                            isDraggingOver === 'store'
                                ? "border-blue-500 bg-blue-50"
                                : "border-[#E6E6E6]"
                        }`}
                        style={{ height: '250px' }}
                        onDragOver={(e) => handleDragOver(e, 'store')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'store')}
                    >
                        {storeVariables.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-[#888888] pointer-events-none p-4">
                                <MoveHorizontal size={24} className="mb-2" />
                                <p className="text-xs text-center">All variables have been assigned</p>
                            </div>
                        )}
                        <div className="space-y-1">
                            {storeVariables.map((variable) =>
                                renderVariableItem(variable, 'store')
                            )}
                        </div>
                    </div>
                    <div className="text-xs mt-2 text-[#888888] flex items-center">
                        <InfoIcon size={14} className="mr-1.5 flex-shrink-0" />
                        <span>Drag variables to assign or reorder</span>
                    </div>
                </div>

                {/* Right side - Variable selections */}
                <div className="col-span-3 space-y-4">
                    <div className="border border-[#E6E6E6] rounded-md p-4">
                        <div className="text-sm font-medium mb-3">Variable Assignment</div>

                        {renderSingleDropTarget("Numerator", "numerator", numeratorVariable, setAsNumerator)}
                        {renderSingleDropTarget("Denominator", "denominator", denominatorVariable, setAsDenominator)}
                        {renderSingleDropTarget("Group Variable", "group", groupVariable, setAsGroupVariable)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;