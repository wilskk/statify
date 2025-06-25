"use client";

import React, { FC, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, HelpCircle, X, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExportExcelProps } from "./types";
import { EXCEL_FORMATS, EXCEL_OPTIONS_CONFIG } from "./utils/constants";
import { useExportExcelLogic } from "./hooks/useExportExcelLogic";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

// Tipe data untuk tour
type PopupPosition = 'top' | 'bottom';
type HorizontalPosition = 'left' | 'right';

// Disesuaikan dengan struktur yang diperbarui
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

// Data langkah tour untuk ExportExcel
const baseTourSteps: TourStep[] = [
    {
        title: "Nama File",
        content: "Tentukan nama file untuk hasil ekspor Excel Anda di sini.",
        targetId: "excel-filename-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📝",
    },
    {
        title: "Format File",
        content: "Pilih format file Excel. XLSX adalah format modern, sedangkan XLS untuk kompatibilitas lama.",
        targetId: "excel-format-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📄",
    },
    {
        title: "Sertakan Header",
        content: "Aktifkan untuk menyertakan nama variabel sebagai baris header di sheet data.",
        targetId: "excel-includeHeaders-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "🏷️",
    },
    {
        title: "Sheet Properti Variabel",
        content: "Membuat sheet terpisah yang berisi detail properti untuk setiap variabel.",
        targetId: "excel-includeVariableProperties-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "🧩",
    },
    {
        title: "Sheet Metadata",
        content: "Menambahkan sheet terpisah yang berisi metadata file atau dataset jika tersedia.",
        targetId: "excel-includeMetadataSheet-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "ℹ️",
    },
    {
        title: "Gaya Header",
        content: "Terapkan styling dasar (seperti tebal) pada baris header untuk keterbacaan yang lebih baik.",
        targetId: "excel-applyHeaderStyling-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "🎨",
    },
    {
        title: "Tampilkan Data Hilang",
        content: "Ganti sel kosong dari data yang hilang dengan teks 'SYSMIS' untuk identifikasi.",
        targetId: "excel-includeDataLabels-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "🚫",
    }
];

