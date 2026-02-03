<<<<<<< HEAD
import { TABS, TourStep } from '../types';
=======
import type { TourStep } from '../types';
import { TABS } from '../types';
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

export const baseTourSteps: TourStep[] = [
    {
        title: "Variable Selection",
        content: "Select variables from the available list to analyze with Two Related Samples Test. Only numeric variables are shown.",
        targetId: "two-related-samples-available-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "📊",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Test Variables",
        content: "Variables in this list will be analyzed. You can reorder them by dragging.",
        targetId: "two-related-samples-test-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📋",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Run Analysis",
        content: "Click OK to run the analysis with your selected variables and settings.",
        targetId: "two-related-samples-ok-button",
        defaultPosition: 'top',
        defaultHorizontalPosition: null,
        icon: "▶️",
        requiredTab: TABS.VARIABLES
    }
];
