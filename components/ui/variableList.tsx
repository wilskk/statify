import React, { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Ruler, Shapes, BarChartHorizontal, Info } from "lucide-react";
import { Variable } from "@/types/Variable";
import { cn } from "@/lib/utils";

interface VariableListProps {
    title: string;
    variables: Variable[];
    highlightedVariable: { id: string; source: string } | null;
    source: string;
    height?: string;
    subtitle?: string;
    emptyMessage?: string;
    onVariableSelect: (columnIndex: number, source: string) => void;
    onVariableDoubleClick?: (columnIndex: number, source: string) => void;
    className?: string;
}

export const VariableList: React.FC<VariableListProps> = ({
                                                              title,
                                                              variables,
                                                              highlightedVariable,
                                                              source,
                                                              height = "250px",
                                                              subtitle,
                                                              emptyMessage = "No variables available",
                                                              onVariableSelect,
                                                              onVariableDoubleClick,
                                                              className = "",
                                                          }) => {
    // Measure type icons with appropriate colors
    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-[#444444] flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-[#444444] flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-[#444444] flex-shrink-0" />;
            default:
                // Default based on type
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-[#444444] flex-shrink-0" />
                    : <Ruler size={14} className="text-[#444444] flex-shrink-0" />;
        }
    };

    // Get proper display name for variable
    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    // Get tooltip content with variable details
    const getTooltipContent = (variable: Variable) => {
        return (
            <div className="space-y-1">
                <p className="font-semibold">{variable.name}</p>
                {variable.label && <p>Label: {variable.label}</p>}
                <p>Type: {variable.type}</p>
                {variable.measure && <p>Measure: {variable.measure}</p>}
            </div>
        );
    };

    // Memoize variable items to prevent unnecessary re-renders
    const variableItems = useMemo(() => {
        return variables.map((variable) => {
            const isHighlighted =
                highlightedVariable?.id === variable.columnIndex.toString() &&
                highlightedVariable.source === source;

            return (
                <TooltipProvider key={`${source}-${variable.columnIndex}`}>
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <div
                                role="button"
                                tabIndex={0}
                                className={cn(
                                    "flex items-center p-2 cursor-pointer rounded-sm border transition-colors",
                                    "hover:bg-[#F7F7F7] focus:outline-none focus:ring-1 focus:ring-black",
                                    isHighlighted
                                        ? "bg-[#F7F7F7] border-[#888888]"
                                        : "border-[#E6E6E6]"
                                )}
                                onClick={() => onVariableSelect(variable.columnIndex, source)}
                                onDoubleClick={() => onVariableDoubleClick && onVariableDoubleClick(variable.columnIndex, source)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        onVariableSelect(variable.columnIndex, source);
                                        e.preventDefault();
                                    }
                                }}
                                aria-selected={isHighlighted}
                                data-selected={isHighlighted ? "true" : "false"}
                            >
                                <div className="flex items-center space-x-2 w-full">
                                    {getVariableIcon(variable)}
                                    <span className="text-xs font-medium truncate flex-grow">{getDisplayName(variable)}</span>
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="start" className="z-50 max-w-xs">
                            {getTooltipContent(variable)}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        });
    }, [variables, highlightedVariable, source, onVariableSelect, onVariableDoubleClick]);

    return (
        <div className={cn("flex flex-col w-full", className)}>
            <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#444444] mb-0">{title}</label>
                {subtitle && (
                    <div className="flex items-center">
                        <span className="text-xs text-[#888888]">{subtitle}</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info size={12} className="ml-1 text-[#888888]" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs">{subtitle}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}
            </div>

            <div
                className={cn(
                    "border border-[#E6E6E6] rounded-sm",
                    "overflow-y-auto overflow-x-hidden",
                    "focus-within:border-[#888888]",
                    "transition-colors duration-200"
                )}
                style={{ height }}
            >
                {variables.length > 0 ? (
                    <div className="space-y-1 p-1 min-w-full">
                        {variableItems}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-xs text-[#888888]">{emptyMessage}</p>
                    </div>
                )}
            </div>
        </div>
    );
};