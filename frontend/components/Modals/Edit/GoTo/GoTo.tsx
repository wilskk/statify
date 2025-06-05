"use client";

import React from "react";
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
import { X, HelpCircle, CheckCircle, AlertCircle } from "lucide-react";
import { GoToMode } from "./types";
import { useGoToForm } from "./hooks/useGoToForm";

interface GoToModalProps extends BaseModalProps {
    defaultMode?: GoToMode;
    initialMode?: GoToMode;
}

const GoToContent: React.FC<GoToModalProps & { onClose: () => void }> = ({
    onClose,
    defaultMode = GoToMode.CASE,
    initialMode,
}) => {
    const activeMode = initialMode || defaultMode;
    
    const {
        activeTab,
        setActiveTab,
        caseNumberInput,
        handleCaseNumberChange,
        caseError,
        variableNames,
        selectedVariableName,
        handleSelectedVariableChange,
        variableError,
        totalCases,
        handleGo,
        handleClose,
        lastNavigationSuccess
    } = useGoToForm({ 
        defaultMode: activeMode, 
        onClose 
    });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            const targetElement = e.target as HTMLElement;
            if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'SELECT' || targetElement.closest('[role="tabpanel"]')) {
                handleGo();
            }
        }
    };

    return (
        <>
            <div className="p-6 overflow-y-auto flex-grow">
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                >
                    <TabsList className="w-full mb-6">
                        <TabsTrigger value={GoToMode.CASE} className="w-1/2">
                            Case
                        </TabsTrigger>
                        <TabsTrigger value={GoToMode.VARIABLE} className="w-1/2">
                            Variable
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={GoToMode.CASE} className="mt-0 space-y-4" onKeyDown={handleKeyDown}>
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
                                value={caseNumberInput}
                                onChange={(e) => handleCaseNumberChange(e.target.value)}
                                className={`h-9 text-sm ${caseError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                aria-invalid={!!caseError}
                                aria-describedby={caseError ? "case-error-message" : undefined}
                            />
                            {caseError && (
                                <p id="case-error-message" className="text-xs text-destructive pt-1">
                                    {caseError}
                                </p>
                            )}
                            
                            {lastNavigationSuccess !== null && activeTab === GoToMode.CASE && (
                                <div className={`mt-2 p-2 text-xs rounded flex items-center ${lastNavigationSuccess ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                                    {lastNavigationSuccess ? (
                                        <>
                                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                            Successfully navigated to case {caseNumberInput}
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                                            Failed to navigate to case {caseNumberInput}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value={GoToMode.VARIABLE} className="mt-0 space-y-4" onKeyDown={handleKeyDown}>
                        <div className="space-y-1">
                            <div className="flex justify-between items-baseline">
                                <Label htmlFor="variable-select" className="text-xs font-medium text-muted-foreground">
                                    Go to variable:
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                    Total: {variableNames.length}
                                </span>
                            </div>
                            <Select
                                value={selectedVariableName}
                                onValueChange={handleSelectedVariableChange}
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
                                    {variableNames.map((variable: string) => (
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
                            
                            {lastNavigationSuccess !== null && activeTab === GoToMode.VARIABLE && (
                                <div className={`mt-2 p-2 text-xs rounded flex items-center ${lastNavigationSuccess ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                                    {lastNavigationSuccess ? (
                                        <>
                                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                            Successfully navigated to variable {selectedVariableName}
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                                            Failed to navigate to variable {selectedVariableName}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => alert("Help for Go To")}>
                    <HelpCircle size={18} className="mr-1" />
                </div>
                <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleClose}>Close</Button>
                    <Button onClick={handleGo} disabled={(activeTab === GoToMode.CASE && !!caseError) || (activeTab === GoToMode.VARIABLE && !!variableError && !selectedVariableName) || (activeTab === GoToMode.CASE && !caseNumberInput)}>Go</Button>
                </div>
            </div>
        </>
    );
};

const GoToModal: React.FC<GoToModalProps> = ({
    onClose,
    defaultMode = GoToMode.CASE,
    initialMode,
    containerType = "dialog",
    ...props
}) => {
    // Use initialMode if provided, otherwise fall back to defaultMode
    const activeMode = initialMode || defaultMode;
    
    if (containerType === "sidebar") {
        return (
            <div className="flex flex-col h-full bg-background text-foreground">
                <GoToContent
                    onClose={onClose}
                    defaultMode={activeMode}
                    initialMode={initialMode}
                    {...props}
                />
            </div>
        );
    }

    // When containerType is "dialog", ModalRenderer now provides the Dialog shell.
    // GoToModal should only render its specific content.
    return (
        <GoToContent
            onClose={onClose}
            defaultMode={activeMode}
            initialMode={initialMode}
            {...props}
        />
    );
};

export { GoToMode };
export default GoToModal;