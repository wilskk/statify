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
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

    const [findError, setFindError] = useState<string>("");
    const [replaceError, setReplaceError] = useState<string>("");

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

    const handleFindPrevious = () => {
        console.log(
            `Find Previous: column=${selectedColumn}, find=${findText}, matchCase=${matchCase}, matchTo=${matchTo}, direction=${direction}`
        );
    };

    const handleFindChange = (value: string) => {
        setFindText(value);
        // Simple validation: check if find text is empty
        setFindError(value.trim() === "" ? "Find text cannot be empty" : "");
    };

    const handleReplaceChange = (value: string) => {
        setReplaceText(value);
        // Simple validation: check if replace text is empty
        setReplaceError(value.trim() === "" ? "Replace text cannot be empty" : "");
    };

    return (
        <>
            <div className="p-6 overflow-y-auto flex-grow">
                <Tabs value={activeTab} onValueChange={val => setActiveTab(val as TabType)} className="mb-6">
                    <TabsList className="w-full">
                        <TabsTrigger value={TabType.FIND} className="w-1/2">
                            Find
                        </TabsTrigger>
                        <TabsTrigger value={TabType.REPLACE} className="w-1/2">
                            Replace
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

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

                    {activeTab === TabType.FIND && (
                        <div className="space-y-1">
                            <div className="flex justify-between items-baseline">
                                <Label htmlFor="find-input" className="text-xs font-medium text-muted-foreground">
                                    Find:
                                </Label>
                                {/* Bisa tambahkan info jumlah hasil jika ada */}
                            </div>
                            <Input
                                id="find-input"
                                type="text"
                                value={findText}
                                onChange={(e) => setFindText(e.target.value)}
                                className={`h-9 text-sm ${findError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                aria-invalid={!!findError}
                                aria-describedby={findError ? "find-error-message" : undefined}
                            />
                            {findError && (
                                <p id="find-error-message" className="text-xs text-destructive pt-1">
                                    {findError}
                                </p>
                            )}
                        </div>
                    )}

                    {activeTab === TabType.REPLACE && (
                        <div className="space-y-1">
                            <div className="flex justify-between items-baseline">
                                <Label htmlFor="replace-input" className="text-xs font-medium text-muted-foreground">
                                    Replace with:
                                </Label>
                            </div>
                            <Input
                                id="replace-input"
                                type="text"
                                value={replaceText}
                                onChange={(e) => setReplaceText(e.target.value)}
                                className={`h-9 text-sm ${replaceError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                aria-invalid={!!replaceError}
                                aria-describedby={replaceError ? "replace-error-message" : undefined}
                            />
                            {replaceError && (
                                <p id="replace-error-message" className="text-xs text-destructive pt-1">
                                    {replaceError}
                                </p>
                            )}
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

            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
                {activeTab === TabType.REPLACE && (
                    <>
                        <Button variant="destructive" onClick={handleReplaceAll}>
                            Replace All
                        </Button>
                        <Button variant="outline" onClick={handleReplace}>
                            Replace
                        </Button>
                    </>
                )}
                <div className="inline-flex rounded-md shadow-sm border border-input bg-background">
                    <button
                        type="button"
                        onClick={handleFindPrevious}
                        className="px-3 py-2 flex items-center justify-center rounded-l-md transition-colors
                            bg-primary text-primary-foreground hover:bg-primary/90"
                        tabIndex={0}
                        aria-label="Find Previous"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="w-px bg-border self-stretch" />
                    <button
                        type="button"
                        onClick={handleFindNext}
                        className="px-3 py-2 flex items-center justify-center rounded-r-md transition-colors
                            bg-primary text-primary-foreground hover:bg-primary/90"
                        tabIndex={0}
                        aria-label="Find Next"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
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