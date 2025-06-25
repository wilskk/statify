"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SortVariablesModalProps } from "./types";
import { useSortVariables } from "./hooks/useSortVariables";
import { HelpCircle } from "lucide-react";

// Content component separated from container logic
const SortVariablesContent: React.FC<SortVariablesModalProps> = ({ 
    onClose,
}) => {
    const {
        columns,
        selectedColumn,
        sortOrder,
        handleSelectColumn,
        setSortOrder,
        handleOk,
        handleReset,
    } = useSortVariables({ onClose });

    return (
        <>
            {/* Standardized content area */}
            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                <div>
                    <p className="font-semibold mb-2">Variable View Columns</p>
                    <ul className="border border-border p-2 h-40 overflow-auto">
                        {columns.map((col) => (
                            <li
                                key={col}
                                className={`p-1 cursor-pointer hover:bg-accent ${
                                    selectedColumn === col ? "bg-muted" : ""
                                }`}
                                onClick={() => handleSelectColumn(col)}
                            >
                                {col}
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <p className="font-semibold mb-2">Sort Order</p>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input
                                type="radio"
                                name="sortOrder"
                                value="asc"
                                checked={sortOrder === "asc"}
                                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                            />
                            Ascending
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input
                                type="radio"
                                name="sortOrder"
                                value="desc"
                                checked={sortOrder === "desc"}
                                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                            />
                            Descending
                        </label>
                    </div>
                </div>

            </div>

            {/* Standardized action buttons footer */}
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
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="mr-2"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleOk}>
                        OK
                    </Button>
                </div>
            </div>
        </>
    );
};

// Main component that handles different container types
const SortVariablesModal: React.FC<SortVariablesModalProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    // If sidebar mode, use a div container
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <SortVariablesContent onClose={onClose} />
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent with standardized structure
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-md p-0 bg-popover text-popover-foreground border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
                {/* Dialog Header */}
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold">Sort Variables</DialogTitle>
                </DialogHeader>
                 {/* Content Wrapper */}
                <div className="flex-grow flex flex-col overflow-hidden">
                    <SortVariablesContent onClose={onClose} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SortVariablesModal;