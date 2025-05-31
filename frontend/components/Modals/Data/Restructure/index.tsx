"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

enum RestructureMethod {
    VariablesToCases = "variables_to_cases",
    CasesToVariables = "cases_to_variables",
    TransposeAllData = "transpose_all_data",
}

interface RestructureDataWizardProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

// Content component separated from container logic
const RestructureDataWizardContent: React.FC<RestructureDataWizardProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    // State to manage wizard steps
    const [currentStep, setCurrentStep] = useState<number>(1);

    // State to store the selected restructure method
    const [method, setMethod] = useState<RestructureMethod>(
        RestructureMethod.VariablesToCases
    );

    // Event handler for Next button
    const handleNext = () => {
        // Here you can validate or save choices before moving to the next step
        setCurrentStep((prev) => prev + 1);
    };

    // Event handler for Back button
    const handleBack = () => {
        setCurrentStep((prev) => prev - 1);
    };

    // Event handler for Cancel button
    const handleCancel = () => {
        // Close wizard without saving changes
        onClose();
    };

    // Example of step 2 view (optional)
    const Step2 = () => (
        <div>
            <p>This is an example of Step 2. Here you can add advanced form/options.</p>
        </div>
    );

    return (
        <>
            {currentStep === 1 && (
                <>
                    {containerType === "dialog" && (
                        <DialogHeader>
                            <DialogTitle>Welcome to the Restructure Data Wizard!</DialogTitle>
                        </DialogHeader>
                    )}
                    <div className="mb-4 space-y-2 text-foreground">
                        <p>
                            This wizard helps you restructure your data from multiple variables
                            (columns) in a single case to groups of related cases (rows) or vice
                            versa, or choose to transpose your data. The wizard replaces the current
                            data with the restructured data. Note that data restructuring cannot be undone.
                        </p>
                        <p className="font-semibold text-foreground">What do you want to do?</p>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer text-foreground">
                                <input
                                    type="radio"
                                    name="restructureMethod"
                                    className="accent-primary"
                                    checked={method === RestructureMethod.VariablesToCases}
                                    onChange={() => setMethod(RestructureMethod.VariablesToCases)}
                                />
                                Restructure selected variables into cases
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-foreground">
                                <input
                                    type="radio"
                                    name="restructureMethod"
                                    className="accent-primary"
                                    checked={method === RestructureMethod.CasesToVariables}
                                    onChange={() => setMethod(RestructureMethod.CasesToVariables)}
                                />
                                Restructure selected cases into variables
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-foreground">
                                <input
                                    type="radio"
                                    name="restructureMethod"
                                    className="accent-primary"
                                    checked={method === RestructureMethod.TransposeAllData}
                                    onChange={() => setMethod(RestructureMethod.TransposeAllData)}
                                />
                                Transpose all data
                            </label>
                        </div>
                    </div>
                    <div className={containerType === "dialog" ? "" : "border-t border-border bg-muted pt-4"}>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" disabled className="h-8 px-4">
                                Back
                            </Button>
                            <Button variant="outline" onClick={handleNext} className="h-8 px-4">
                                Next
                            </Button>
                            <Button variant="outline" onClick={handleCancel} className="h-8 px-4">
                                Cancel
                            </Button>
                            <Button variant="outline" onClick={() => alert("Help dialog here")} className="h-8 px-4">
                                Help
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {currentStep === 2 && (
                <>
                    {containerType === "dialog" && (
                        <DialogHeader>
                            <DialogTitle>Restructure Data - Step 2</DialogTitle>
                        </DialogHeader>
                    )}
                    <Step2 />
                    <div className={containerType === "dialog" ? "" : "border-t border-border bg-muted pt-4"}>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={handleBack} className="h-8 px-4">
                                Back
                            </Button>
                            <Button variant="outline" onClick={() => alert("Next step")} className="h-8 px-4">
                                Next
                            </Button>
                            <Button variant="outline" onClick={handleCancel} className="h-8 px-4">
                                Cancel
                            </Button>
                            <Button variant="outline" onClick={() => alert("Help dialog here")} className="h-8 px-4">
                                Help
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* Add more steps if needed */}
        </>
    );
};

// Main component that handles different container types
const RestructureDataWizard: React.FC<RestructureDataWizardProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    // If sidebar mode, use a div container
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground p-6">
                <div className="flex-grow flex flex-col overflow-auto">
                    {/* Title for sidebar version */}
                    <h2 className="text-lg font-semibold mb-4">Restructure Data Wizard</h2>
                    <RestructureDataWizardContent onClose={onClose} containerType={containerType} />
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-xl">
                <RestructureDataWizardContent onClose={onClose} containerType={containerType} />
            </DialogContent>
        </Dialog>
    );
};

export default RestructureDataWizard;
