import { useState, useCallback, useEffect } from 'react';
import { TourStep, HorizontalPosition } from '@/types/tourTypes';

// Define tour steps for Frequencies component
const baseTourSteps: TourStep[] = [
  {
    title: "Variables Selection",
    content: "Drag variables from the available list to analyze their frequencies, or use the arrow button to move them.",
    targetId: "available-variables-wrapper",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📊",
  },
  {
    title: "Selected Variables",
    content: "Variables in this list will be analyzed. You can reorder them by dragging.",
    targetId: "selected-variables-wrapper",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📋",
  },
  {
    title: "Frequency Tables",
    content: "Enable this option to display frequency tables in the output.",
    targetId: "display-frequency-tables",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📑",
  },
  {
    title: "Statistics Options",
    content: "Switch to this tab to configure descriptive statistics for your analysis.",
    targetId: "statistics-tab-trigger",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📈",
  },
  {
    title: "Run Analysis",
    content: "Click OK to run the frequency analysis with your selected settings.",
    targetId: "frequencies-ok-button",
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