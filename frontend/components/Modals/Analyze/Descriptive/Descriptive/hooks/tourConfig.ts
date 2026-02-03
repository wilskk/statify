<<<<<<< HEAD
import { TourStep as BaseTourStep } from '@/types/tourTypes';
=======
import type { TourStep as BaseTourStep } from '@/types/tourTypes';
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

// Constants
export const TABS = {
  VARIABLES: 'variables' as const,
  STATISTICS: 'statistics' as const,
};

export type TabType = typeof TABS.VARIABLES | typeof TABS.STATISTICS;

// Extended TourStep with required tab property
export type TourStep = BaseTourStep & {
  requiredTab?: TabType;
  forceChangeTab?: boolean;
};

// Define tour steps for Descriptive component
export const baseTourSteps: TourStep[] = [
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