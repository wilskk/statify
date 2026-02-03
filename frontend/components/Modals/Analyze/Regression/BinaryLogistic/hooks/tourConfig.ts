import type { TourStep as BaseTourStep } from '@/types/tourTypes';

// Tabs constants
export const TABS = {
  VARIABLES: 'variables' as const,
  CATEGORICAL: 'categorical' as const,
  SAVE: 'save' as const,
  OPTIONS: 'options' as const,
  ASSUMPTION: 'assumption' as const,
};

export type TabType = 
  | typeof TABS.VARIABLES 
  | typeof TABS.CATEGORICAL 
  | typeof TABS.SAVE 
  | typeof TABS.OPTIONS 
  | typeof TABS.ASSUMPTION;

export type TourStep = BaseTourStep & {
  requiredTab?: TabType;
  forceChangeTab?: boolean;
};

export const baseTourSteps: TourStep[] = [
  {
    title: 'Variables Tab',
    content: 'Select dependent variable (binary outcome), covariates (predictors), and regression method.',
    targetId: 'binary-logistic-variables-tab-trigger',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '📊',
    requiredTab: TABS.VARIABLES,
  },
  {
    title: 'Categorical Tab',
    content: 'Define categorical covariates, contrast method, and reference category.',
    targetId: 'binary-logistic-categorical-tab-trigger',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '🏷️',
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true,
  },
  {
    title: 'Save Tab',
    content: 'Choose predicted values, residuals, and influence statistics to save.',
    targetId: 'binary-logistic-save-tab-trigger',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '💾',
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true,
  },
  {
    title: 'Options Tab',
    content: 'Configure display options, confidence intervals, stepwise criteria, and cutoff.',
    targetId: 'binary-logistic-options-tab-trigger',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '⚙️',
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true,
  },
  {
    title: 'Assumption Tab',
    content: 'Run multicollinearity (VIF) and Box-Tidwell linearity tests.',
    targetId: 'binary-logistic-assumption-tab-trigger',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '✅',
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true,
  },
];
