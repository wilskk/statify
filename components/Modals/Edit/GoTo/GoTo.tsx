"use client";

import React, { useState, useEffect } from "react";
import {
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

export enum GoToMode {
    CASE = "case",
    VARIABLE = "variable",
}

interface GoToModalProps {
    onClose: () => void;
    defaultMode?: GoToMode;
    variables?: string[];
    totalCases?: number;
}

const GoToModal: React.FC<GoToModalProps> = ({
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

        if (value === "") {
            setCaseError("Case number is required");
        } else if (parseInt(value) < 1) {
            setCaseError("Case number must be at least 1");
        } else if (parseInt(value) > totalCases) {
            setCaseError(`Case number must not exceed ${totalCases}`);
        } else {
            setCaseError("");
        }
    };

    const handleGo = () => {
        if (activeTab === "case") {
            if (caseNumber === "" || parseInt(caseNumber) < 1 || parseInt(caseNumber) > totalCases) {
                setCaseError(`Please enter a valid case number (1-${totalCases})`);
                return;
            }
            console.log(`Go to case number: ${caseNumber}`);
            onClose();
        } else {
            if (!selectedVariable) {
                setVariableError("Please select a variable");
                return;
            }
            console.log(`Go to variable: ${selectedVariable}`);
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleGo();
        } else if (e.key === "Escape") {
            onClose();
        }
    };

    const sortedVariables = [...variables].sort();

    return (
        <DialogContent
            className="max-w-xs p-0 overflow-hidden"
            onKeyDown={handleKeyDown}
        >
            <DialogHeader className="px-4 pt-4 pb-2 border-b border-gray-200">
                <DialogTitle className="text-lg font-semibold">Go To</DialogTitle>
                <DialogDescription className="text-xs text-gray-600">
                    Navigate directly to a specific case or variable
                </DialogDescription>
            </DialogHeader>

            <div className="px-4 py-3">
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <TabsList className="grid grid-cols-2 mb-3 bg-gray-100 h-8">
                        <TabsTrigger
                            value="case"
                            className="data-[state=active]:bg-black data-[state=active]:text-white text-sm transition-all duration-200"
                        >
                            Case
                        </TabsTrigger>
                        <TabsTrigger
                            value="variable"
                            className="data-[state=active]:bg-black data-[state=active]:text-white text-sm transition-all duration-200"
                        >
                            Variable
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="case" className="mt-0 space-y-3">
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="case-number" className="text-sm font-medium">
                                    Go to case number:
                                </Label>
                                <span className="text-xs text-gray-500">
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
                                className={`h-8 text-sm bg-white border-gray-300 focus:border-black focus:ring-0 ${
                                    caseError ? "border-black border-l-4" : ""
                                }`}
                                aria-invalid={!!caseError}
                                aria-describedby={caseError ? "case-error" : undefined}
                            />
                            {caseError && (
                                <p id="case-error" className="text-xs text-black font-medium">
                                    {caseError}
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <Button
                                onClick={handleGo}
                                className="h-8 text-sm bg-black text-white hover:bg-gray-800 transition-all duration-150"
                            >
                                Go
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="variable" className="mt-0 space-y-3">
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="variable-select" className="text-sm font-medium">
                                    Go to variable:
                                </Label>
                                <span className="text-xs text-gray-500">
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
                                    className={`h-8 text-sm bg-white border-gray-300 focus:border-black focus:ring-0 ${
                                        variableError ? "border-black border-l-4" : ""
                                    }`}
                                    aria-invalid={!!variableError}
                                    aria-describedby={variableError ? "variable-error" : undefined}
                                >
                                    <SelectValue placeholder="Select a variable" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {sortedVariables.map((variable) => (
                                        <SelectItem key={variable} value={variable}>
                                            {variable}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {variableError && (
                                <p id="variable-error" className="text-xs text-black font-medium">
                                    {variableError}
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <Button
                                onClick={handleGo}
                                className="h-8 text-sm bg-black text-white hover:bg-gray-800 transition-all duration-150"
                            >
                                Go
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <DialogFooter className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-between gap-2">
                <Button
                    variant="outline"
                    onClick={() => alert("Help dialog here")}
                    className="h-8 text-xs border-gray-300 hover:bg-gray-100 hover:text-black"
                >
                    Help
                </Button>
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="h-8 text-xs border-gray-300 hover:bg-gray-100 hover:text-black"
                >
                    Cancel
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default GoToModal;