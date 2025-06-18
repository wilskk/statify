import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { TourStep as BaseTourStep, HorizontalPosition } from '@/types/tourTypes';
import { TabType } from '../types';

// Constants
const TABS = {
  VARIABLES: 'variables' as const,
  OPTIONS: 'options' as const,
  OUTPUT: 'output' as const,
  SAVE: 'save' as const,
  MISSING: 'missing' as const,
};

const TIMEOUT_DELAY = 200;

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

// Base tour step definitions
const baseTourSteps: TourStep[] = [
  // Variables Tab
  {
    title: "Analysis Variables",
    content: "Select the variables you want to evaluate for unusual cases. These should typically be scale variables.",
    targetId: "unusual-cases-analysis-variables",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'left',
    icon: "📊",
    requiredTab: TABS.VARIABLES
  },
  {
    title: "Case Identifier",
    content: "Select a variable that labels the cases (e.g., an ID or name). This helps in identifying the unusual cases in the output.",
    targetId: "unusual-cases-identifier-variable",
    defaultPosition: 'top',
    defaultHorizontalPosition: 'left',
    icon: "🆔",
    requiredTab: TABS.VARIABLES
  },
  {
    title: "Options Tab",
    content: "Click this tab to configure how unusual cases are identified.",
    targetId: "options-tab-trigger",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "⚙️",
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true
  },
  // Options Tab
  {
    title: "Identification Criteria",
    content: "Choose whether to identify a fixed number of unusual cases or a percentage of the total cases.",
    targetId: "unusual-cases-identification-criteria",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "🎯",
    requiredTab: TABS.OPTIONS
  },
  {
    title: "Output Tab",
    content: "Click this tab to control the contents of the output tables.",
    targetId: "output-tab-trigger",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📑",
    requiredTab: TABS.OPTIONS,
    forceChangeTab: true
  },
  // Output Tab
  {
    title: "Case Processing Summary",
    content: "Enable this to see a summary of how many cases were processed and included in the analysis.",
    targetId: "unusual-cases-case-summary",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📋",
    requiredTab: TABS.OUTPUT
  },
  {
    title: "Peer Group Table",
    content: "Displays a table that groups cases into 'peers' based on their similarity across the analysis variables.",
    targetId: "unusual-cases-peer-group-table",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "🧑‍🤝‍🧑",
    requiredTab: TABS.OUTPUT
  },
  {
    title: "Unusual Case List",
    content: "This is the main output, listing the cases identified as unusual based on your criteria.",
    targetId: "unusual-cases-unusual-list",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📝",
    requiredTab: TABS.OUTPUT
  },
  {
    title: "Save Tab",
    content: "Click here to save the anomaly index to your dataset.",
    targetId: "save-tab-trigger",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "💾",
    requiredTab: TABS.OUTPUT,
    forceChangeTab: true
  },
  // Save Tab
  {
    title: "Save Anomaly Index",
    content: "Creates a new variable containing an 'anomaly index' for each case, which measures how unusual it is.",
    targetId: "unusual-cases-save-anomaly-index",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📈",
    requiredTab: TABS.SAVE
  },
  {
    title: "Missing Values Tab",
    content: "Click this tab to define how to handle cases with missing data.",
    targetId: "missing-tab-trigger",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "❓",
    requiredTab: TABS.SAVE,
    forceChangeTab: true
  },
  // Missing Values Tab
  {
    title: "Missing Value Handling",
    content: "Choose to either exclude cases with missing values entirely or replace them with the variable's mean.",
    targetId: "unusual-cases-missing-values",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "🗑️",
    requiredTab: TABS.MISSING
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
  
  const tourSteps = useMemo(() => baseTourSteps.map(step => ({
    ...step,
    horizontalPosition: containerType === "sidebar" 
      ? "left" as HorizontalPosition 
      : step.defaultHorizontalPosition as HorizontalPosition | null,
    position: containerType === "sidebar" ? undefined : step.defaultPosition,
  })), [containerType]);

  const findTargetElement = useCallback((stepId: string): HTMLElement | null => {
    return document.getElementById(stepId);
  }, []);

  const clearTimeoutCallback = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const refreshTargetElements = useCallback(() => {
    if (!tourActive) return;
    const elements: Record<string, HTMLElement | null> = {};
    tourSteps.forEach(step => {
      elements[step.targetId] = findTargetElement(step.targetId);
    });
    setTargetElements(elements);
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
    clearTimeoutCallback();
    timeoutRef.current = window.setTimeout(refreshTargetElements, TIMEOUT_DELAY);
  }, [tabControl, refreshTargetElements, clearTimeoutCallback]);

  useEffect(() => {
    if (tourActive) {
      refreshTargetElements();
      const requiredTab = getRequiredTabForStep(currentStep);
      switchTabIfNeeded(requiredTab);
    }
  }, [currentStep, tourActive, getRequiredTabForStep, switchTabIfNeeded, refreshTargetElements]);

  const handleResize = useCallback(() => {
    if (tourActive) {
      refreshTargetElements();
    }
  }, [tourActive, refreshTargetElements]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeoutCallback();
    };
  }, [handleResize, clearTimeoutCallback]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setTourActive(true);
    const requiredTab = getRequiredTabForStep(0);
    if (tabControl && tabControl.currentActiveTab !== requiredTab) {
        switchTabIfNeeded(requiredTab);
    }
  }, [getRequiredTabForStep, tabControl, switchTabIfNeeded]);

  const endTour = useCallback(() => {
    setTourActive(false);
    setCurrentStep(0);
    clearTimeoutCallback();
  }, [clearTimeoutCallback]);

  const nextStep = useCallback(() => {
    const nextStepIndex = currentStep + 1;
    if (nextStepIndex < tourSteps.length) {
      const step = tourSteps[currentStep];
      if (step.forceChangeTab) {
        const nextStep = tourSteps[nextStepIndex];
        switchTabIfNeeded(nextStep.requiredTab);
      }
      setCurrentStep(nextStepIndex);
    } else {
      endTour();
    }
  }, [currentStep, tourSteps, switchTabIfNeeded, endTour]);

  const prevStep = useCallback(() => {
    const prevStepIndex = currentStep - 1;
    if (prevStepIndex >= 0) {
      const requiredTab = getRequiredTabForStep(prevStepIndex);
      switchTabIfNeeded(requiredTab);
      setCurrentStep(prevStepIndex);
    }
  }, [currentStep, getRequiredTabForStep, switchTabIfNeeded]);

  const currentTargetElement = useMemo(() => {
    if (!tourActive) return null;
    const currentStepData = tourSteps[currentStep];
    return targetElements[currentStepData.targetId] ?? null;
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