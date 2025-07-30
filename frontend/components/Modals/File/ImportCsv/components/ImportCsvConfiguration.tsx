"use client";

import React, { useState, FC, useMemo, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { InfoIcon, ChevronDownIcon, ArrowLeft, HelpCircle, Loader2, X, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "@/components/ui/tooltip";
import { useImportCsvProcessor } from "../hooks/useImportCsvProcessor";
import { 
    DelimiterOption, 
    DecimalOption, 
    TextQualifierOption, 
    SelectOption 
} from "../types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";

interface ImportCsvConfigurationProps {
    onClose: () => void;
    onBack: () => void;
    fileName: string;
    fileContent: string;
}

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

// Data langkah tour
const baseTourSteps: TourStep[] = [
    {
        title: "File Preview",
        content: "This area shows the first few lines of your file to help you choose the correct settings.",
        targetId: "csv-config-preview-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📄",
    },
    {
        title: "Variable Names",
        content: "Enable this if the first row of your data contains the names of the variables or columns.",
        targetId: "csv-config-header-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "🏷️",
    },
    {
        title: "Delimiter",
        content: "Select the character (e.g., comma or semicolon) that separates the data values in your file.",
        targetId: "csv-config-delimiter-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'right',
        icon: "🔣",
    },
    {
        title: "Import Data",
        content: "When you have configured all the options, click here to finalize the import process.",
        targetId: "csv-config-import-button-wrapper",
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
                        <div>{currentStep > 0 && <Button variant="outline" size="sm" onClick={onPrev} className="h-7 px-2 py-0"><ChevronLeft className="mr-1 h-3 w-3" /><span className="text-xs">Prev</span></Button>}</div>
                        <div>
                            {currentStep < totalSteps - 1 ? (
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

const ActiveElementHighlight: FC<{active: boolean}> = ({active}) => {
    if (!active) return null;
    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 rounded-md ring-2 ring-primary ring-offset-2 pointer-events-none" />;
};


// Custom Select Component
const CustomSelect: FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: SelectOption[]; isTouring?: boolean }> = ({ label, value, onChange, options, isTouring }) => (
    <div className="mb-4 relative">
        <Label htmlFor={`select-${label.toLowerCase().replace(/\s+/g, '-')}`} className={cn("block text-xs font-medium mb-1.5 text-muted-foreground", isTouring && "text-primary")}>{label}:</Label>
        <div className="relative">
            <select
                id={`select-${label.toLowerCase().replace(/\s+/g, '-')}`}
                value={value}
                onChange={onChange}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm rounded-md border border-input focus:border-ring focus:outline-none focus:ring-1 bg-background h-9"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDownIcon className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        <ActiveElementHighlight active={!!isTouring} />
    </div>
);

export const ImportCsvConfiguration: FC<ImportCsvConfigurationProps> = ({
    onClose,
    onBack,
    fileName,
    fileContent,
}) => {
    const [firstLineContains, setFirstLineContains] = useState<boolean>(true);
    const [removeLeading, setRemoveLeading] = useState<boolean>(false);
    const [removeTrailing, setRemoveTrailing] = useState<boolean>(false);
    const [delimiter, setDelimiter] = useState<DelimiterOption>("comma");
    const [decimal, setDecimal] = useState<DecimalOption>("period");
    const [textQualifier, setTextQualifier] = useState<TextQualifierOption>("doubleQuote");
    
    const { processCSV, isProcessing: hookIsProcessing } = useImportCsvProcessor();
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const { toast } = useToast();

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


    const previewContent = useMemo(() => {
        const lines = fileContent.split('\n').slice(0, 10);
        return lines.map((line, index) => (
            <div key={index} className={`flex text-xs ${index % 2 === 0 ? 'bg-muted/50' : 'bg-popover'}`}>
                <div className="w-8 flex-shrink-0 text-right pr-2 text-muted-foreground py-0.5 border-r border-border">{index + 1}</div>
                <div className="py-0.5 pl-2 whitespace-pre truncate text-popover-foreground">{line}</div>
            </div>
        ));
    }, [fileContent]);

    const handleOk = async () => {
        setSubmissionError(null);
        try {
            await processCSV({
                fileContent,
                options: { firstLineContains, removeLeading, removeTrailing, delimiter, decimal, textQualifier }
            });
            
            // Tampilkan toast sukses
            toast({
                title: "Import Berhasil",
                description: `File ${fileName} berhasil diimpor ke dalam sistem.`,
                variant: "default"
            });
            
            onClose();
        } catch (err: any) {
            const errorMessage = err?.message || "Failed to process CSV.";
            setSubmissionError(errorMessage);
            
            // Tampilkan toast error
            toast({
                title: "Import Gagal",
                description: errorMessage,
                variant: "destructive"
            });
        }
    };

    const handleReset = () => {
        setFirstLineContains(true);
        setRemoveLeading(false);
        setRemoveTrailing(false);
        setDelimiter("comma");
        setDecimal("period");
        setTextQualifier("doubleQuote");
        setSubmissionError(null);
    };

    return (
        <div className="flex flex-col h-full">
            <AnimatePresence>
                {tourActive && (
                    <TourPopup step={baseTourSteps[currentStep]} currentStep={currentStep} totalSteps={baseTourSteps.length} onNext={nextStep} onPrev={prevStep} onClose={endTour} targetElement={currentTargetElement} />
                )}
            </AnimatePresence>
            <div className="flex items-center justify-between px-6 py-3 border-b border-border flex-shrink-0">
                <div className="flex items-center flex-1 min-w-0">
                    <Button variant="ghost" size="sm" onClick={onBack} className="mr-2 -ml-2 h-8 w-8 p-0">
                        <ArrowLeft size={16} />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold truncate" title={`Configure Import: ${fileName}`}>Configure Import: {fileName}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Adjust settings for how the CSV data should be read.</p>
                    </div>
                </div>
                 <div className="w-8"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 p-6 flex-grow overflow-y-auto">
                <div className="space-y-4">
                    <div id="csv-config-preview-wrapper" className="relative">
                        <Label className={cn("block text-xs font-medium mb-1.5 text-muted-foreground", tourActive && currentStep === 0 && "text-primary")}>Preview (first 10 lines)</Label>
                        <div className="border border-border rounded-md overflow-hidden bg-background">
                            <div className="overflow-x-auto max-h-[180px] min-h-[90px] text-xs">
                                {previewContent.length > 0 ? previewContent : <p className="p-4 text-muted-foreground italic">No content to preview.</p>}
                            </div>
                        </div>
                        <ActiveElementHighlight active={tourActive && currentStep === 0} />
                    </div>

                    <div className="space-y-3 pt-2">
                        <div id="csv-config-header-wrapper" className="flex items-center space-x-2 relative">
                            <Checkbox id="firstLineContains" checked={firstLineContains} onCheckedChange={(checked) => setFirstLineContains(Boolean(checked))} />
                            <Label htmlFor="firstLineContains" className={cn("text-sm font-normal cursor-pointer", tourActive && currentStep === 1 && "text-primary")}>First line contains variable names</Label>
                            <ActiveElementHighlight active={tourActive && currentStep === 1} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="removeLeadingSpaces" checked={removeLeading} onCheckedChange={(checked) => setRemoveLeading(Boolean(checked))} />
                            <Label htmlFor="removeLeadingSpaces" className="text-sm font-normal cursor-pointer">Remove leading spaces</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="removeTrailingSpaces" checked={removeTrailing} onCheckedChange={(checked) => setRemoveTrailing(Boolean(checked))} />
                            <Label htmlFor="removeTrailingSpaces" className="text-sm font-normal cursor-pointer">Remove trailing spaces</Label>
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <div id="csv-config-delimiter-wrapper">
                        <CustomSelect label="Delimiter" value={delimiter} onChange={(e) => setDelimiter(e.target.value as DelimiterOption)} options={[{ value: "comma", label: "Comma (,)" }, { value: "semicolon", label: "Semicolon (;)" }, { value: "tab", label: "Tab (\t)" }]} isTouring={tourActive && currentStep === 2} />
                    </div>
                    <div id="csv-config-decimal-wrapper">
                         <CustomSelect label="Decimal Symbol for Numerics" value={decimal} onChange={(e) => setDecimal(e.target.value as DecimalOption)} options={[{ value: "period", label: "Period (.)" }, { value: "comma", label: "Comma (,)" }]} />
                    </div>
                    <div id="csv-config-qualifier-wrapper"> 
                        <div className="flex items-center mb-1.5">
                            <Label htmlFor="textQualifierSelect" className="block text-xs font-medium text-muted-foreground">Text Qualifier:</Label>
                            <TooltipProvider delayDuration={100}><Tooltip><TooltipTrigger asChild><InfoIcon size={13} className="ml-1.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent className="max-w-xs"><p>Character used to enclose string values.</p></TooltipContent></Tooltip></TooltipProvider>
                        </div>
                        <div className="relative">
                            <select id="textQualifierSelect" value={textQualifier} onChange={(e) => setTextQualifier(e.target.value as TextQualifierOption)} className="w-full appearance-none px-3 py-2 pr-8 text-sm rounded-md border border-input focus:border-ring focus:outline-none focus:ring-1 bg-background h-9">
                                <option value="doubleQuote">Double Quote (&quot;)</option>
                                <option value="singleQuote">Single Quote (&apos;)</option>
                                <option value="none">None</option>
                            </select>
                            <ChevronDownIcon className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                    {submissionError && <div className="text-sm text-destructive pt-3">{submissionError}</div>}
                </div>
            </div>

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
                    <Button variant="outline" onClick={onBack} disabled={hookIsProcessing} className="mr-2">Back</Button>
                    <Button variant="outline" onClick={handleReset} disabled={hookIsProcessing} className="mr-2">Reset</Button>
                    <div id="csv-config-import-button-wrapper" className="relative inline-block">
                        <Button onClick={handleOk} disabled={hookIsProcessing || !!submissionError} {...(hookIsProcessing ? { loading: true } : {})} className={cn(tourActive && currentStep === 3 && "focus:ring-primary")}>
                            {hookIsProcessing && <Loader2 className="mr-2 animate-spin" size={16} />}
                            Import
                        </Button>
                        <ActiveElementHighlight active={tourActive && currentStep === 3} />
                    </div>
                </div>
            </div>
        </div>
    );
};