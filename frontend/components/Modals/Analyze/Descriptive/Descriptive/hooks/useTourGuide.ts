import { useState, useCallback, useEffect } from 'react';
import { TourStep, HorizontalPosition } from '@/types/tourTypes';

// Define tour steps for Descriptive component
const baseTourSteps: TourStep[] = [
  {
    title: "Variables Selection",
    content: "Drag variables from the available list to analyze descriptive statistics. Only numeric and date variables are shown.",
    targetId: "descriptive-available-variables",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📊",
  },
  {
    title: "Selected Variables",
    content: "Variables in this list will be analyzed. You can reorder them by dragging.",
    targetId: "descriptive-selected-variables",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📋",
  },
  {
    title: "Save Standardized Values",
    content: "Enable this option to create new variables containing standardized values (Z-scores).",
    targetId: "saveStandardized",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "💾",
  },
  {
    title: "Statistics Options",
    content: "Switch to this tab to configure which statistics to display and their order.",
    targetId: "statistics-tab-trigger",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📈",
  },
  {
    title: "Display Order",
    content: "Choose how to order variables in the results table - by variable list, alphabetically, or by mean values.",
    targetId: "display-order-section",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "🔢",
  },
  {
    title: "Run Analysis",
    content: "Click OK to run the descriptive statistics analysis with your selected settings.",
    targetId: "descriptive-ok-button",
    defaultPosition: 'top',
    defaultHorizontalPosition: null,
    icon: "✅",
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

export const useTourGuide = (containerType: "dialog" | "sidebar" = "dialog"): UseTourGuideResult => {
  const [tourActive, setTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourSteps, setTourSteps] = useState<TourStep[]>([]);
  const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});

  // Adjust tour steps based on container type
  useEffect(() => {
    const adjustedSteps = baseTourSteps.map(step => {
      if (containerType === "sidebar") {
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