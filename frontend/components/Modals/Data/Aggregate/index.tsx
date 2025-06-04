"use client";

import React, { FC } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    // DialogFooter, // Not used directly if buttons are custom
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator"; // Not used
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { useModal } from "@/hooks/useModal";
import { AggregateDataProps } from "./types"; // AggregatedVariable is used by the hook
import { ErrorDialog } from "./dialogs/ErrorDialog";
import { FunctionDialog } from "./dialogs/FunctionDialog";
import { NameLabelDialog } from "./dialogs/NameLabelDialog";
import VariablesTab from "./VariablesTab";
import OptionsTab from "./OptionsTab";
// import SaveTab from "./SaveTab"; // Assuming SaveTab is not yet fully integrated based on commented out code
import { useAggregateData } from "./hooks/useAggregateData";

// Main content component that's agnostic of container type
const AggregateContent: FC<AggregateDataProps> = ({ onClose, containerType = "dialog" }) => {
    const { closeModal } = useModal();

    const {
        availableVariables,
        breakVariables,
        aggregatedVariables,
        activeTab, setActiveTab,
        highlightedVariable,
        errorMessage,
        errorDialogOpen, setErrorDialogOpen,
        functionDialogOpen, setFunctionDialogOpen,
        functionCategory, setFunctionCategory,
        selectedFunction, setSelectedFunction,
        percentageType, setPercentageType,
        percentageValue, setPercentageValue,
        percentageLow, setPercentageLow,
        percentageHigh, setPercentageHigh,
        nameDialogOpen, setNameDialogOpen,
        newVariableName, setNewVariableName,
        newVariableLabel, setNewVariableLabel,
        currentEditingVariable,
        // datasetName, // For SaveTab
        // setDatasetName, // For SaveTab
        // filePath, // For SaveTab
        // setFilePath, // For SaveTab
        // saveOption, // For SaveTab
        // setSaveOption, // For SaveTab
        isAlreadySorted, setIsAlreadySorted,
        sortBeforeAggregating, setSortBeforeAggregating,
        breakName, setBreakName,
        getDisplayName,
        handleVariableSelect,
        handleAggregatedVariableSelect,
        handleVariableDoubleClick,
        handleAggregatedDoubleClick,
        moveToBreak,
        moveFromBreak,
        moveToAggregated,
        moveFromAggregated,
        reorderBreakVariables,
        reorderAggregatedVariables,
        handleTopArrowClick,
        handleBottomArrowClick,
        handleFunctionClick,
        handleNameLabelClick,
        applyFunction,
        applyNameLabel,
        handleReset,
        handleConfirm,
    } = useAggregateData();

    return (
        <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-border flex-shrink-0">
                    <TabsList className="bg-muted rounded-none h-9 p-0">
                        <TabsTrigger
                            value="variables"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'variables' ? 'bg-background border-t border-l border-r border-border text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                        >
                            Variables
                        </TabsTrigger>
                        <TabsTrigger
                            value="options"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'options' ? 'bg-background border-t border-l border-r border-border text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                        >
                            Options
                        </TabsTrigger>
                        {/* <TabsTrigger
                            value="save"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'save' ? 'bg-background border-t border-l border-r border-border text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                        >
                            Save
                        </TabsTrigger> */}
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <VariablesTab
                        availableVariables={availableVariables}
                        breakVariables={breakVariables}
                        aggregatedVariables={aggregatedVariables}
                        highlightedVariable={highlightedVariable}
                        breakName={breakName}
                        setBreakName={setBreakName}
                        handleVariableSelect={handleVariableSelect}
                        handleVariableDoubleClick={handleVariableDoubleClick}
                        handleAggregatedVariableSelect={handleAggregatedVariableSelect}
                        handleAggregatedDoubleClick={handleAggregatedDoubleClick}
                        handleTopArrowClick={handleTopArrowClick}
                        handleBottomArrowClick={handleBottomArrowClick}
                        handleFunctionClick={handleFunctionClick}
                        handleNameLabelClick={handleNameLabelClick}
                        getDisplayName={getDisplayName}
                        moveToBreak={moveToBreak}
                        moveFromBreak={moveFromBreak}
                        moveToAggregated={moveToAggregated}
                        moveFromAggregated={moveFromAggregated}
                        reorderBreakVariables={reorderBreakVariables}
                        reorderAggregatedVariables={reorderAggregatedVariables}
                        containerType={containerType}
                    />
                </TabsContent>

                <TabsContent value="options" className="p-6 overflow-y-auto flex-grow">
                    <OptionsTab
                        isAlreadySorted={isAlreadySorted}
                        setIsAlreadySorted={setIsAlreadySorted}
                        sortBeforeAggregating={sortBeforeAggregating}
                        setSortBeforeAggregating={setSortBeforeAggregating}
                        containerType={containerType}
                    />
                </TabsContent>
                {/* <TabsContent value="save" className="p-6 overflow-y-auto flex-grow">
                    <SaveTab 
                        saveOption={saveOption} 
                        setSaveOption={setSaveOption} 
                        datasetName={datasetName} 
                        setDatasetName={setDatasetName} 
                        filePath={filePath} 
                        setFilePath={setFilePath} 
                    />
                </TabsContent> */}
            </Tabs>

            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 rounded-b-md">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4"
                        onClick={() => handleConfirm(closeModal)}
                    >
                        OK
                    </Button>
                    <Button
                        variant="outline"
                        className="border-border hover:bg-accent hover:text-accent-foreground h-8 px-4"
                        onClick={() => console.log("Paste clicked")} 
                    >
                        Paste
                    </Button>
                    <Button
                        variant="outline"
                        className="border-border hover:bg-accent hover:text-accent-foreground h-8 px-4"
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="border-border hover:bg-accent hover:text-accent-foreground h-8 px-4"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        className="border-border hover:bg-accent hover:text-accent-foreground h-8 px-4"
                        onClick={() => console.log("Help clicked")}
                    >
                        Help
                    </Button>
                </div>
            </div>

            <FunctionDialog
                open={functionDialogOpen}
                onOpenChange={setFunctionDialogOpen}
                currentEditingVariable={currentEditingVariable}
                functionCategory={functionCategory}
                setFunctionCategory={setFunctionCategory}
                selectedFunction={selectedFunction}
                setSelectedFunction={setSelectedFunction}
                percentageType={percentageType}
                setPercentageType={setPercentageType}
                percentageValue={percentageValue}
                setPercentageValue={setPercentageValue}
                percentageLow={percentageLow}
                setPercentageLow={setPercentageLow}
                percentageHigh={percentageHigh}
                setPercentageHigh={setPercentageHigh}
                onApply={applyFunction}
            />

            <NameLabelDialog
                open={nameDialogOpen}
                onOpenChange={setNameDialogOpen}
                currentEditingVariable={currentEditingVariable}
                newVariableName={newVariableName}
                setNewVariableName={setNewVariableName}
                newVariableLabel={newVariableLabel}
                setNewVariableLabel={setNewVariableLabel}
                onApply={applyNameLabel}
            />

            <ErrorDialog
                open={errorDialogOpen}
                onOpenChange={setErrorDialogOpen}
                errorMessage={errorMessage}
            />
        </>
    );
};

// Main component that handles different container types
const Aggregate: FC<AggregateDataProps> = ({ onClose, containerType = "dialog" }) => {
    // If sidebar mode, use a div container without header (header is provided by SidebarContainer)
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <AggregateContent onClose={onClose} containerType={containerType} />
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-[650px] p-0">
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold text-foreground">Aggregate Data</DialogTitle>
                </DialogHeader>

                <div className="flex-grow flex flex-col overflow-hidden">
                    <AggregateContent onClose={onClose} containerType={containerType} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default Aggregate;