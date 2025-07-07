import { TourStep as BaseTourStep } from '@/types/tourTypes';
import { TabType } from './types';

// Extended TourStep with required tab property
export type TourStep = BaseTourStep & {
  requiredTab?: TabType;
  forceChangeTab?: boolean;
};

// Constants
export const TABS = {
  VARIABLES: 'variables' as const,
  OPTIONS: 'options' as const,
  OUTPUT: 'output' as const,
  SAVE: 'save' as const,
  MISSING: 'missing' as const,
};

// Base tour step definitions
export const baseTourSteps: TourStep[] = [
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