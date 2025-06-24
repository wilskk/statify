"use client";

import React, { useState, FC, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, RefreshCw, HelpCircle, Clipboard, Table, X, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { ImportClipboardConfigurationStepProps, ClipboardProcessingOptions } from "../types";
import { HotTable } from "@handsontable/react-wrapper";
import "handsontable/dist/handsontable.full.min.css";
import { registerAllModules } from 'handsontable/registry';
import { useImportClipboardProcessor } from "../hooks/useImportClipboardProcessor";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

// Register Handsontable modules
registerAllModules();

// Define the specific types for Handsontable settings
type StretchH = 'all' | 'none' | 'last';

const PREVIEW_ROW_LIMIT = 100;
const PREVIEW_COL_LIMIT = 25;

// Tipe data untuk tour
type PopupPosition = 'top' | 'bottom';
type HorizontalPosition = 'left' | 'right';

type TourStep = {
    title: string;
    content: string;
    targetId: string;
    defaultPosition: PopupPosition;
    defaultHorizontalPosition: HorizontalPosition;
    position?: PopupPosition;
    horizontalPosition?: HorizontalPosition | null;
    icon: string;
};

// Data langkah tour untuk Configuration Step
const baseTourSteps: TourStep[] = [
    {
        title: "Delimiter",
        content: "Select the character that separates values in your data (e.g., comma, tab).",
        targetId: "config-step-delimiter-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "🔣",
    },
    {
        title: "Text Qualifier",
        content: "Select the character used to enclose text values, especially those containing delimiters.",
        targetId: "config-step-qualifier-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "🔠",
    },
    {
        title: "Header Row",
        content: "Enable if the first row of your data contains variable names.",
        targetId: "config-step-header-row-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "🏷️",
    },
    {
        title: "Data Preview",
        content: "This table shows a preview of how your data will be imported with the current settings.",
        targetId: "config-step-preview-wrapper",
        defaultPosition: 'top',
        defaultHorizontalPosition: 'left',
        icon: "📊",
    },
    {
        title: "Import Data",
        content: "When you're satisfied with the preview, click here to finalize the import.",
        targetId: "config-step-import-button-wrapper",
        defaultPosition: 'top',
        defaultHorizontalPosition: 'right',
        icon: "✅",
    }
];

// Portal wrapper
const TourPopupPortal: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
    if (!mounted || typeof window === "undefined") return null;
    return createPortal(children, document.body);
};

