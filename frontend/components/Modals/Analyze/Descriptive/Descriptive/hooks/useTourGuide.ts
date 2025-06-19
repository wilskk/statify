import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { TourStep as BaseTourStep, HorizontalPosition } from '@/types/tourTypes';

// Constants
const TABS = {
  VARIABLES: 'variables' as const,
  STATISTICS: 'statistics' as const,
};

const TIMEOUT_DELAY = 200;

export type TabType = typeof TABS.VARIABLES | typeof TABS.STATISTICS;

// Extended TourStep with required tab property
export type TourStep = BaseTourStep & {
  requiredTab?: TabType;
  forceChangeTab?: boolean;
};

// Tab control interface
export interface TabControlProps {
  setActiveTab: (tab: TabType) => void;
  currentActiveTab: TabType;
}

// Define tour steps for Descriptive component
const baseTourSteps: TourStep[] = [
  {
    title: "Variables Selection",
    content: "Drag variables from the available list to analyze descriptive statistics. Only numeric and date variables are shown.",
    targetId: "descriptive-available-variables",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📊",
    requiredTab: TABS.VARIABLES
  },
  {
    title: "Selected Variables",
    content: "Variables in this list will be analyzed. You can reorder them by dragging.",
    targetId: "descriptive-selected-variables",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'left',
    icon: "📋",
    requiredTab: TABS.VARIABLES
  },
  {
    title: "Save Standardized Values",
    content: "Enable this option to create new variables containing standardized values (Z-scores).",
    targetId: "save-standardized-section",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "💾",
    requiredTab: TABS.VARIABLES
  },
  {
    title: "Statistics Tab",
    content: "Click on this tab to configure which statistics to display and their order.",
    targetId: "descriptive-statistics-tab-trigger",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📈",
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true
  },
  {
    title: "Central Tendency",
    content: "Calculate measures like mean, median, and sum to understand the central values of your data.",
    targetId: "descriptive-central-tendency",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "🎯",
    requiredTab: TABS.STATISTICS
  },
  {
    title: "Dispersion",
    content: "Analyze data spread with standard deviation, variance, range, minimum and maximum values.",
    targetId: "descriptive-dispersion",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📊",
    requiredTab: TABS.STATISTICS
  },
  {
    title: "Distribution",
    content: "Examine distribution characteristics with skewness and kurtosis measures.",
    targetId: "descriptive-distribution",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📉",
    requiredTab: TABS.STATISTICS
  },
  {
    title: "Display Order",
    content: "Choose how to order variables in the results table - by variable list, alphabetically, or by mean values.",
    targetId: "display-order-section",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "🔢",
    requiredTab: TABS.STATISTICS
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

export const useTourGuide = (
  containerType: "dialog" | "sidebar" = "dialog",
  tabControl?: TabControlProps
): UseTourGuideResult => {
  const [tourActive, setTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});

  const lastTabRef = useRef<TabType | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);

  // Adjust tour steps based on container type
  const tourSteps = useMemo(() => baseTourSteps.map(step => ({
    ...step,
    horizontalPosition: containerType === "sidebar"
      ? "left" as HorizontalPosition
      : step.defaultHorizontalPosition as HorizontalPosition | null,
    position: containerType === "sidebar" ? undefined : step.defaultPosition,
  })), [containerType]);


  const findTargetElement = useCallback((stepId: string): HTMLElement | null => {
    try {
      return document.getElementById(stepId);
    } catch (error) {
      console.error(`Error finding element with ID ${stepId}:`, error);
      return null;
    }
  }, []);

  const clearTimeout = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);
  
  const refreshTargetElements = useCallback(() => {
    if (!tourActive) return;
    try {
      const elements: Record<string, HTMLElement | null> = {};
      tourSteps.forEach(step => {
        elements[step.targetId] = findTargetElement(step.targetId);
      });
      setTargetElements(elements);
    } catch (error) {
      console.error("Error refreshing target elements:", error);
    }
  }, [tourActive, tourSteps, findTargetElement]);

  const getRequiredTabForStep = useCallback((stepIndex: number): TabType | undefined => {
    const step = tourSteps[stepIndex];
    return step?.requiredTab;
  }, [tourSteps]);

  const switchTabIfNeeded = useCallback((requiredTab?: TabType) => {
    if (!tabControl || !requiredTab || tabControl.currentActiveTab === requiredTab) {
      return;
    }
    tabControl.setActiveTab(requiredTab);
    lastTabRef.current = requiredTab;
    clearTimeout();
    timeoutRef.current = window.setTimeout(refreshTargetElements, TIMEOUT_DELAY);
  }, [tabControl, refreshTargetElements, clearTimeout]);

  useEffect(() => {
    return () => {
        clearTimeout();
    }
  }, [clearTimeout]);

  useEffect(() => {
    if (tourActive) {
      clearTimeout();
      timeoutRef.current = window.setTimeout(refreshTargetElements, TIMEOUT_DELAY);
    }
  }, [tourActive, refreshTargetElements, clearTimeout]);

  useEffect(() => {
    if (!tourActive || !tabControl) return;

    const step = tourSteps[currentStep];
    const requiredTab = getRequiredTabForStep(currentStep);

    if (requiredTab && step?.forceChangeTab) {
        const nextStepIndex = currentStep + 1;
        if (nextStepIndex < tourSteps.length) {
            const nextStepRequiredTab = getRequiredTabForStep(nextStepIndex);
            if (nextStepRequiredTab && nextStepRequiredTab !== requiredTab) {
                switchTabIfNeeded(nextStepRequiredTab);
            }
        }
    } else if (requiredTab) {
        switchTabIfNeeded(requiredTab);
    }
  }, [currentStep, tourActive, tabControl, tourSteps, getRequiredTabForStep, switchTabIfNeeded]);


  const startTour = useCallback(() => {
    setCurrentStep(0);
    setTourActive(true);
    if (tabControl) {
      const firstStepTab = getRequiredTabForStep(0);
      if (firstStepTab) {
        tabControl.setActiveTab(firstStepTab);
        lastTabRef.current = firstStepTab;
      }
    }
  }, [tabControl, getRequiredTabForStep]);

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

  const currentTargetElement = useMemo(() => {
    if (!tourActive || tourSteps.length === 0 || currentStep >= tourSteps.length) {
      return null;
    }
    const currentStepData = tourSteps[currentStep];
    return currentStepData ? targetElements[currentStepData.targetId] || null : null;
  }, [tourActive, tourSteps, currentStep, targetElements]);


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