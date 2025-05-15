"use client";

import React, { FC, useState, useCallback, useEffect } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useVariableSelection } from "./hooks/useVariableSelection";
import { useStatisticsSettings } from "./hooks/useStatisticsSettings";
import { useDescriptivesAnalysis } from "./hooks/useDescriptivesAnalysis";
import { useDataFetching } from "./hooks/useDataFetching";

import VariablesTab from "./VariablesTab";
import StatisticsTab from "./StatisticsTab";

interface DescriptivesProps {
    onClose: () => void;
}

const Descriptives: FC<DescriptivesProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<"variables" | "statistics">("variables");
    
    const {
        availableVariables,
        selectedVariables,
        highlightedVariable,
        setHighlightedVariable,
        moveToSelectedVariables,
        moveToAvailableVariables,
        reorderVariables,
        resetVariableSelection
    } = useVariableSelection();

    const {
        displayStatistics,
        setDisplayStatistics,
        displayOrder,
        setDisplayOrder,
        saveStandardized,
        setSaveStandardized,
        resetStatisticsSettings
    } = useStatisticsSettings();

    const { 
        isLoading,
        errorMsg, 
        runAnalysis,
        cancelAnalysis
    } = useDescriptivesAnalysis({
        selectedVariables,
        displayStatistics,
        saveStandardized,
        displayOrder,
        onClose
    });

    const handleReset = useCallback(() => {
        resetVariableSelection();
        resetStatisticsSettings();
        cancelAnalysis();
    }, [resetVariableSelection, resetStatisticsSettings, cancelAnalysis]);

    const handleTabChange = useCallback((value: string) => {
        if (value === 'variables' || value === 'statistics') {
            setActiveTab(value);
        }
    }, [setActiveTab]);

    useEffect(() => {
        return () => {
            cancelAnalysis();
        };
    }, [cancelAnalysis]);

    return (
        <DialogContent className="max-w-[600px] p-0 bg-popover text-popover-foreground border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Descriptives</DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-border flex-shrink-0">
                    <TabsList>
                        <TabsTrigger value="variables">Variables</TabsTrigger>
                        <TabsTrigger value="statistics">Statistics</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <VariablesTab
                        availableVariables={availableVariables}
                        selectedVariables={selectedVariables}
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        moveToSelectedVariables={moveToSelectedVariables}
                        moveToAvailableVariables={moveToAvailableVariables}
                        reorderVariables={reorderVariables}
                        saveStandardized={saveStandardized}
                        setSaveStandardized={setSaveStandardized}
                    />
                </TabsContent>

                <TabsContent value="statistics" className="p-6 overflow-y-auto flex-grow">
                    <StatisticsTab
                        displayStatistics={displayStatistics}
                        setDisplayStatistics={setDisplayStatistics}
                        displayOrder={displayOrder}
                        setDisplayOrder={setDisplayOrder}
                    />
                </TabsContent>
            </Tabs>

            {errorMsg && <div className="px-6 py-2 text-destructive">{errorMsg}</div>}

            <DialogFooter className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 rounded-b-md">
                <div className="flex justify-end space-x-3">
                    <Button
                        onClick={runAnalysis}
                        disabled={isLoading}
                    >
                        {isLoading ? "Processing..." : "OK"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={isLoading}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        // onClick={onHelp} // Assuming an onHelp function exists or will be added
                        disabled={isLoading}
                    >
                        Help
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
}

export default Descriptives;