// Komponen Tour Popup
const TourPopup: FC<{
    step: TourStep;
    currentStep: number;
    totalSteps: number;
    onNext: () => void;
    onPrev: () => void;
    onClose: () => void;
    targetElement: HTMLElement | null;
}> = ({ step, currentStep, totalSteps, onNext, onPrev, onClose, targetElement }) => {
    const position = step.position || step.defaultPosition;
    const horizontalPosition = step.horizontalPosition;
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const popupRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (!targetElement) return;
        const updatePosition = () => {
            const rect = targetElement.getBoundingClientRect();
            const popupHeight = popupRef.current?.offsetHeight || 170;
            const popupWidth = 280;
            const popupBuffer = 20;
            let top: number, left: number;
            
            if (horizontalPosition === 'left') {
                left = Math.max(10, rect.left - 300);
                top = rect.top + (rect.height / 2) - 100;
            } else {
                if (position === 'top') {
                    top = rect.top - (popupHeight + popupBuffer);
                    if (top < 20) { top = rect.bottom + popupBuffer; step.position = 'bottom'; }
                } else {
                    top = rect.bottom + popupBuffer;
                }
                const elementWidth = rect.width;
                left = rect.left + (elementWidth / 2) - (popupWidth / 2);
                if (elementWidth < 100) {
                    const rightSpace = window.innerWidth - rect.right;
                    const leftSpace = rect.left;
                    if (rightSpace >= popupWidth + popupBuffer) left = rect.right + popupBuffer;
                    else if (leftSpace >= popupWidth + popupBuffer) left = rect.left - (popupWidth + popupBuffer);
                }
                if (horizontalPosition === 'right') left = rect.right - popupWidth;
                if (left < 10) left = 10;
                if (left + popupWidth > window.innerWidth - 10) left = window.innerWidth - (popupWidth + 10);
            }
            setPopupPosition({ top, left });
        };
        updatePosition();
        const timer = setTimeout(updatePosition, 100);
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => { clearTimeout(timer); window.removeEventListener('scroll', updatePosition, true); window.removeEventListener('resize', updatePosition); };
    }, [targetElement, position, horizontalPosition, step]);

    const getArrowStyles = () => {
        const arrowClasses = "w-3 h-3 bg-white dark:bg-gray-800";
        const borderClasses = "border-primary/10 dark:border-primary/20";
        if (horizontalPosition !== 'left') {
            if (position === 'top') return <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 ${arrowClasses} border-b border-r ${borderClasses}`} />;
            if (position === 'bottom') return <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 ${arrowClasses} border-t border-l ${borderClasses}`} />;
        } else if (horizontalPosition === 'left') {
            return <div className={`absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 rotate-45 ${arrowClasses} border-t border-r ${borderClasses}`} />;
        }
        return null;
    };

    return (
        <TourPopupPortal>
            <motion.div
                initial={{ opacity: 0, y: position === 'top' ? 10 : -10, x: horizontalPosition === 'left' ? -10 : 0 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ position: 'fixed', top: `${popupPosition.top}px`, left: `${popupPosition.left}px`, width: '280px', zIndex: 99999, pointerEvents: 'auto' }}
                className="popup-tour-fixed"
            >
                <Card ref={popupRef} className="shadow-lg border-primary/10 dark:border-primary/20 rounded-lg relative backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
                    {getArrowStyles()}
                    <CardHeader className="p-3 pb-2 border-b border-primary/10 dark:border-primary/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {step.icon && <span className="text-lg">{step.icon}</span>}
                                <CardTitle className="text-base font-medium">{step.title}</CardTitle>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded-full hover:bg-primary/10"><X className="h-3 w-3" /></Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Step {currentStep + 1} of {totalSteps}</div>
                    </CardHeader>
                    <CardContent className="p-3 text-sm">
                        <div className="flex space-x-2">
                            <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <p>{step.content}</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between p-3 pt-2 border-t border-primary/10 dark:border-primary/20">
                        <div>{currentStep !== 0 && <Button variant="outline" size="sm" onClick={onPrev} className="h-7 px-2 py-0"><ChevronLeft className="mr-1 h-3 w-3" /><span className="text-xs">Prev</span></Button>}</div>
                        <div>
                            {currentStep + 1 !== totalSteps ? (
                                <Button size="sm" onClick={onNext} className="h-7 px-2 py-0"><span className="text-xs">Next</span><ChevronRight className="ml-1 h-3 w-3" /></Button>
                            ) : (
                                <Button size="sm" onClick={onClose} className="h-7 px-2 py-0 bg-green-600 hover:bg-green-700"><span className="text-xs">Finish</span></Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </TourPopupPortal>
    );
};

// Komponen highlight
const ActiveElementHighlight: FC<{active: boolean}> = ({active}) => {
    if (!active) return null;
    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 rounded-md ring-2 ring-primary ring-offset-2 pointer-events-none" />;
};


export const ImportClipboardConfigurationStep: FC<ImportClipboardConfigurationStepProps> = ({
    onClose,
    onBack,
    pastedText,
    parsedData,
}) => {
    const hotTableRef = useRef<any>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
    const [previewData, setPreviewData] = useState<string[][]>(parsedData);
    const [textQualifierOption, setTextQualifierOption] = useState<string>('"');
    const [originalRowCount, setOriginalRowCount] = useState(0);
    const [originalColCount, setOriginalColCount] = useState(0);

    const [options, setOptions] = useState<ClipboardProcessingOptions>({
        delimiter: "tab",
        firstRowAsHeader: false,
        trimWhitespace: true,
        skipEmptyRows: true,
        detectDataTypes: true,
    });

    const [customDelimiter, setCustomDelimiter] = useState<string>("");
    const [hotSettings, setHotSettings] = useState({
        stretchH: 'all' as StretchH, 
        autoWrapRow: true,
        autoWrapCol: false,
        manualColumnResize: true,
        manualRowResize: true,
    });

    const { excelStyleTextToColumns, processClipboardData } = useImportClipboardProcessor();

     // Tour state and logic
    const [tourActive, setTourActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});

    const startTour = useCallback(() => { setCurrentStep(0); setTourActive(true); }, []);
    const nextStep = useCallback(() => { if (currentStep < baseTourSteps.length - 1) setCurrentStep(prev => prev + 1); }, [currentStep]);
    const prevStep = useCallback(() => { if (currentStep > 0) setCurrentStep(prev => prev - 1); }, [currentStep]);
    const endTour = useCallback(() => { setTourActive(false); }, []);
    
    useEffect(() => {
        if (!tourActive) return;
        const elements: Record<string, HTMLElement | null> = {};
        baseTourSteps.forEach(step => {
            elements[step.targetId] = document.getElementById(step.targetId);
        });
        setTargetElements(elements);
    }, [tourActive]);

    const currentTargetElement = useMemo(() => {
        if (!tourActive) return null;
        return targetElements[baseTourSteps[currentStep].targetId] || null;
    }, [tourActive, currentStep, targetElements]);

    const getDelimiterCharacter = useCallback((): string => {
        switch (options.delimiter) {
            case "tab": return "\t";
            case "comma": return ",";
            case "semicolon": return ";";
            case "space": return " ";
            case "custom": return customDelimiter || "\t";
            default: return "\t";
        }
    }, [options.delimiter, customDelimiter]);

    useEffect(() => {
        const updatePreview = async () => {
            if (!pastedText) {
                setPreviewData([]);
                return;
            }
            setIsPreviewLoading(true);
            setError(null);
            try {
                let result;
                const currentDelimiter = getDelimiterCharacter();
                result = excelStyleTextToColumns(pastedText, {
                    delimiterType: 'delimited',
                    delimiter: currentDelimiter,
                    textQualifier: textQualifierOption === "NO_QUALIFIER" ? "" : textQualifierOption,
                    treatConsecutiveDelimitersAsOne: options.skipEmptyRows,
                    trimWhitespace: options.trimWhitespace,
                    detectDataTypes: options.detectDataTypes,
                    hasHeaderRow: options.firstRowAsHeader
                });
                setPreviewData(result);
            } catch (err: any) {
                setError(err?.message || "Failed to update preview");
                setPreviewData([]);
            } finally {
                setIsPreviewLoading(false);
            }
        };
        
        if (pastedText) {
            updatePreview();
        }

    }, [options, customDelimiter, pastedText, excelStyleTextToColumns, textQualifierOption, getDelimiterCharacter]);

    const { dataForTable, columnHeaders, columnsSetting } = useMemo(() => {
        if (!previewData || previewData.length === 0) {
            setOriginalRowCount(0);
            setOriginalColCount(0);
            return { dataForTable: [], columnHeaders: [], columnsSetting: [] };
        }

        let fullHeaders: string[];
        let fullData: string[][];

        if (options.firstRowAsHeader) {
            if (previewData.length > 1) {
                fullHeaders = previewData[0];
                fullData = previewData.slice(1);
            } else { 
                fullHeaders = previewData[0].map((_, i) => `Column ${i + 1}`);
                fullData = previewData; 
            }
        } else {
            fullHeaders = previewData.length > 0 && previewData[0] ? previewData[0].map((_, i) => `Column ${i + 1}`) : [];
            fullData = previewData;
        }
        
        setOriginalRowCount(fullData.length);
        setOriginalColCount(fullHeaders.length);

        const slicedHeaders = fullHeaders.slice(0, PREVIEW_COL_LIMIT);
        const slicedData = fullData.slice(0, PREVIEW_ROW_LIMIT).map(row => row.slice(0, PREVIEW_COL_LIMIT));
        const slicedColumnsSetting = slicedHeaders.map((_, index) => ({ data: index }));

        return { dataForTable: slicedData, columnHeaders: slicedHeaders, columnsSetting: slicedColumnsSetting };
    }, [previewData, options.firstRowAsHeader]);

    const handleOptionChange = (key: keyof ClipboardProcessingOptions, value: any) => {
        setOptions((prevOptions: ClipboardProcessingOptions) => ({ ...prevOptions, [key]: value }));
    };

    const handleImport = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        setError(null);
        try {
            const dataToProcess = excelStyleTextToColumns(pastedText, {
                delimiterType: 'delimited',
                delimiter: getDelimiterCharacter(),
                textQualifier: textQualifierOption === "NO_QUALIFIER" ? "" : textQualifierOption,
                treatConsecutiveDelimitersAsOne: options.skipEmptyRows,
                trimWhitespace: options.trimWhitespace,
                detectDataTypes: options.detectDataTypes,
                hasHeaderRow: options.firstRowAsHeader
            });
            await processClipboardData(pastedText, {
                ...options,
                customDelimiter: options.delimiter === "custom" ? customDelimiter : undefined,
                excelProcessedData: dataToProcess
            });
            onClose();
        } catch (err: any) {
            setError(err?.message || "Failed to import data");
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleStretchH = () => {
        if (hotTableRef.current?.hotInstance) {
            const newStretchH: StretchH = hotSettings.stretchH === 'all' ? 'none' : 'all';
            hotTableRef.current.hotInstance.updateSettings({ stretchH: newStretchH });
            setHotSettings(prev => ({ ...prev, stretchH: newStretchH }));
        }
    };

    const isPreviewTruncated = originalRowCount > PREVIEW_ROW_LIMIT || originalColCount > PREVIEW_COL_LIMIT;

    return (
        <div className="flex flex-col h-full">
            <AnimatePresence>
                {tourActive && (
                    <TourPopup
                        step={baseTourSteps[currentStep]}
                        currentStep={currentStep}
                        totalSteps={baseTourSteps.length}
                        onNext={nextStep}
                        onPrev={prevStep}
                        onClose={endTour}
                        targetElement={currentTargetElement}
                    />
                )}
            </AnimatePresence>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                <div className="flex items-center flex-1 min-w-0">
                    <Button variant="ghost" size="icon" onClick={onBack} className="mr-3 -ml-2 h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={18} />
                    </Button>
                    <Clipboard size={20} className="mr-2.5 text-primary flex-shrink-0 relative top-[-1px]" />
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold truncate text-popover-foreground">
                            Configure Clipboard Import
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            Configure how the pasted data should be processed
                        </p>
                    </div>
                </div>
                <div className="w-8"></div>
            </div>

            {/* Main Content Area */}
            <div className="p-6 flex-grow flex flex-col gap-6">
                {/* Options Panel */}
                <div className="w-full space-y-4 overflow-y-auto pr-2 pb-4">
                    <div className="space-y-3 relative" id="config-step-delimiter-wrapper">
                        <Label className={cn("text-xs font-medium text-muted-foreground", tourActive && currentStep === 0 && "text-primary")}>Delimiter</Label>
                        <div className="relative">
                            <Select
                                value={options.delimiter}
                                onValueChange={(value) => handleOptionChange("delimiter", value)}
                                disabled={isProcessing}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select delimiter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tab">Tab</SelectItem>
                                    <SelectItem value="comma">Comma (,)</SelectItem>
                                    <SelectItem value="semicolon">Semicolon (;)</SelectItem>
                                    <SelectItem value="space">Space</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                            <ActiveElementHighlight active={tourActive && currentStep === 0} />
                        </div>

                        {options.delimiter === "custom" && (
                            <div className="pt-2">
                                <Label htmlFor="custom-delimiter" className="text-xs font-medium text-muted-foreground">
                                    Custom Delimiter
                                </Label>
                                <Input
                                    id="custom-delimiter"
                                    value={customDelimiter}
                                    onChange={(e) => setCustomDelimiter(e.target.value)}
                                    placeholder="Enter custom delimiter"
                                    className="mt-1"
                                    disabled={isProcessing}
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 pt-2 relative" id="config-step-qualifier-wrapper">
                        <Label className={cn("text-xs font-medium text-muted-foreground", tourActive && currentStep === 1 && "text-primary")}>Text Qualifier</Label>
                         <div className="relative">
                            <Select
                                value={textQualifierOption}
                                onValueChange={setTextQualifierOption}
                                disabled={isProcessing}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select text qualifier" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='"'>Double Quote (&quot;)</SelectItem>
                                    <SelectItem value="'">Single Quote (&apos;)</SelectItem>
                                    <SelectItem value="NO_QUALIFIER">None</SelectItem>
                                </SelectContent>
                            </Select>
                            <ActiveElementHighlight active={tourActive && currentStep === 1} />
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <Label className="text-xs font-medium text-muted-foreground">Options</Label>

                        <div id="config-step-header-row-wrapper" className="flex items-center space-x-2 relative">
                            <Checkbox
                                id="firstRowAsHeader"
                                checked={options.firstRowAsHeader}
                                onCheckedChange={(checked) => handleOptionChange("firstRowAsHeader", Boolean(checked))}
                                disabled={isProcessing}
                            />
                            <Label htmlFor="firstRowAsHeader" className={cn("text-sm font-normal cursor-pointer flex items-center", tourActive && currentStep === 2 && "text-primary")}>
                                First row as headers
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent>Use the first row as variable names</TooltipContent></Tooltip></TooltipProvider>
                            </Label>
                            <ActiveElementHighlight active={tourActive && currentStep === 2} />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox id="trimWhitespace" checked={options.trimWhitespace} onCheckedChange={(checked) => handleOptionChange("trimWhitespace", Boolean(checked))} disabled={isProcessing} />
                            <Label htmlFor="trimWhitespace" className="text-sm font-normal cursor-pointer flex items-center">Trim whitespace<TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent>Remove leading and trailing whitespace</TooltipContent></Tooltip></TooltipProvider></Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="skipEmptyRows" checked={options.skipEmptyRows} onCheckedChange={(checked) => handleOptionChange("skipEmptyRows", Boolean(checked))} disabled={isProcessing} />
                            <Label htmlFor="skipEmptyRows" className="text-sm font-normal cursor-pointer flex items-center">Skip empty rows<TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent>Ignore rows with no data</TooltipContent></Tooltip></TooltipProvider></Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="detectDataTypes" checked={options.detectDataTypes} onCheckedChange={(checked) => handleOptionChange("detectDataTypes", Boolean(checked))} disabled={isProcessing} />
                            <Label htmlFor="detectDataTypes" className="text-sm font-normal cursor-pointer flex items-center">Detect data types<TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent>Automatically detect numeric values</TooltipContent></Tooltip></TooltipProvider></Label>
                        </div>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => { setOptions({ delimiter: "tab", firstRowAsHeader: true, trimWhitespace: true, skipEmptyRows: true, detectDataTypes: true }); setTextQualifierOption('"'); }} disabled={isProcessing || isPreviewLoading} className="w-full mt-3">Reset Options</Button>
                </div>

                {/* Data Preview Panel */}
                <div id="config-step-preview-wrapper" className="w-full flex flex-col overflow-hidden relative">
                    <div className="flex justify-between items-center mb-1.5">
                        <Label className={cn("text-xs font-medium text-muted-foreground", tourActive && currentStep === 3 && "text-primary")}>Data Preview</Label>
                        <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={toggleStretchH}><Table size={14} className="mr-1" />{hotSettings.stretchH === 'all' ? 'Auto-width' : 'Fixed-width'}</Button>
                        </div>
                    </div>
                    <div className="border border-border rounded-md overflow-auto flex-grow bg-background hot-container relative min-h-[200px]">
                        {isPreviewLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center h-full text-muted-foreground bg-background/80 z-10"><RefreshCw size={18} className="animate-spin mr-2" /> Loading preview...</div>
                        ) : previewData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center"><span>No data to preview. Try adjusting options.</span></div>
                        ) : (
                            <HotTable key={options.firstRowAsHeader ? 'headers-on' : 'headers-off'} ref={hotTableRef} data={dataForTable} colHeaders={columnHeaders} columns={columnsSetting} rowHeaders={true} width="100%" height="100%" licenseKey="non-commercial-and-evaluation" readOnly={true} manualColumnResize={true} manualRowResize={true} stretchH={hotSettings.stretchH} autoWrapRow={hotSettings.autoWrapRow} autoWrapCol={hotSettings.autoWrapCol} className={'excel-parser'} afterGetColHeader={(col, TH) => { if (options.firstRowAsHeader) { TH.classList.add('header-row'); } else { TH.classList.remove('header-row'); }}} />
                        )}
                    </div>
                    {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
                    <div className="text-xs text-muted-foreground mt-1.5">
                        {dataForTable.length > 0 && (
                            <span>
                                {isPreviewTruncated ? `Showing first ${dataForTable.length} of ${originalRowCount} rows × ${columnHeaders.length} of ${originalColCount} columns` : `${originalRowCount} rows × ${originalColCount} columns`}
                            </span>
                        )}
                    </div>
                     <ActiveElementHighlight active={tourActive && currentStep === 3} />
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div className="flex items-center text-muted-foreground">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={startTour} className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"><HelpCircle className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent side="top"><p className="text-xs">Start feature tour</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div>
                    <Button variant="outline" onClick={onBack} disabled={isProcessing} className="mr-2">Back</Button>
                    <div id="config-step-import-button-wrapper" className="relative inline-block">
                        <Button onClick={handleImport} disabled={isProcessing || isPreviewLoading || previewData.length === 0} className={cn(tourActive && currentStep === 4 && "focus:ring-primary")}>
                            {isProcessing && <RefreshCw size={16} className="animate-spin mr-1.5" />}
                            {isProcessing ? "Importing..." : "Import"}
                        </Button>
                        <ActiveElementHighlight active={tourActive && currentStep === 4} />
                    </div>
                </div>
            </div>
        </div>
    );
}; 