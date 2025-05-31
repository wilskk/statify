"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BaseModalProps } from "@/types/modalTypes";
import { X } from "lucide-react";

export enum GoToMode {
    CASE = "case",
    VARIABLE = "variable",
}

interface GoToModalProps extends BaseModalProps {
    defaultMode?: GoToMode;
    variables?: string[];
    totalCases?: number;
}

const GoToContent: React.FC<Omit<GoToModalProps, 'onClose' | 'containerType'> & { onClose: () => void }> = ({
    onClose,
    defaultMode = GoToMode.CASE,
    variables = ["DATE_", "HOUR_", "MINUTE_", "NAME_", "ID_"],
    totalCases = 1000,
}) => {
    const [activeTab, setActiveTab] = useState<string>(
        defaultMode === GoToMode.VARIABLE ? "variable" : "case"
    );
    const [caseNumber, setCaseNumber] = useState<string>("1");
    const [caseError, setCaseError] = useState<string>("");
    const [selectedVariable, setSelectedVariable] = useState<string>("");
    const [variableError, setVariableError] = useState<string>("");

    useEffect(() => {
        setCaseError("");
        setVariableError("");
        if (activeTab === "case") {
            setCaseNumber("1");
        } else if (activeTab === "variable" && variables.length > 0 && !selectedVariable) {
            setSelectedVariable(variables[0]);
        }
    }, [activeTab, variables, selectedVariable]);

    const handleCaseNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCaseNumber(value);

        if (value === "" || !/^[1-9][0-9]*$/.test(value)) {
            setCaseError("Case number must be a positive integer.");
        } else if (parseInt(value) > totalCases) {
            setCaseError(`Case number must not exceed ${totalCases}.`);
        } else {
            setCaseError("");
        }
    };

    const handleGo = () => {
        if (activeTab === "case") {
            if (caseNumber === "" || !/^[1-9][0-9]*$/.test(caseNumber) || parseInt(caseNumber) > totalCases) {
                setCaseError(`Please enter a valid case number (1-${totalCases}).`);
                return;
            }
            console.log(`Go to case number: ${caseNumber}`);
        } else {
            if (!selectedVariable) {
                setVariableError("Please select a variable.");
                return;
            }
            console.log(`Go to variable: ${selectedVariable}`);
        }
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            const targetElement = e.target as HTMLElement;
            if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'SELECT' || targetElement.closest('[role="tabpanel"]')) {
                handleGo();
            }
        }
    };

    const sortedVariables = [...variables].sort();

    return (
        <>
            <div className="p-6 overflow-y-auto flex-grow">
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <TabsList className="grid grid-cols-2 mb-4 bg-muted h-9">
                        <TabsTrigger
                            value="case"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm transition-colors duration-150"
                        >
                            Case
                        </TabsTrigger>
                        <TabsTrigger
                            value="variable"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm transition-colors duration-150"
                        >
                            Variable
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="case" className="mt-0 space-y-4" onKeyDown={handleKeyDown}>
                        <div className="space-y-1">
                            <div className="flex justify-between items-baseline">
                                <Label htmlFor="case-number" className="text-xs font-medium text-muted-foreground">
                                    Go to case number:
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                    Total: {totalCases}
                                </span>
                            </div>
                            <Input
                                id="case-number"
                                type="number"
                                min="1"
                                max={totalCases}
                                value={caseNumber}
                                onChange={handleCaseNumberChange}
                                className={`h-9 text-sm ${caseError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                aria-invalid={!!caseError}
                                aria-describedby={caseError ? "case-error-message" : undefined}
                            />
                            {caseError && (
                                <p id="case-error-message" className="text-xs text-destructive pt-1">
                                    {caseError}
                                </p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="variable" className="mt-0 space-y-4" onKeyDown={handleKeyDown}>
                        <div className="space-y-1">
                            <div className="flex justify-between items-baseline">
                                <Label htmlFor="variable-select" className="text-xs font-medium text-muted-foreground">
                                    Go to variable:
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                    {sortedVariables.length} variables
                                </span>
                            </div>
                            <Select
                                value={selectedVariable}
                                onValueChange={(value) => {
                                    setSelectedVariable(value);
                                    setVariableError("");
                                }}
                            >
                                <SelectTrigger
                                    id="variable-select"
                                    className={`h-9 text-sm w-full ${variableError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                    aria-invalid={!!variableError}
                                    aria-describedby={variableError ? "variable-error-message" : undefined}
                                >
                                    <SelectValue placeholder="Select a variable" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {sortedVariables.map((variable: string) => (
                                        <SelectItem key={variable} value={variable}>
                                            {variable}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {variableError && (
                                <p id="variable-error-message" className="text-xs text-destructive pt-1">
                                    {variableError}
                                </p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => alert("Help for Go To")}>Help</Button>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleGo} disabled={(activeTab === 'case' && !!caseError) || (activeTab === 'variable' && !!variableError && !selectedVariable) || (activeTab === 'case' && !caseNumber)}>Go</Button>
            </div>
        </>
    );
};

const GoToModal: React.FC<GoToModalProps> = ({
    onClose,
    defaultMode = GoToMode.CASE,
    variables,
    totalCases,
    containerType = "dialog",
    ...props
}) => {
    if (containerType === "sidebar") {
        return (
            <div className="flex flex-col h-full bg-background text-foreground">
                <GoToContent
                    onClose={onClose}
                    defaultMode={defaultMode}
                    variables={variables}
                    totalCases={totalCases}
                />
            </div>
        );
    }

    // When containerType is "dialog", ModalRenderer now provides the Dialog shell.
    // GoToModal should only render its specific content.
    return (
        <GoToContent
            onClose={onClose}
            defaultMode={defaultMode}
            variables={variables}
            totalCases={totalCases}
        />
    );
};

export default GoToModal;