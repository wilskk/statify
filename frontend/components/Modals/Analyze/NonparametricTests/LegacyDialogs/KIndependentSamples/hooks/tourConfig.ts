<<<<<<< HEAD
import { TABS, TourStep } from '../types';
=======
import type { TourStep } from '../types';
import { TABS } from '../types';
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

export const baseTourSteps: TourStep[] = [
    {
        title: "Variable Selection",
        content: "Select variables from the available list to analyze with K Independent Samples Test. Only numeric variables are shown.",
        targetId: "k-independent-samples-available-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "📊",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Test Variables",
        content: "Variables in this list will be analyzed. You can reorder them by dragging.",
        targetId: "k-independent-samples-test-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📋",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Grouping Variable",
        content: "Select a variable that defines the groups to compare. You can define how the groups are formed by clicking 'Define Groups...'",
        targetId: "grouping-variable-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "🔢",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Define Range",
        content: "Click here to define how the groups are formed based on the grouping variable.",
        targetId: "define-range-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "⚙️",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Run Analysis",
        content: "Click OK to run the analysis with your selected variables and settings.",
        targetId: "k-independent-samples-ok-button",
        defaultPosition: 'top',
        defaultHorizontalPosition: null,
        icon: "▶️",
        requiredTab: TABS.VARIABLES
    }
];
