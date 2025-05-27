"use client";

import React, { FC, useState, useEffect } from "react";
import {
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

interface DefineDatesProps {
    onClose: () => void;
}

const DefineDatesModal: FC<DefineDatesProps> = ({ onClose }) => {
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
        <DialogContent className="max-w-[650px] p-3">
            <DialogHeader className="p-0 mb-2">
                <DialogTitle>Define Dates</DialogTitle>
            </DialogHeader>
            <Separator className="my-0" />

            <div className="grid grid-cols-2 gap-4 py-2">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">Cases Are:</Label>
                    <div className="border border-border p-2 rounded-md h-48 overflow-y-auto overflow-x-hidden">
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

                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">First Case Is:</Label>
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

            <DialogFooter className="flex justify-center space-x-2 mt-2 p-0">
                <Button size="sm" className="text-xs h-7" onClick={handleOk}>
                    OK
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleReset}>
                    Reset
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={onClose}>
                    Cancel
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => alert("Help dialog here")}>
                    Help
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default DefineDatesModal;