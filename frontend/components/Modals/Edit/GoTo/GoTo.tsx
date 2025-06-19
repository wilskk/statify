"use client";

import React, { useState, FC, useEffect, useMemo, useCallback, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { X, HelpCircle, CheckCircle, AlertCircle, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { GoToMode } from "./types";
import { useGoToForm } from "./hooks/useGoToForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface GoToModalProps extends BaseModalProps {
    defaultMode?: GoToMode;
    initialMode?: GoToMode;
}

// Tour Related Components & Types
type PopupPosition = 'top' | 'bottom' | 'right';
type HorizontalPosition = 'left' | 'right' | 'center';

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

const TourPopupPortal: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
    if (!mounted || typeof window === "undefined") return null;
    return createPortal(children, document.body);
};

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
            
            if (position === 'right') {
                left = rect.right + popupBuffer;
                top = rect.top + (rect.height / 2) - (popupHeight / 2);
            } else {
                top = position === 'top' ? (rect.top - popupHeight - popupBuffer) : (rect.bottom + popupBuffer);
                if (position === 'top' && top < 20) { top = rect.bottom + popupBuffer; step.position = 'bottom'; }

                const elementWidth = rect.width;
                left = rect.left + (elementWidth / 2) - (popupWidth / 2);
                if (horizontalPosition === 'right') left = rect.right - popupWidth;
                else if(horizontalPosition === 'left') left = rect.left;

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
        if (position === 'top') return <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 ${arrowClasses} border-b border-r ${borderClasses}`} />;
        if (position === 'bottom') return <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 ${arrowClasses} border-t border-l ${borderClasses}`} />;
        if (position === 'right') return <div className={`absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 ${arrowClasses} border-t border-l ${borderClasses}`} />;
        return null;
    };

    return (
        <TourPopupPortal>
            <motion.div
                initial={{ opacity: 0, y: position !== 'right' ? (position === 'top' ? 10 : -10) : 0, x: position === 'right' ? -10 : 0 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ position: 'fixed', top: `${popupPosition.top}px`, left: `${popupPosition.left}px`, width: '280px', zIndex: 99999, pointerEvents: 'auto' }}
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


const GoToContent: React.FC<GoToModalProps & { onClose: () => void }> = ({
    onClose,
    defaultMode = GoToMode.CASE,
    initialMode,
}) => {
    const activeMode = initialMode || defaultMode;
    
    const {
        activeTab, setActiveTab, caseNumberInput, handleCaseNumberChange, caseError,
        variableNames, selectedVariableName, handleSelectedVariableChange, variableError,
        totalCases, handleGo, handleClose, lastNavigationSuccess
    } = useGoToForm({ defaultMode: activeMode, onClose });

    const [tourActive, setTourActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});

    const tourSteps = useMemo(() => {
        const commonPrefix = [
            { title: "Select Mode", content: "First, choose whether you want to navigate to a specific Case (row) or a Variable (column).", targetId: "goto-tabs-wrapper", defaultPosition: 'bottom' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "🎯" },
        ];
        const caseSteps = [
            { title: "Case Number", content: "Enter the case number (i.e., row number) you want to jump to in the data grid.", targetId: "goto-case-input-wrapper", defaultPosition: 'bottom' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "🔢" },
        ];
        const variableSteps = [
            { title: "Select Variable", content: "Select the variable (i.e., column) you want to jump to from this list.", targetId: "goto-variable-select-wrapper", defaultPosition: 'bottom' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "📊" },
        ];
        const commonSuffix = [
            { title: "Navigate", content: "Click 'Go' to instantly move to your selected case or variable in the table.", targetId: "goto-go-button-wrapper", defaultPosition: 'top' as PopupPosition, defaultHorizontalPosition: 'right' as HorizontalPosition, icon: "🚀" },
        ];
        
        return activeTab === GoToMode.CASE 
            ? [...commonPrefix, ...caseSteps, ...commonSuffix]
            : [...commonPrefix, ...variableSteps, ...commonSuffix];
    }, [activeTab]);

    const startTour = useCallback(() => { setCurrentStep(0); setTourActive(true); }, []);
    const nextStep = useCallback(() => { if (currentStep < tourSteps.length - 1) setCurrentStep(prev => prev + 1); }, [currentStep, tourSteps.length]);
    const prevStep = useCallback(() => { if (currentStep > 0) setCurrentStep(prev => prev - 1); }, [currentStep]);
    const endTour = useCallback(() => { setTourActive(false); }, []);

    useEffect(() => {
        if (!tourActive) return;
        const elements: Record<string, HTMLElement | null> = {};
        tourSteps.forEach(step => { elements[step.targetId] = document.getElementById(step.targetId); });
        setTargetElements(elements);
    }, [tourActive, tourSteps]);

    const currentTargetElement = useMemo(() => tourActive ? targetElements[tourSteps[currentStep].targetId] || null : null, [tourActive, currentStep, targetElements, tourSteps]);

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
            <AnimatePresence>
                {tourActive && (
                    <TourPopup step={tourSteps[currentStep]} currentStep={currentStep} totalSteps={tourSteps.length} onNext={nextStep} onPrev={prevStep} onClose={endTour} targetElement={currentTargetElement} />
                )}
            </AnimatePresence>
            <div className="p-6 overflow-y-auto flex-grow">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div id="goto-tabs-wrapper" className="relative">
                        <TabsList className="w-full mb-6">
                            <TabsTrigger value={GoToMode.CASE} className="w-1/2">Case</TabsTrigger>
                            <TabsTrigger value={GoToMode.VARIABLE} className="w-1/2">Variable</TabsTrigger>
                        </TabsList>
                        <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'goto-tabs-wrapper'} />
                    </div>

                    <TabsContent value={GoToMode.CASE} className="mt-0 space-y-4" onKeyDown={handleKeyDown}>
                        <div id="goto-case-input-wrapper" className="space-y-1 relative">
                            <div className="flex justify-between items-baseline">
                                <Label htmlFor="case-number" className="text-xs font-medium text-muted-foreground">Go to case number:</Label>
                                <span className="text-xs text-muted-foreground">Total: {totalCases}</span>
                            </div>
                            <Input id="case-number" type="number" min="1" max={totalCases} value={caseNumberInput} onChange={(e) => handleCaseNumberChange(e.target.value)} className={cn("h-9 text-sm", caseError && "border-destructive focus-visible:ring-destructive")} aria-invalid={!!caseError} aria-describedby={caseError ? "case-error-message" : undefined} />
                            {caseError && <p id="case-error-message" className="text-xs text-destructive pt-1">{caseError}</p>}
                            {lastNavigationSuccess !== null && activeTab === GoToMode.CASE && (
                                <div className={cn("mt-2 p-2 text-xs rounded flex items-center", lastNavigationSuccess ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                                    {lastNavigationSuccess ? <><CheckCircle className="w-3.5 h-3.5 mr-1.5" />Successfully navigated to case {caseNumberInput}</> : <><AlertCircle className="w-3.5 h-3.5 mr-1.5" />Failed to navigate to case {caseNumberInput}</>}
                                </div>
                            )}
                            <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'goto-case-input-wrapper'} />
                        </div>
                    </TabsContent>

                    <TabsContent value={GoToMode.VARIABLE} className="mt-0 space-y-4" onKeyDown={handleKeyDown}>
                        <div id="goto-variable-select-wrapper" className="space-y-1 relative">
                            <div className="flex justify-between items-baseline">
                                <Label htmlFor="variable-select" className="text-xs font-medium text-muted-foreground">Go to variable:</Label>
                                <span className="text-xs text-muted-foreground">Total: {variableNames.length}</span>
                            </div>
                            <Select value={selectedVariableName} onValueChange={handleSelectedVariableChange}>
                                <SelectTrigger id="variable-select" className={cn("h-9 text-sm w-full", variableError && "border-destructive focus-visible:ring-destructive")} aria-invalid={!!variableError} aria-describedby={variableError ? "variable-error-message" : undefined}>
                                    <SelectValue placeholder="Select a variable" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {variableNames.map((variable: string) => <SelectItem key={variable} value={variable}>{variable}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {variableError && <p id="variable-error-message" className="text-xs text-destructive pt-1">{variableError}</p>}
                            {lastNavigationSuccess !== null && activeTab === GoToMode.VARIABLE && (
                                <div className={cn("mt-2 p-2 text-xs rounded flex items-center", lastNavigationSuccess ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                                    {lastNavigationSuccess ? <><CheckCircle className="w-3.5 h-3.5 mr-1.5" />Successfully navigated to variable {selectedVariableName}</> : <><AlertCircle className="w-3.5 h-3.5 mr-1.5" />Failed to navigate to variable {selectedVariableName}</>}
                                </div>
                            )}
                            <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'goto-variable-select-wrapper'} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={startTour} className="rounded-full w-8 h-8">
                                <HelpCircle size={18} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Start feature tour</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleClose}>Close</Button>
                    <div id="goto-go-button-wrapper" className="relative inline-block">
                        <Button onClick={handleGo} disabled={(activeTab === GoToMode.CASE && !!caseError) || (activeTab === GoToMode.VARIABLE && !!variableError && !selectedVariableName) || (activeTab === GoToMode.CASE && !caseNumberInput)}>Go</Button>
                        <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'goto-go-button-wrapper'} />
                    </div>
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
    const activeMode = initialMode || defaultMode;
    
    if (containerType === "sidebar") {
        return (
            <div className="flex flex-col h-full bg-background text-foreground">
                <GoToContent onClose={onClose} defaultMode={activeMode} initialMode={initialMode} {...props} />
            </div>
        );
    }

    return (
        <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="p-0 gap-0 flex flex-col max-w-sm h-auto max-h-[calc(100vh-2rem)]">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center justify-between">
                        Go To
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </DialogTitle>
                </DialogHeader>
                <GoToContent
                    onClose={onClose}
                    defaultMode={activeMode}
                    initialMode={initialMode}
                    {...props}
                />
            </DialogContent>
        </Dialog>
    );
};

export { GoToMode };
export default GoToModal;