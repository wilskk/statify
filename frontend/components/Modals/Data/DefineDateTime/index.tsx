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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Clock, Info } from "lucide-react";
import { useMetaStore } from "@/stores/useMetaStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import {
    TimeComponent,
    getTimeComponentsFromCase,
    formatDateForMetaStore,
    formatCurrentDates,
    createDateVariables,
    getMaxRow
} from "./dateUtils";

interface DefineDateTimeProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

// Main content component that's agnostic of container type
const DefineDateTimeContent: FC<DefineDateTimeProps> = ({ onClose }) => {
    const { meta, setMeta } = useMetaStore();
    const { variables, addVariable, resetVariables } = useVariableStore();
    const { updateBulkCells, data } = useDataStore();

    const [casesAreOptions] = useState<string[]>([
        "Years",
        "Years, quarters",
        "Years, months",
        "Years, quarters, months",
        "Days",
        "Weeks, days",
        "Weeks, work days(5)",
        "Weeks, work days(6)",
        "Hours",
        "Days, hours",
        "Days, work hour(8)",
        "Weeks, days, hours",
        "Weeks, work days, hours",
        "Minutes",
        "Hours, minutes",
        "Days, hours, minutes",
        "Seconds",
        "Minutes, seconds",
        "Hours, minutes, seconds",
        "Not dated"
    ]);
    const [selectedCase, setSelectedCase] = useState<string>("Years, quarters");

    const [timeComponents, setTimeComponents] = useState<TimeComponent[]>([
        { name: "Year", value: 1900 },
        { name: "Quarter", value: 1, periodicity: 4 }
    ]);

    useEffect(() => {
        const components = getTimeComponentsFromCase(selectedCase);
        console.log("Selected case:", selectedCase);
        console.log("Generated components:", components);
        setTimeComponents(components);
    }, [selectedCase]);

    const handleInputChange = (index: number, value: number) => {
        const updatedComponents = [...timeComponents];
        updatedComponents[index].value = value;
        setTimeComponents(updatedComponents);
    };

    const handleOk = async () => {
        const dateString = formatDateForMetaStore(selectedCase, timeComponents);
        setMeta({ dates: dateString });

        await createDateVariables(
            selectedCase,
            timeComponents,
            variables,
            addVariable,
            resetVariables,
            updateBulkCells,
            getMaxRow(data)
        );

        onClose();
    };

    const handleReset = () => {
        setSelectedCase("Years, quarters");
    };

    return (
        <>
            {/* Main container for content, behaves like Tabs in Descriptives */}
            <div className="w-full flex flex-col flex-grow overflow-hidden">
                {/* Scrollable area for the grid */}
                <div className="flex-grow p-6 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4 h-full"> {/* Grid takes full height of scrollable parent */}
                        {/* Left Column */}
                        <div className="flex flex-col space-y-2 h-full"> {/* Takes full height of grid cell */}
                            <Label className="text-xs font-semibold text-foreground flex-shrink-0">Cases Are:</Label>
                            <div 
                                className="border border-border p-2 rounded-md overflow-y-auto overflow-x-hidden"
                                style={{ height: '350px' }}
                            >
                                <div className="space-y-1">
                                    {casesAreOptions.map((option) => (
                                        <TooltipProvider key={option}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-accent ${selectedCase === option ? 'bg-accent border-primary text-accent-foreground' : 'border-border text-foreground'}`}
                                                        onClick={() => setSelectedCase(option)}
                                                    >
                                                        <div className="flex items-center w-full">
                                                            <Calendar size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
                                                            <span className="text-xs truncate">{option}</span>
                                                        </div>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="right">
                                                    <p className="text-xs">{option}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                </div>
                            </div>

                            <div className="border border-border p-2 rounded-md bg-card">
                                <Label className="text-xs font-semibold mb-1 block text-foreground">Current Dates:</Label>
                                <div className="flex items-center">
                                    <Clock size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
                                    <span className="text-xs text-foreground">{formatCurrentDates(selectedCase, timeComponents)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="flex flex-col space-y-2 h-full"> {/* Takes full height of grid cell */}
                            <Label className="text-xs font-semibold text-foreground flex-shrink-0">First Case Is:</Label>
                            {/* Inner scrollable area for right column content */}
                            <div className="flex-grow overflow-y-auto min-h-0 space-y-2">
                                <div className="border border-border p-2 rounded-md space-y-3 bg-card">
                                    {timeComponents.map((component, index) => (
                                        <div key={index} className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <Label htmlFor={`component-${index}`} className="text-xs block text-foreground">
                                                    {component.name}:
                                                </Label>

                                                {component.periodicity && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Info size={12} />
                                                        <span>Periodicity: {component.periodicity}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <Input
                                                id={`component-${index}`}
                                                type="number"
                                                value={component.value}
                                                onChange={(e) => handleInputChange(index, Number(e.target.value))}
                                                className="h-7 text-xs"
                                            />
                                        </div>
                                    ))}

                                    {timeComponents.length === 0 && (
                                        <div className="text-xs text-muted-foreground text-center py-2">
                                            No date components to configure
                                        </div>
                                    )}
                                </div>

                                <div className="border border-border p-2 rounded-md bg-muted">
                                    <div className="flex items-start gap-2">
                                        <Info size={14} className="text-primary mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-muted-foreground">
                                            Periodicity values show how many units exist in the next higher level.
                                            For example, there are 4 quarters in a year, 12 months in a year,
                                            7 days in a week, etc.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer (OK, Reset, Cancel, Help buttons) */}
            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button onClick={handleOk}>
                        OK
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                        Reset
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="outline" onClick={() => alert("Help dialog here")}>
                        Help
                    </Button>
                </div>
            </div>
        </>
    );
};

// Main component that handles different container types
const DefineDateTime: FC<DefineDateTimeProps> = ({ onClose, containerType = "dialog" }) => {
    // If sidebar mode, use a div container without header (header is provided by SidebarContainer)
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <DefineDateTimeContent onClose={onClose} />
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-[600px] p-0 bg-popover text-popover-foreground border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold">Define Dates</DialogTitle>
                </DialogHeader>
                
                <div className="flex-grow flex flex-col overflow-hidden">
                    <DefineDateTimeContent onClose={onClose} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DefineDateTime;