import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowRight, ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TransferControlProps {
    highlightedVariable: { id: string; source: string } | null;
    onTransfer: (direction: "left" | "right") => void;
    orientation?: "vertical" | "horizontal";
    sources: string[];
    leftLabel?: string;
    rightLabel?: string;
    className?: string;
    disabled?: boolean;
}

/**
 * TransferControl - Component to handle bidirectional transfer between variable lists
 *
 * Renders buttons with directional arrows for moving items between lists,
 * with support for both horizontal and vertical layouts.
 */
export const TransferControl: React.FC<TransferControlProps> = ({
                                                                    highlightedVariable,
                                                                    onTransfer,
                                                                    orientation = "horizontal",
                                                                    sources,
                                                                    leftLabel = "Move left",
                                                                    rightLabel = "Move right",
                                                                    className = "",
                                                                    disabled = false,
                                                                }) => {
    const isDisabled = disabled || !highlightedVariable;

    // Determine if transfer in a direction is possible
    const canTransfer = (direction: "left" | "right"): boolean => {
        if (!highlightedVariable || disabled) return false;

        const sourceIndex = sources.indexOf(highlightedVariable.source);
        if (sourceIndex === -1) return false;

        // For left/up direction, we need a source to the left/up
        if (direction === "left" && sourceIndex > 0) return true;

        // For right/down direction, we need a source to the right/down
        if (direction === "right" && sourceIndex < sources.length - 1) return true;

        return false;
    };

    // Get appropriate tooltips based on orientation
    const getTooltip = (direction: "left" | "right") => {
        if (orientation === "vertical") {
            return direction === "left" ? "Move up" : "Move down";
        }
        return direction === "left" ? leftLabel : rightLabel;
    };

    // Get appropriate arrow based on orientation and direction
    const getArrow = (direction: "left" | "right") => {
        if (orientation === "vertical") {
            return direction === "left" ? (
                <ArrowUp size={16} strokeWidth={2} />
            ) : (
                <ArrowDown size={16} strokeWidth={2} />
            );
        }

        return direction === "left" ? (
            <ArrowLeft size={16} strokeWidth={2} />
        ) : (
            <ArrowRight size={16} strokeWidth={2} />
        );
    };

    // Button styles with states
    const buttonBaseClass = cn(
        "h-8 w-8 rounded-full flex items-center justify-center",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1",
        "disabled:opacity-40 disabled:cursor-not-allowed"
    );

    const buttonActiveClass = "bg-[#E6E6E6] hover:bg-[#CCCCCC] active:scale-95";
    const buttonDisabledClass = "bg-[#F7F7F7]";

    // Vertical layout
    if (orientation === "vertical") {
        return (
            <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => canTransfer("left") && onTransfer("left")}
                                disabled={!canTransfer("left")}
                                className={cn(
                                    buttonBaseClass,
                                    canTransfer("left") ? buttonActiveClass : buttonDisabledClass
                                )}
                                aria-label={getTooltip("left")}
                            >
                                {getArrow("left")}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">{getTooltip("left")}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => canTransfer("right") && onTransfer("right")}
                                disabled={!canTransfer("right")}
                                className={cn(
                                    buttonBaseClass,
                                    canTransfer("right") ? buttonActiveClass : buttonDisabledClass
                                )}
                                aria-label={getTooltip("right")}
                            >
                                {getArrow("right")}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">{getTooltip("right")}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        );
    }

    // Horizontal layout (default)
    return (
        <div className={cn("flex items-center justify-center gap-2", className)}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={() => canTransfer("left") && onTransfer("left")}
                            disabled={!canTransfer("left")}
                            className={cn(
                                buttonBaseClass,
                                canTransfer("left") ? buttonActiveClass : buttonDisabledClass
                            )}
                            aria-label={leftLabel}
                        >
                            {getArrow("left")}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>{leftLabel}</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={() => canTransfer("right") && onTransfer("right")}
                            disabled={!canTransfer("right")}
                            className={cn(
                                buttonBaseClass,
                                canTransfer("right") ? buttonActiveClass : buttonDisabledClass
                            )}
                            aria-label={rightLabel}
                        >
                            {getArrow("right")}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>{rightLabel}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
};