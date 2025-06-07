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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { X, ChevronLeft, ChevronRight, HelpCircle, Info } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FindReplaceMode, TabType, FindAndReplaceModalProps } from "./types";
import { useFindReplaceForm } from "./hooks/useFindReplaceForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";


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
            } else { // top or bottom
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


const FindAndReplaceContent: React.FC<Omit<FindAndReplaceModalProps, 'containerType' | 'columns'> & { onClose: () => void }> = ({
    onClose,
    defaultTab,
}) => {
    const {
        activeTab, setActiveTab, columnNames, selectedColumnName, setSelectedColumnName,
        findText, handleFindChange, replaceText, handleReplaceChange, matchCase, setMatchCase,
        matchTo, setMatchTo, direction, setDirection, findError, replaceError,
        handleFindNext, handleFindPrevious, handleReplace, handleReplaceAll,
        searchResultsCount, currentResultNumber,
    } = useFindReplaceForm({ defaultTab });

    const [tourActive, setTourActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});

    const tourSteps = useMemo(() => {
        const commonPrefix = [
            { title: "Select Column", content: "First, choose the column you want to search within from this dropdown.", targetId: "fr-column-wrapper", defaultPosition: 'bottom' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "🎯" },
            { title: "Text to Find", content: "Next, type the text you want to find here. Results will appear as you type.", targetId: "fr-find-input-wrapper", defaultPosition: 'bottom' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "🔍" }
        ];
        const replaceStep = { title: "Replacement Text", content: "Enter the text that will replace the found text.", targetId: "fr-replace-input-wrapper", defaultPosition: 'bottom' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "✍️" };
        const commonSuffix = [
            { title: "Match Case", content: "Check this box to make your search case-sensitive (e.g., 'A' will not match 'a').", targetId: "fr-match-case-wrapper", defaultPosition: 'right' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "🔠" },
            { title: "Matching Logic", content: "Define how the search should match text within a cell (e.g., anywhere, entire cell, etc.).", targetId: "fr-match-in-wrapper", defaultPosition: 'right' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "🧩" },
            { title: "Search Direction", content: "Set the direction for the 'Find Next'/'Previous' buttons to search up or down from the current selection.", targetId: "fr-direction-wrapper", defaultPosition: 'right' as PopupPosition, defaultHorizontalPosition: 'left' as HorizontalPosition, icon: "↕️" },
            { title: "Navigation", content: "Use these buttons to jump between the matches found in the selected column.", targetId: "fr-navigation-wrapper", defaultPosition: 'top' as PopupPosition, defaultHorizontalPosition: 'right' as HorizontalPosition, icon: "🧭" }
        ];
        const replaceActionsStep = { title: "Replace Actions", content: "Click 'Replace' to change the current highlighted match, or 'Replace All' for every match in the column.", targetId: "fr-replace-actions-wrapper", defaultPosition: 'top' as PopupPosition, defaultHorizontalPosition: 'right' as HorizontalPosition, icon: "✨" };

        return activeTab === TabType.REPLACE ? [...commonPrefix, replaceStep, ...commonSuffix, replaceActionsStep] : [...commonPrefix, ...commonSuffix];
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

    return (
        <>
            <AnimatePresence>
                {tourActive && (
                    <TourPopup step={tourSteps[currentStep]} currentStep={currentStep} totalSteps={tourSteps.length} onNext={nextStep} onPrev={prevStep} onClose={endTour} targetElement={currentTargetElement} />
                )}
            </AnimatePresence>
            <div className="p-6 overflow-y-auto flex-grow">
                <Tabs value={activeTab} onValueChange={val => setActiveTab(val as TabType)} className="mb-6">
                    <TabsList className="w-full">
                        <TabsTrigger value={TabType.FIND} className="w-1/2">Find</TabsTrigger>
                        <TabsTrigger value={TabType.REPLACE} className="w-1/2">Replace</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="space-y-4">
                    <div id="fr-column-wrapper" className="relative">
                        <Label htmlFor="column-select" className="text-xs font-medium text-muted-foreground">Column:</Label>
                        <Select value={selectedColumnName} onValueChange={setSelectedColumnName}>
                            <SelectTrigger id="column-select" className="w-full mt-1 h-9"><SelectValue placeholder="Select column" /></SelectTrigger>
                            <SelectContent>
                                {columnNames?.map((colName: string) => <SelectItem key={colName} value={colName}>{colName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'fr-column-wrapper'} />
                    </div>

                    <div id="fr-find-input-wrapper" className="space-y-1 relative">
                        <div className="flex justify-between items-baseline">
                            <Label htmlFor="find-input" className="text-xs font-medium text-muted-foreground">Find:</Label>
                            {findText && searchResultsCount > 0 && <span className="text-xs text-muted-foreground">{currentResultNumber} of {searchResultsCount}</span>}
                            {findText && searchResultsCount === 0 && !findError && <span className="text-xs text-muted-foreground">No results</span>}
                        </div>
                        <Input id="find-input" type="text" value={findText} onChange={(e) => handleFindChange(e.target.value)} className={cn("h-9 text-sm", findError && "border-destructive focus-visible:ring-destructive")} aria-invalid={!!findError} aria-describedby={findError ? "find-error-message" : undefined} />
                        {findError && <p id="find-error-message" className="text-xs text-destructive pt-1">{findError}</p>}
                        <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'fr-find-input-wrapper'} />
                    </div>

                    {activeTab === TabType.REPLACE && (
                        <div id="fr-replace-input-wrapper" className="space-y-1 relative">
                            <Label htmlFor="replace-input" className="text-xs font-medium text-muted-foreground">Replace with:</Label>
                            <Input id="replace-input" type="text" value={replaceText} onChange={(e) => handleReplaceChange(e.target.value)} className={cn("h-9 text-sm", replaceError && "border-destructive focus-visible:ring-destructive")} aria-invalid={!!replaceError} aria-describedby={replaceError ? "replace-error-message" : undefined} />
                            {replaceError && <p id="replace-error-message" className="text-xs text-destructive pt-1">{replaceError}</p>}
                            <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'fr-replace-input-wrapper'} />
                        </div>
                    )}

                    <div id="fr-match-case-wrapper" className="flex items-center space-x-2 pt-2 relative">
                        <Checkbox id="match-case" checked={matchCase} onCheckedChange={(checked) => setMatchCase(Boolean(checked))} />
                        <Label htmlFor="match-case" className="text-sm font-normal">Match case</Label>
                        <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'fr-match-case-wrapper'} />
                    </div>

                    <div className="border border-border p-4 rounded-md space-y-4 bg-background mt-2">
                        <div id="fr-match-in-wrapper" className="relative">
                            <Label className="text-xs font-medium text-muted-foreground">Match in:</Label>
                            <RadioGroup value={matchTo} onValueChange={(value) => setMatchTo(value as any)} className="mt-1 space-y-1">
                                {[{ value: "contains", label: "Any part of cell" }, { value: "entire_cell", label: "Entire cell" }, { value: "begins_with", label: "Beginning of cell" }, { value: "ends_with", label: "End of cell" }].map(o => (
                                    <div key={o.value} className="flex items-center space-x-2"><RadioGroupItem value={o.value} id={`matchTo-${o.value}`} /><Label htmlFor={`matchTo-${o.value}`} className="text-sm font-normal">{o.label}</Label></div>
                                ))}
                            </RadioGroup>
                            <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'fr-match-in-wrapper'} />
                        </div>
                        <Separator />
                        <div id="fr-direction-wrapper" className="relative">
                            <Label className="text-xs font-medium text-muted-foreground">Direction:</Label>
                            <RadioGroup value={direction} onValueChange={(value) => setDirection(value as any)} className="mt-1 space-y-1">
                                {[{ value: "down", label: "Down" }, { value: "up", label: "Up" }].map(d => (
                                    <div key={d.value} className="flex items-center space-x-2"><RadioGroupItem value={d.value} id={`direction-${d.value}`} /><Label htmlFor={`direction-${d.value}`} className="text-sm font-normal">{d.label}</Label></div>
                                ))}
                            </RadioGroup>
                            <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'fr-direction-wrapper'} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={startTour} className="rounded-full w-8 h-8"><HelpCircle size={18} /></Button></TooltipTrigger>
                        <TooltipContent><p>Start feature tour</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <div className="flex flex-wrap justify-end items-center gap-2">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    {activeTab === TabType.REPLACE && (
                        <div id="fr-replace-actions-wrapper" className="flex items-center gap-2 relative">
                            <Button variant="destructive" onClick={handleReplaceAll} disabled={!findText || !!findError}>Replace All</Button>
                            <Button variant="outline" onClick={handleReplace} disabled={!findText || !!findError}>Replace</Button>
                            <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'fr-replace-actions-wrapper'} />
                        </div>
                    )}
                    <div id="fr-navigation-wrapper" className="inline-flex rounded-md shadow-sm border border-input bg-background relative">
                        <Button size="icon" variant="ghost" onClick={handleFindPrevious} disabled={!findText || !!findError} className="rounded-r-none h-9 w-10 border-r bg-primary text-primary-foreground hover:bg-primary/90"><span className="sr-only">Find Previous</span><ChevronLeft className="w-5 h-5" /></Button>
                        <Button size="icon" variant="ghost" onClick={handleFindNext} disabled={!findText || !!findError} className="rounded-l-none h-9 w-10 bg-primary text-primary-foreground hover:bg-primary/90"><span className="sr-only">Find Next</span><ChevronRight className="w-5 h-5" /></Button>
                        <ActiveElementHighlight active={tourActive && tourSteps[currentStep]?.targetId === 'fr-navigation-wrapper'} />
                    </div>
                </div>
            </div>
        </>
    );
};

export const FindAndReplaceModal: React.FC<FindAndReplaceModalProps> = ({
    onClose,
    defaultTab = FindReplaceMode.FIND,
    initialTab,
    containerType = "dialog",
    ...props
}) => {
    const activeTab = initialTab || defaultTab;
    const contentProps = { defaultTab: activeTab, ...props };

    if (containerType === "sidebar") {
        return (
            <div className="flex flex-col h-full bg-background text-foreground">
                <FindAndReplaceContent onClose={onClose} {...contentProps} />
            </div>
        );
    }

    return (
        <Dialog open={props.isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="p-0 gap-0 flex flex-col max-w-md h-auto max-h-[calc(100vh-2rem)]">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center justify-between">
                        Find and Replace
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8">
                            <X className="h-4 w-4" /><span className="sr-only">Close</span>
                        </Button>
                    </DialogTitle>
                </DialogHeader>
                <FindAndReplaceContent onClose={onClose} {...contentProps} />
            </DialogContent>
        </Dialog>
    );
};

export const isFindReplaceModalType = (type: string): boolean => {
    return type === FindReplaceMode.FIND || type === FindReplaceMode.REPLACE;
};