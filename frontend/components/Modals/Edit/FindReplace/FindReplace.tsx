"use client";

import React from "react";
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
import { X, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FindReplaceMode, TabType, FindAndReplaceModalProps } from "./types";
import { useFindReplaceForm } from "./hooks/useFindReplaceForm";

const FindAndReplaceContent: React.FC<Omit<FindAndReplaceModalProps, 'containerType' | 'columns'> & { onClose: () => void }> = ({
    onClose,
    defaultTab,
}) => {
    const {
        activeTab,
        setActiveTab,
        columnNames,
        selectedColumnName,
        setSelectedColumnName,
        findText,
        handleFindChange,
        replaceText,
        handleReplaceChange,
        matchCase,
        setMatchCase,
        showOptions,
        setShowOptions,
        matchTo,
        setMatchTo,
        direction,
        setDirection,
        findError,
        replaceError,
        handleFindNext,
        handleFindPrevious,
        handleReplace,
        handleReplaceAll,
        searchResultsCount,
        currentResultNumber,
    } = useFindReplaceForm({ defaultTab });

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
                        <Select value={selectedColumnName} onValueChange={setSelectedColumnName}>
                            <SelectTrigger id="column-select" className="w-full mt-1 h-9">
                                <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                                {columnNames && columnNames.map((colName: string) => (
                                    <SelectItem key={colName} value={colName}>
                                        {colName}
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
                                {(findText && searchResultsCount > 0) && (
                                    <span className="text-xs text-muted-foreground">
                                        {currentResultNumber} of {searchResultsCount}
                                    </span>
                                )}
                                {(findText && searchResultsCount === 0 && !findError) && (
                                    <span className="text-xs text-muted-foreground">
                                        No results
                                    </span>
                                )}
                            </div>
                            <Input
                                id="find-input"
                                type="text"
                                value={findText}
                                onChange={(e) => handleFindChange(e.target.value)}
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
                                <Label htmlFor="find-input-replace" className="text-xs font-medium text-muted-foreground">
                                    Find:
                                </Label>
                                {(findText && searchResultsCount > 0) && (
                                    <span className="text-xs text-muted-foreground">
                                        {currentResultNumber} of {searchResultsCount}
                                    </span>
                                )}
                                {(findText && searchResultsCount === 0 && !findError) && (
                                    <span className="text-xs text-muted-foreground">
                                        No results
                                    </span>
                                )}
                            </div>
                            <Input
                                id="find-input-replace"
                                type="text"
                                value={findText}
                                onChange={(e) => handleFindChange(e.target.value)}
                                className={`h-9 text-sm mb-2 ${findError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                aria-invalid={!!findError}
                                aria-describedby={findError ? "find-error-message-replace" : undefined}
                            />
                            {findError && (
                                <p id="find-error-message-replace" className="text-xs text-destructive pt-1 mb-2">
                                    {findError}
                                </p>
                            )}
                            <div className="flex justify-between items-baseline">
                                <Label htmlFor="replace-input" className="text-xs font-medium text-muted-foreground">
                                    Replace with:
                                </Label>
                            </div>
                            <Input
                                id="replace-input"
                                type="text"
                                value={replaceText}
                                onChange={(e) => handleReplaceChange(e.target.value)}
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
                </div>
            </div>

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => alert("Help for Find & Replace")}>
                    <HelpCircle size={18} className="mr-1" />
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    {activeTab === TabType.REPLACE && (
                        <>
                            <Button variant="destructive" onClick={handleReplaceAll} disabled={!findText || findError !== ""}>
                                Replace All
                            </Button>
                            <Button variant="outline" onClick={handleReplace} disabled={!findText || findError !== ""}>
                                Replace
                            </Button>
                        </>
                    )}
                    <div className="inline-flex rounded-md shadow-sm border border-input bg-background">
                        <button
                            type="button"
                            onClick={handleFindPrevious}
                            className="px-3 py-2 flex items-center justify-center rounded-l-md transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90"
                            tabIndex={0}
                            aria-label="Find Previous"
                            disabled={!findText || findError !== ""}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="w-px bg-border self-stretch" />
                        <button
                            type="button"
                            onClick={handleFindNext}
                            className="px-3 py-2 flex items-center justify-center rounded-r-md transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90"
                            tabIndex={0}
                            aria-label="Find Next"
                            disabled={!findText || findError !== ""}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export const FindAndReplaceModal: React.FC<FindAndReplaceModalProps> = ({
    onClose,
    defaultTab = FindReplaceMode.FIND,
    initialTab,
    containerType = "dialog",
    ...props
}) => {
    // Use initialTab if provided, otherwise fall back to defaultTab
    const activeTab = initialTab || defaultTab;
    const contentProps = { defaultTab: activeTab, ...props };

    if (containerType === "sidebar") {
        return (
            <div className="flex flex-col h-full bg-background text-foreground">
                <FindAndReplaceContent
                    onClose={onClose}
                    {...contentProps}
                />
            </div>
        );
    }

    return (
        <Dialog open={props.isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="p-0 gap-0 flex flex-col max-w-md h-auto max-h-[calc(100vh-2rem)]">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center justify-between">
                        Find and Replace
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </DialogTitle>
                </DialogHeader>
                <FindAndReplaceContent
                    onClose={onClose}
                    {...contentProps}
                />
            </DialogContent>
        </Dialog>
    );
};

export const isFindReplaceModalType = (type: string): boolean => {
    return type === FindReplaceMode.FIND || type === FindReplaceMode.REPLACE;
};