// Portal wrapper untuk memastikan popup selalu berada di atas elemen lain
const TourPopupPortal: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    
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
    
    // Perhitungan posisi secara dinamis
    useEffect(() => {
        if (!targetElement) return;
        
        const updatePosition = () => {
            const rect = targetElement.getBoundingClientRect();
            const popupHeight = popupRef.current?.offsetHeight || 170;
            const popupWidth = 280;
            const popupBuffer = 20;
            let top: number, left: number;
            
            // Menentukan posisi berdasarkan mode (sidebar/panel vs dialog)
            if (horizontalPosition === 'left') {
                // Mode sidebar/panel: posisi di sebelah kiri
                left = Math.max(10, rect.left - 300);
                top = rect.top + (rect.height / 2) - 100;
            } else {
                // Mode dialog: posisi atas/bawah
                // Menentukan posisi vertikal
                if (position === 'top') {
                    top = rect.top - (popupHeight + popupBuffer);
                    // Jika tidak cukup ruang di atas, pindahkan ke bawah
                    if (top < 20) {
                        top = rect.bottom + popupBuffer;
                        step.position = 'bottom'; // Update untuk panah
                    }
                } else {
                    top = rect.bottom + popupBuffer;
                }
                
                // Menentukan posisi horizontal
                const elementWidth = rect.width;
                left = rect.left + (elementWidth / 2) - (popupWidth / 2);
                
                // Menyesuaikan posisi untuk elemen kecil
                if (elementWidth < 100) {
                    const rightSpace = window.innerWidth - rect.right;
                    const leftSpace = rect.left;
                    
                    // Pilih sisi dengan ruang yang lebih besar
                    if (rightSpace >= popupWidth + popupBuffer) {
                        left = rect.right + popupBuffer;
                    } else if (leftSpace >= popupWidth + popupBuffer) {
                        left = rect.left - (popupWidth + popupBuffer);
                    }
                }

                // Override untuk posisi horizontal kanan jika ditentukan
                if (horizontalPosition === 'right') {
                    left = rect.right - popupWidth;
                }
                
                // Mencegah popup keluar dari viewport
                if (left < 10) {
                    left = 10;
                }
                if (left + popupWidth > window.innerWidth - 10) {
                    left = window.innerWidth - (popupWidth + 10);
                }
            }
            
            setPopupPosition({ top, left });
        };
        
        // Update posisi
        updatePosition();
        const timer = setTimeout(updatePosition, 100);
        
        // Listener untuk scroll dan resize
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [targetElement, position, horizontalPosition, step]);

    // Styling untuk arrows/panah
    const getArrowStyles = () => {
        const arrowClasses = "w-3 h-3 bg-white dark:bg-gray-800";
        const borderClasses = "border-primary/10 dark:border-primary/20";
        
        // Arrow untuk mode dialog (atas/bawah)
        if (horizontalPosition !== 'left') {
            if (position === 'top') {
                return (
                    <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 ${arrowClasses} border-b border-r ${borderClasses}`} />
                );
            }
            if (position === 'bottom') {
                return (
                    <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 ${arrowClasses} border-t border-l ${borderClasses}`} />
                );
            }
        }
        // Arrow untuk mode sidebar (kiri)
        else if (horizontalPosition === 'left') {
            return (
                <div className={`absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 rotate-45 ${arrowClasses} border-t border-r ${borderClasses}`} />
            );
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
                style={{
                    position: 'fixed',
                    top: `${popupPosition.top}px`,
                    left: `${popupPosition.left}px`,
                    width: '280px',
                    zIndex: 99999,
                    pointerEvents: 'auto'
                }}
                className="popup-tour-fixed"
            >
                <Card 
                    ref={popupRef}
                    className={cn(
                    "shadow-lg border-primary/10 dark:border-primary/20 rounded-lg",
                    "relative backdrop-blur-sm bg-white/90 dark:bg-gray-800/90"
                )}>
                    {/* Panah dinamis sesuai posisi */}
                    {getArrowStyles()}
                    
                    <CardHeader className="p-3 pb-2 border-b border-primary/10 dark:border-primary/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {step.icon && <span className="text-lg">{step.icon}</span>}
                                <CardTitle className="text-base font-medium">{step.title}</CardTitle>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded-full hover:bg-primary/10">
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Langkah {currentStep + 1} dari {totalSteps}
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-3 text-sm">
                        <div className="flex space-x-2">
                            <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <p>{step.content}</p>
                        </div>
                    </CardContent>
                    
                    <CardFooter className="flex justify-between p-3 pt-2 border-t border-primary/10 dark:border-primary/20">
                        <div>
                            {currentStep !== 0 && (
                                <Button variant="outline" size="sm" onClick={onPrev} className="h-7 px-2 py-0">
                                    <ChevronLeft className="mr-1 h-3 w-3" />
                                    <span className="text-xs">Sebelumnya</span>
                                </Button>
                            )}
                        </div>
                        <div>
                            {currentStep + 1 !== totalSteps ? (
                                <Button size="sm" onClick={onNext} className="h-7 px-2 py-0">
                                    <span className="text-xs">Lanjut</span>
                                    <ChevronRight className="ml-1 h-3 w-3" />
                                </Button>
                            ) : (
                                <Button size="sm" onClick={onClose} className="h-7 px-2 py-0 bg-green-600 hover:bg-green-700">
                                    <span className="text-xs">Selesai</span>
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </TourPopupPortal>
    );
};

// Komponen highlight untuk elemen aktif
const ActiveElementHighlight: FC<{active: boolean}> = ({active}) => {
    if (!active) return null;
    
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-md ring-2 ring-primary ring-offset-2 pointer-events-none"
        />
    );
};

export const ExportExcel: FC<ExportExcelProps> = ({ 
    onClose,
    containerType
}) => {
    const {
        exportOptions,
        isExporting,
        handleChange,
        handleFilenameChange,
        handleExport,
    } = useExportExcelLogic({ onClose });
    
    // State untuk tour
    const [tourActive, setTourActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [tourSteps, setTourSteps] = useState<TourStep[]>([]);
    
    // Mendapatkan referensi DOM untuk elemen target
    const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});
    
    // Efisiensi dengan menggunakan callback untuk fungsi-fungsi tour
    const startTour = useCallback(() => {
        setCurrentStep(0);
        setTourActive(true);
    }, []);
    
    const nextStep = useCallback(() => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    }, [currentStep, tourSteps.length]);
    
    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);
    
    const endTour = useCallback(() => {
        setTourActive(false);
    }, []);
    
    // Menyesuaikan langkah-langkah tour berdasarkan tipe container
    useEffect(() => {
        const adjustedSteps = baseTourSteps.map(step => {
            if (containerType === "sidebar") {
                return { ...step, horizontalPosition: "left" as HorizontalPosition, position: undefined };
            } else {
                return { ...step, horizontalPosition: null, position: step.defaultPosition };
            }
        });
        setTourSteps(adjustedSteps);
    }, [containerType]);
    
    // Mendapatkan referensi elemen DOM saat tour aktif
    useEffect(() => {
        if (!tourActive) return;
        
        const elements: Record<string, HTMLElement | null> = {};
        baseTourSteps.forEach(step => {
            elements[step.targetId] = document.getElementById(step.targetId);
        });
        
        setTargetElements(elements);
    }, [tourActive]);
    
    // Referensi ke elemen target saat ini
    const currentTargetElement = useMemo(() => {
        if (!tourActive || !tourSteps.length || currentStep >= tourSteps.length) return null;
        return targetElements[tourSteps[currentStep].targetId] || null;
    }, [tourActive, tourSteps, currentStep, targetElements]);

    return (
        <div className="flex flex-col h-full">
            {/* Tour popup */}
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
                <div className="space-y-1.5 relative" id="excel-filename-wrapper">
                    <Label htmlFor="excel-filename" className={cn(tourActive && currentStep === 0 && "text-primary font-medium")}>File Name</Label>
                    <div className="relative">
                        <Input
                            id="excel-filename"
                            value={exportOptions.filename}
                            onChange={(e) => handleFilenameChange(e.target.value)}
                            placeholder="Enter file name (e.g., excel_export)"
                            disabled={isExporting}
                            className={cn(tourActive && currentStep === 0 && "focus:ring-primary")}
                        />
                        <ActiveElementHighlight active={tourActive && currentStep === 0} />
                    </div>
                </div>

                {/* Format */}
                <div className="space-y-1.5 relative" id="excel-format-wrapper">
                    <Label htmlFor="excel-format" className={cn(tourActive && currentStep === 1 && "text-primary font-medium")}>Format</Label>
                    <div className="relative">
                        <Select
                            value={exportOptions.format}
                            onValueChange={(value) => handleChange("format", value)}
                            disabled={isExporting}
                        >
                            <SelectTrigger id="excel-format">
                                <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                                {EXCEL_FORMATS.map((format) => (
                                    <SelectItem key={format.value} value={format.value}>
                                        {format.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <ActiveElementHighlight active={tourActive && currentStep === 1} />
                    </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Options</Label>
                    <div className="grid gap-3 pl-1">
                        {EXCEL_OPTIONS_CONFIG.map((option, index) => (
                            <div key={option.id} id={`excel-${option.name}-wrapper`} className="flex items-start space-x-2 relative">
                                <div className="relative mt-0.5">
                                    <Checkbox
                                        id={option.id}
                                        checked={exportOptions[option.name as keyof typeof exportOptions] as boolean}
                                        onCheckedChange={(checked) => 
                                            handleChange(option.name as keyof typeof exportOptions, Boolean(checked))
                                        }
                                        disabled={isExporting}
                                    />
                                    <ActiveElementHighlight active={tourActive && currentStep === (2 + index)} />
                                </div>
                                <div className="flex items-center">
                                    <Label 
                                        htmlFor={option.id} 
                                        className={cn("font-normal cursor-pointer", tourActive && currentStep === (2 + index) && "text-primary font-medium")}
                                    >
                                        {option.label}
                                    </Label>
                                    {option.tooltip && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button className="ml-1.5 text-muted-foreground hover:text-foreground">
                                                        <HelpCircle size={14} />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="right" className="max-w-[280px] text-xs">
                                                    {option.tooltip}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Kiri: Tour button (icon only) */}
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
                                <p className="text-xs">Mulai tour fitur</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                {/* Kanan: tombol Cancel/Export */}
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
                        onClick={handleExport}
                        disabled={isExporting || !exportOptions.filename.trim()}
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            "Export"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ExportExcel; 