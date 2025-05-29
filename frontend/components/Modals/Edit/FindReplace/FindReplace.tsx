"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { BaseModalProps } from "@/types/modalTypes";
import { X } from "lucide-react";

export enum FindReplaceMode {
    FIND = "find",
    REPLACE = "replace",
}

enum TabType {
    FIND = "find",
    REPLACE = "replace",
}

// Interface extending BaseModalProps for type safety with our modal system
interface FindAndReplaceModalProps extends BaseModalProps {
    columns?: string[];
    defaultTab?: FindReplaceMode;
}

const FindAndReplaceContent: React.FC<Omit<FindAndReplaceModalProps, 'onClose' | 'containerType'> & { onClose: () => void }> = ({
    onClose,
    columns = ["MINUTE_", "HOUR_", "DATE_", "NAME_"],
    defaultTab = FindReplaceMode.FIND,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>(
        defaultTab === FindReplaceMode.REPLACE ? TabType.REPLACE : TabType.FIND
    );
    const [selectedColumn, setSelectedColumn] = useState<string>(columns[0] || "");
    const [findText, setFindText] = useState<string>("");
    const [replaceText, setReplaceText] = useState<string>("");
    const [matchCase, setMatchCase] = useState<boolean>(false);
    const [showOptions, setShowOptions] = useState<boolean>(false);
    const [matchTo, setMatchTo] = useState<"contains" | "entire_cell" | "begins_with" | "ends_with">("contains");
    const [direction, setDirection] = useState<"up" | "down">("down");

    const handleFindNext = () => {
        console.log(
            `Find Next: column=${selectedColumn}, find=${findText}, matchCase=${matchCase}, matchTo=${matchTo}, direction=${direction}`
        );
    };

    const handleReplace = () => {
        console.log(
            `Replace: column=${selectedColumn}, find=${findText}, replace=${replaceText}, matchCase=${matchCase}, matchTo=${matchTo}, direction=${direction}`
        );
    };

    const handleReplaceAll = () => {
        console.log(
            `Replace All: column=${selectedColumn}, find=${findText}, replace=${replaceText}, matchCase=${matchCase}, matchTo=${matchTo}, direction=${direction}`
        );
    };

    return (
        <>
            <div className="p-6 overflow-y-auto flex-grow">
                <div role="tablist" className="flex border-b mb-6">
                    {([TabType.FIND, TabType.REPLACE] as const).map((tab) => (
                        <button
                            key={tab}
                            role="tab"
                            aria-selected={activeTab === tab}
                            className={`py-2 px-4 -mb-px border-b-2 focus:outline-none transition-colors duration-150 ease-in-out
                                ${activeTab === tab
                                    ? "border-primary text-primary font-semibold"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                                }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="column-select" className="text-xs font-medium text-muted-foreground">Column:</Label>
                        <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                            <SelectTrigger id="column-select" className="w-full mt-1 h-9">
                                <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                                {columns.map((col: string) => (
                                    <SelectItem key={col} value={col}>
                                        {col}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="find-input" className="text-xs font-medium text-muted-foreground">Find:</Label>
                        <Input
                            id="find-input"
                            type="text"
                            className="w-full mt-1 h-9"
                            value={findText}
                            onChange={(e) => setFindText(e.target.value)}
                        />
                    </div>

                    {activeTab === TabType.REPLACE && (
                        <div>
                            <Label htmlFor="replace-input" className="text-xs font-medium text-muted-foreground">Replace with:</Label>
                            <Input
                                id="replace-input"
                                type="text"
                                className="w-full mt-1 h-9"
                                value={replaceText}
                                onChange={(e) => setReplaceText(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox id="match-case" checked={matchCase} onCheckedChange={(checked) => setMatchCase(Boolean(checked))} />
                        <Label htmlFor="match-case" className="text-sm font-normal">Match case</Label>
                    </div>

                    <div className="pt-2">
                        <Button
                            variant="link"
                            onClick={() => setShowOptions((prev) => !prev)}
                            className="p-0 h-auto text-sm text-primary hover:text-primary/90"
                        >
                            {showOptions ? "Hide Options" : "Show Options"}
                        </Button>
                    </div>

                    {showOptions && (
                        <div className="border border-border p-4 rounded-md space-y-4 bg-background mt-2">
                            <div>
                                <Label className="text-xs font-medium text-muted-foreground">Match in:</Label>
                                <RadioGroup value={matchTo} onValueChange={(value) => setMatchTo(value as any)} className="mt-1 space-y-1">
                                    {[
                                        { value: "contains", label: "Any part of cell" },
                                        { value: "entire_cell", label: "Entire cell" },
                                        { value: "begins_with", label: "Beginning of cell" },
                                        { value: "ends_with", label: "End of cell" },
                                    ].map((option) => (
                                        <div key={option.value} className="flex items-center space-x-2">
                                            <RadioGroupItem value={option.value} id={`matchTo-${option.value}`} />
                                            <Label htmlFor={`matchTo-${option.value}`} className="text-sm font-normal">{option.label}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                            <Separator />
                            <div>
                                <Label className="text-xs font-medium text-muted-foreground">Direction:</Label>
                                <RadioGroup value={direction} onValueChange={(value) => setDirection(value as any)} className="mt-1 space-y-1">
                                    {[{ value: "down", label: "Down" }, { value: "up", label: "Up" }].map((dir) => (
                                        <div key={dir.value} className="flex items-center space-x-2">
                                            <RadioGroupItem value={dir.value} id={`direction-${dir.value}`} />
                                            <Label htmlFor={`direction-${dir.value}`} className="text-sm font-normal">{dir.label}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>Close</Button>
                <Button variant="outline" onClick={() => alert("Help for Find/Replace")}>Help</Button>
                {activeTab === TabType.REPLACE && (
                    <>
                        <Button onClick={handleReplaceAll}>Replace All</Button>
                        <Button onClick={handleReplace}>Replace</Button>
                    </>
                )}
                <Button onClick={handleFindNext}>Find Next</Button>
            </div>
        </>
    );
};

export const FindAndReplaceModal: React.FC<FindAndReplaceModalProps> = ({
    onClose,
    columns,
    defaultTab = FindReplaceMode.FIND,
    containerType = "dialog",
    ...props
}) => {
    if (containerType === "sidebar") {
        return (
            <div className="flex flex-col h-full bg-background text-foreground">
                <FindAndReplaceContent
                    onClose={onClose}
                    columns={columns}
                    defaultTab={defaultTab}
                    {...props}
                />
            </div>
        );
    }

    return (
        <FindAndReplaceContent
            onClose={onClose}
            columns={columns}
            defaultTab={defaultTab}
            {...props}
        />
    );
};

export const isFindReplaceModalType = (type: string): boolean => {
    return type === FindReplaceMode.FIND || type === FindReplaceMode.REPLACE;
};