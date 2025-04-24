import React, { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Variable } from "@/types/Variable";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    ChevronRight,
    ChevronLeft,
    InfoIcon,
    GripVertical,
    MoveHorizontal
} from "lucide-react";

// Define source types
type VariableListType = 'available' | 'numerator' | 'denominator' | 'group';

interface VariablesTabProps {
    // Rename storeVariables to availableVariables
    availableVariables: Variable[];
    // Update highlightedVariable type
    highlightedVariable: {tempId: string, source: VariableListType} | null;
    // Update setHighlightedVariable type
    setHighlightedVariable: React.Dispatch<React.SetStateAction<{tempId: string, source: VariableListType} | null>>;
    numeratorVariable: Variable | null;
    denominatorVariable: Variable | null;
    groupVariable: Variable | null;
    // Keep simple handlers from index.tsx (or implement drag/drop here)
    setAsNumerator: () => void;
    setAsDenominator: () => void;
    setAsGroupVariable: () => void;
    removeFromNumerator: () => void;
    removeFromDenominator: () => void;
    removeFromGroupVariable: () => void;
    // Add functions passed from index.tsx for drag/drop
    addVariableBackToAvailable: (variable: Variable | null) => void;
    setVariableForRole: (role: 'numerator' | 'denominator' | 'group') => void;
}

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables, // Use renamed prop
    highlightedVariable,
    setHighlightedVariable,
    numeratorVariable,
    denominatorVariable,
    groupVariable,
    setAsNumerator,
    setAsDenominator,
    setAsGroupVariable,
    removeFromNumerator,
    removeFromDenominator,
    removeFromGroupVariable,
    // Destructure new props
    addVariableBackToAvailable,
    setVariableForRole
}) => {
    // Drag and drop state
    const [draggedItem, setDraggedItem] = useState<{ variable: Variable, source: VariableListType } | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState<VariableListType | null>(null);

    // Update click handler to use tempId and set source
    const handleVariableClick = (variable: Variable, source: VariableListType) => {
        if (highlightedVariable?.tempId === variable.tempId && highlightedVariable.source === source) {
            setHighlightedVariable(null); // Deselect if clicking the same highlighted variable
        } else if (variable.tempId) {
            setHighlightedVariable({ tempId: variable.tempId, source });
        }
    };

    // Double click handler (optional, can rely on buttons or drag/drop)
    const handleVariableDoubleClick = (variable: Variable, source: VariableListType) => {
        if (!variable.tempId) return;
        if (source === 'available') {
            // If available, try assigning to numerator first, then denominator, then group if empty
            if (!numeratorVariable) setVariableForRole('numerator');
            else if (!denominatorVariable) setVariableForRole('denominator');
            else if (!groupVariable) setVariableForRole('group');
            // Need to ensure the correct variable is moved, requires setting highlight first
            // This might be complex, suggest removing double click or refining logic
            // A simpler approach: setHighlightedVariable({ tempId: variable.tempId, source: 'available' }); then trigger role assignment
            // For now, let's comment out the direct calls and rely on selection + button/drag
             setHighlightedVariable({ tempId: variable.tempId, source: 'available' });
             // console.log("Double clicked available, set highlight. Use buttons to assign.");
        } else if (source === 'numerator') {
            addVariableBackToAvailable(variable);
            removeFromNumerator(); // Use the passed function
        } else if (source === 'denominator') {
            addVariableBackToAvailable(variable);
            removeFromDenominator(); // Use the passed function
        } else if (source === 'group') {
            addVariableBackToAvailable(variable);
            removeFromGroupVariable(); // Use the passed function
        }
        // Deselect after double click action
        if (highlightedVariable && highlightedVariable.tempId === variable.tempId) {
             setHighlightedVariable(null);
        }
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

    // Drag and drop handlers - Use tempId
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, variable: Variable, source: VariableListType) => {
        if (!variable.tempId) {
             e.preventDefault();
             return;
        }
        // Highlight the dragged item
        setHighlightedVariable({ tempId: variable.tempId, source });

        e.dataTransfer.setData('application/json', JSON.stringify({
            tempId: variable.tempId, // Use tempId
            source
        }));
        e.dataTransfer.effectAllowed = 'move';
        setDraggedItem({ variable, source });
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setIsDraggingOver(null);
        // Optional: Clear highlight after drag ends, or keep it
        // setHighlightedVariable(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetList: VariableListType) => {
        e.preventDefault();
        if (!draggedItem) return;

        // Prevent dropping onto the same single-item list
        if (draggedItem.source === targetList && targetList !== 'available') {
            e.dataTransfer.dropEffect = 'none';
            return;
        }
        // Prevent dropping onto a full single-item list from available
        if (draggedItem.source === 'available') {
            if (targetList === 'numerator' && numeratorVariable) {
                e.dataTransfer.dropEffect = 'none'; return;
            }
            if (targetList === 'denominator' && denominatorVariable) {
                e.dataTransfer.dropEffect = 'none'; return;
            }
            if (targetList === 'group' && groupVariable) {
                 e.dataTransfer.dropEffect = 'none'; return;
            }
        }

        e.dataTransfer.dropEffect = 'move';
        setIsDraggingOver(targetList);
    };

    const handleDragLeave = () => {
        setIsDraggingOver(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetList: VariableListType) => {
        e.preventDefault();
        setIsDraggingOver(null);

        if (!draggedItem) return; // Check if draggedItem exists

        const { variable: draggedVariable, source: dragSource } = draggedItem;

        if (!draggedVariable || !draggedVariable.tempId) {
            console.error("Dragged item is missing variable or tempId");
            setDraggedItem(null);
            return;
        }

        // Moving within the available list (reordering - not implemented here, handled in parent if needed)
        if (dragSource === 'available' && targetList === 'available') {
            // console.log("Reordering within available list - to be handled by parent");
            setDraggedItem(null);
            return;
        }

        // Moving from a role back to available
        if (targetList === 'available') {
            if (dragSource === 'numerator') removeFromNumerator();
            if (dragSource === 'denominator') removeFromDenominator();
            if (dragSource === 'group') removeFromGroupVariable();
            addVariableBackToAvailable(draggedVariable);
        }
        // Moving from available to a role
        else if (dragSource === 'available') {
            if (targetList === 'numerator' && !numeratorVariable) setVariableForRole('numerator');
            if (targetList === 'denominator' && !denominatorVariable) setVariableForRole('denominator');
            if (targetList === 'group' && !groupVariable) setVariableForRole('group');
        }
        // Moving between roles (e.g., numerator to denominator)
        else if (dragSource !== targetList) {
            // 1. Add the source variable back to available temporarily
             addVariableBackToAvailable(draggedVariable);
             // 2. Remove from the original role
             if (dragSource === 'numerator') removeFromNumerator();
             if (dragSource === 'denominator') removeFromDenominator();
             if (dragSource === 'group') removeFromGroupVariable();
             // 3. Assign to the target role (setVariableForRole handles moving from available)
             //    Need to ensure the correct variable (draggedVariable) is selected/highlighted before calling setVariableForRole
             const tempIdToHighlight = draggedVariable.tempId;
             setHighlightedVariable({ tempId: tempIdToHighlight, source: 'available' });
             // Use setTimeout to allow state update before calling the role assignment
             setTimeout(() => {
                 if (targetList === 'numerator' && !numeratorVariable) setVariableForRole('numerator');
                 if (targetList === 'denominator' && !denominatorVariable) setVariableForRole('denominator');
                 if (targetList === 'group' && !groupVariable) setVariableForRole('group');
             }, 0);
        }

        setDraggedItem(null);
    };

    // Render a variable item with drag capability - Use tempId
    const renderVariableItem = (variable: Variable, source: VariableListType) => {
        if (!variable.tempId) return null; // Do not render if no tempId
        const isDraggingThis = draggedItem?.variable.tempId === variable.tempId && draggedItem?.source === source;
        const isHighlighted = highlightedVariable?.tempId === variable.tempId && highlightedVariable?.source === source;

        return (
            <TooltipProvider key={variable.tempId}> {/* Use tempId as key */} 
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={`flex items-center p-1 border rounded-md group relative transition-all duration-150 ease-in-out
                                ${source === 'available' ? 'cursor-grab' : 'cursor-default'} ${ // Adjust cursor
                                isDraggingThis ? "opacity-40 bg-[#FAFAFA]" : "hover:bg-[#F5F5F5]"}
                                ${isHighlighted
                                ? "bg-[#E6E6E6] border-[#888888]"
                                : "border-[#CCCCCC]"
                            }`}
                            onClick={() => handleVariableClick(variable, source)}
                            onDoubleClick={() => handleVariableDoubleClick(variable, source)}
                            draggable={!!variable.tempId} // Draggable if tempId exists
                            onDragStart={(e) => handleDragStart(e, variable, source)}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="flex items-center w-full">
                                {/* Show grip only for available list */}
                                {source === 'available' && <GripVertical size={14} className="text-[#AAAAAA] mr-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />}
                                {getVariableIcon(variable)}
                                <span className="text-sm truncate">{getDisplayName(variable)}</span> {/* Slightly larger text */} 
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p className="text-sm">{getDisplayName(variable)}</p> {/* Slightly larger text */} 
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    // Render a drop target for a single variable - Use tempId
    const renderSingleDropTarget = (
        title: string,
        targetList: 'numerator' | 'denominator' | 'group', // Explicit types
        currentVariable: Variable | null
    ) => (
        <div className="mb-3">
            <div className="text-sm mb-1.5 font-medium text-[#444444]">{title}:</div> {/* Adjusted style */} 
            <div
                className={`border rounded-md h-9 flex items-center px-2 relative transition-colors min-w-0 ${ // Adjusted height
                    isDraggingOver === targetList
                    ? "border-blue-500 bg-blue-50"
                    // Highlight border if the current variable is selected
                    : (highlightedVariable?.tempId === currentVariable?.tempId && highlightedVariable?.source === targetList)
                        ? "border-[#888888] bg-[#F0F0F0]" 
                        : "border-[#CCCCCC] bg-[#F9F9F9]" // Adjusted background 
                }`}
                onDragOver={(e) => handleDragOver(e, targetList)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, targetList)}
                // Allow dragging from the target list only if a variable exists
                draggable={!!currentVariable?.tempId}
                onDragStart={(e) => currentVariable && handleDragStart(e, currentVariable, targetList)}
                onDragEnd={handleDragEnd}
                onClick={() => currentVariable && handleVariableClick(currentVariable, targetList)} // Allow selection
                onDoubleClick={() => currentVariable && handleVariableDoubleClick(currentVariable, targetList)} // Allow double click removal
            >
                {currentVariable ? (
                    renderVariableItem(currentVariable, targetList) // Use renderVariableItem for consistency
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#AAAAAA] pointer-events-none">
                         <span className="text-xs italic">
                             {isDraggingOver === targetList ? "Drop here" : "Assign variable"} {/* Contextual placeholder */} 
                         </span>
                     </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="p-6 grid grid-cols-5 gap-4"> {/* Adjusted grid and gap */} 
            {/* Left side - Variable list */}
            <div className="col-span-2 flex flex-col"> {/* Adjusted span */} 
                <div className="text-sm mb-2 font-medium text-[#444444]">Available Variables:</div>
                <div
                    className={`border p-1.5 rounded-md overflow-y-auto overflow-x-hidden transition-colors bg-white ${ // Adjusted padding
                        isDraggingOver === 'available' ? "border-blue-500 bg-blue-50" : "border-[#CCCCCC]"}`}
                    style={{ height: '280px' }} // Adjusted height
                    onDragOver={(e) => handleDragOver(e, 'available')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'available')}
                >
                    {availableVariables.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-[#AAAAAA] pointer-events-none p-4">
                            <MoveHorizontal size={20} className="mb-1.5" /> {/* Adjusted size/margin */} 
                            <p className="text-xs text-center">All variables assigned</p>
                        </div>
                    )}
                    <div className="space-y-1">
                        {availableVariables.map((variable) =>
                            renderVariableItem(variable, 'available')
                        )}
                    </div>
                </div>
                <div className="text-xs mt-2 text-[#888888] flex items-center p-1.5 rounded bg-[#F9F9F9] border border-[#E6E6E6]">
                    <InfoIcon size={14} className="mr-1.5 flex-shrink-0 text-[#AAAAAA]" />
                    <span>Click to select, drag to assign</span>
                </div>
            </div>

            {/* Middle - Buttons (Optional but helpful) */}
            <div className="col-span-1 flex flex-col items-center justify-center space-y-3">
                 <Button
                     variant="outline"
                     size="icon"
                     className="border-[#CCCCCC] hover:bg-[#F0F0F0] w-7 h-7" // Smaller icon button
                     onClick={setAsNumerator}
                     disabled={!highlightedVariable || highlightedVariable.source !== 'available' || !!numeratorVariable}
                     title="Set as Numerator"
                 >
                     <ChevronRight size={16} />
                 </Button>
                 <Button
                     variant="outline"
                     size="icon"
                     className="border-[#CCCCCC] hover:bg-[#F0F0F0] w-7 h-7"
                     onClick={setAsDenominator}
                     disabled={!highlightedVariable || highlightedVariable.source !== 'available' || !!denominatorVariable}
                     title="Set as Denominator"
                 >
                     <ChevronRight size={16} />
                 </Button>
                <Button
                     variant="outline"
                     size="icon"
                     className="border-[#CCCCCC] hover:bg-[#F0F0F0] w-7 h-7"
                     onClick={setAsGroupVariable}
                     disabled={!highlightedVariable || highlightedVariable.source !== 'available' || !!groupVariable}
                     title="Set as Group Variable"
                 >
                     <ChevronRight size={16} />
                 </Button>
            </div>

            {/* Right side - Variable selections */}
            <div className="col-span-2 flex flex-col"> {/* Adjusted span */} 
                <div className="text-sm mb-2 font-medium text-[#444444]">Assigned Variables:</div>
                <div className="space-y-1 border border-[#E6E6E6] rounded-md p-3 bg-[#F9F9F9]"> {/* Grouped assignments */} 
                    {renderSingleDropTarget("Numerator", "numerator", numeratorVariable)}
                    {renderSingleDropTarget("Denominator", "denominator", denominatorVariable)}
                    {renderSingleDropTarget("Group Variable", "group", groupVariable)}
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;