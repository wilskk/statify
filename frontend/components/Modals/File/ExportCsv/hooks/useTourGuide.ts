import { useState, useCallback, useEffect } from 'react';
import { TourStep, HorizontalPosition } from '@/types/tourTypes';

// Define tour steps for ExportCsv component
const baseTourSteps: TourStep[] = [
  {
    title: "File Name",
    content: "Enter a name for your CSV file here. The .csv extension will be added automatically.",
    targetId: "export-csv-filename",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📝",
  },
  {
    title: "Delimiter",
    content: "Select the character that will separate values in your CSV file.",
    targetId: "export-csv-delimiter",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📊",
  },
  {
    title: "Include Headers",
    content: "Check this option to include variable names as the first row in your CSV file.",
    targetId: "export-csv-includeHeaders",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "🏷️",
  },
  {
    title: "Variable Properties",
    content: "Check this option to include variable properties like type and measure level in your CSV file.",
    targetId: "export-csv-includeVarProps",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "ℹ️",
  },
  {
    title: "Quote Strings",
    content: "Check this option to enclose text values in quotes in your CSV file.",
    targetId: "export-csv-quoteStrings",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "🔤",
  },
  {
    title: "Export",
    content: "Click this button to generate and download your CSV file with the selected options.",
    targetId: "export-csv-button",
    defaultPosition: 'top',
    defaultHorizontalPosition: null,
    icon: "💾",
  },
];

export interface UseTourGuideResult {
  tourActive: boolean;
  currentStep: number;
  tourSteps: TourStep[];
  currentTargetElement: HTMLElement | null;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
}

export const useTourGuide = (containerType: "dialog" | "sidebar" | "panel" = "dialog"): UseTourGuideResult => {
  const [tourActive, setTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourSteps, setTourSteps] = useState<TourStep[]>([]);
  const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});

  // Adjust tour steps based on container type
  useEffect(() => {
    const adjustedSteps = baseTourSteps.map(step => {
      if (containerType === "sidebar" || containerType === "panel") {
        return {
          ...step,
          horizontalPosition: "left" as HorizontalPosition,
          position: undefined,
        };
      } else {
        return {
          ...step,
          horizontalPosition: null,
          position: step.defaultPosition,
        };
      }
    });
    setTourSteps(adjustedSteps);
  }, [containerType]);

  // Get references to DOM elements when tour activates
  useEffect(() => {
    if (!tourActive) return;
    
    const elements: Record<string, HTMLElement | null> = {};
    tourSteps.forEach(step => {
      elements[step.targetId] = document.getElementById(step.targetId);
    });
    
    setTargetElements(elements);
  }, [tourActive, tourSteps]);

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

  const currentTargetElement = tourActive && tourSteps.length > 0 && currentStep < tourSteps.length
    ? targetElements[tourSteps[currentStep].targetId] || null
    : null;

  return {
    tourActive,
    currentStep,
    tourSteps,
    currentTargetElement,
    startTour,
    nextStep,
    prevStep,
    endTour
  };
}; 