"use client";

import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, HelpCircle } from "lucide-react";
import { useExportCsv } from "./hooks/useExportCsv";
import { ExportCsvProps } from "./types";
import { useTourGuide } from "./hooks/useTourGuide";
import { TourPopup, ActiveElementHighlight } from "@/components/Common/TourComponents";
import { AnimatePresence } from "framer-motion";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

// Komponen utama ExportCsv
export const ExportCsv: FC<ExportCsvProps> = ({ 
    onClose,
    containerType = "dialog",
    ...hookOptions 
}) => {
    const {
        exportOptions,
        isExporting,
        handleChange,
        handleFilenameChange,
        handleExport,
    } = useExportCsv(hookOptions);

    // Add tour hook
    const { 
        tourActive, 
        currentStep, 
        tourSteps, 
        currentTargetElement,
        startTour, 
        nextStep, 
        prevStep, 
        endTour 
    } = useTourGuide(containerType);

    return (
        <div className="flex flex-col h-full" id="export-csv-modal">
            {/* Add tour popup */}
            <AnimatePresence>
                {tourActive && tourSteps.length > 0 && currentStep < tourSteps.length && (
                    <TourPopup
                        step={tourSteps[currentStep]}
                        currentStep={currentStep}
                        totalSteps={tourSteps.length}
                        onNext={nextStep}
                        onPrev={prevStep}
                        onClose={endTour}
                        targetElement={currentTargetElement}
                    />
                )}
            </AnimatePresence>

            <div className="p-6 space-y-5 flex-grow overflow-y-auto">
                {/* File Name */}
                <div className="space-y-1.5 relative">
                    <Label htmlFor="export-csv-filename">
                        File Name
                    </Label>
                    <Input
                        id="export-csv-filename"
                        value={exportOptions.filename}
                        onChange={(e) => handleFilenameChange(e.target.value)}
                        placeholder="Enter file name (e.g., dataset_export)"
                        disabled={isExporting}
                    />
                    {tourActive && currentTargetElement?.id === "export-csv-filename" && (
                        <ActiveElementHighlight active={true} />
                    )}
                </div>

                {/* Delimiter */}
                <div className="space-y-1.5 relative">
                    <Label htmlFor="export-csv-delimiter">
                        Delimiter
                    </Label>
                    <Select
                        value={exportOptions.delimiter}
                        onValueChange={(value) => handleChange("delimiter", value)}
                        disabled={isExporting}
                    >
                        <SelectTrigger id="export-csv-delimiter">
                            <SelectValue placeholder="Select delimiter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=",">Comma (,)</SelectItem>
                            <SelectItem value=";">Semicolon (;)</SelectItem>
                            <SelectItem value="|">Pipe (|)</SelectItem>
                            <SelectItem value="\t">Tab</SelectItem>
                        </SelectContent>
                    </Select>
                    {tourActive && currentTargetElement?.id === "export-csv-delimiter" && (
                        <ActiveElementHighlight active={true} />
                    )}
                </div>

                {/* Include Headers */}
                <div className="flex items-center space-x-2 relative">
                    <Checkbox
                        id="export-csv-includeHeaders"
                        checked={exportOptions.includeHeaders}
                        onCheckedChange={(checked) => handleChange("includeHeaders", !!checked)}
                        disabled={isExporting}
                    />
                    <Label 
                        htmlFor="export-csv-includeHeaders"
                    >
                        Include variable names as header row
                    </Label>
                    {tourActive && currentTargetElement?.id === "export-csv-includeHeaders" && (
                        <ActiveElementHighlight active={true} />
                    )}
                </div>

                {/* Include Variable Properties */}
                <div className="flex items-center space-x-2 relative">
                    <Checkbox
                        id="export-csv-includeVarProps"
                        checked={exportOptions.includeVariableProperties}
                        onCheckedChange={(checked) => handleChange("includeVariableProperties", !!checked)}
                        disabled={isExporting}
                    />
                    <Label 
                        htmlFor="export-csv-includeVarProps"
                    >
                        Include variable properties as first row
                    </Label>
                    {tourActive && currentTargetElement?.id === "export-csv-includeVarProps" && (
                        <ActiveElementHighlight active={true} />
                    )}
                </div>

                {/* Quote Strings */}
                <div className="flex items-center space-x-2 relative">
                    <Checkbox
                        id="export-csv-quoteStrings"
                        checked={exportOptions.quoteStrings}
                        onCheckedChange={(checked) => handleChange("quoteStrings", !!checked)}
                        disabled={isExporting}
                    />
                    <Label 
                        htmlFor="export-csv-quoteStrings"
                    >
                        Quote all string values
                    </Label>
                    {tourActive && currentTargetElement?.id === "export-csv-quoteStrings" && (
                        <ActiveElementHighlight active={true} />
                    )}
                </div>

                {/* Encoding */}
                <div className="space-y-1.5">
                    <Label htmlFor="export-csv-encoding">
                        Encoding
                    </Label>
                    <Select
                        value={exportOptions.encoding}
                        onValueChange={(value) => handleChange("encoding", value)}
                        disabled={isExporting}
                    >
                        <SelectTrigger id="export-csv-encoding">
                            <SelectValue placeholder="Select encoding" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="utf-8">UTF-8</SelectItem>
                            <SelectItem value="utf-16le">UTF-16 LE</SelectItem>
                            <SelectItem value="windows-1252">Windows-1252</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {/* Footer */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Left: Help/Tour button with tooltip */}
                <div className="flex items-center text-muted-foreground">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={startTour}
                                    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                                >
                                    <HelpCircle className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p className="text-xs">Start feature tour</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                {/* Right: Action buttons */}
                <div>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isExporting}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        id="export-csv-button"
                        onClick={handleExport}
                        disabled={isExporting || !exportOptions.filename.trim()}
                        className="relative"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            "Export"
                        )}
                        {tourActive && currentTargetElement?.id === "export-csv-button" && (
                            <ActiveElementHighlight active={true} />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ExportCsv; 