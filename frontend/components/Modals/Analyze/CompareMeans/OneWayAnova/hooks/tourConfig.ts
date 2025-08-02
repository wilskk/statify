import { TABS, TourStep } from "../types";

export const baseTourSteps: TourStep[] = [
    {
        title: "Variable Selection",
        content:
            "Select variables from the available list to analyze with Independent Samples T-Test. Only numeric variables are shown.",
        targetId: "one-way-anova-available-variables",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "📊",
        requiredTab: TABS.VARIABLES,
    },
    {
        title: "Test Variables",
        content:
            "Variables in this list will be analyzed. You can reorder them by dragging.",
        targetId: "one-way-anova-test-variables",
        defaultPosition: "bottom",
        defaultHorizontalPosition: "left",
        icon: "📋",
        requiredTab: TABS.VARIABLES,
    },
    {
        title: "Factor Variable",
        content:
            "Select a variable that defines the groups to compare. You can define how the groups are formed by clicking 'Define Groups...'",
        targetId: "factor-variable-section",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "🔢",
        requiredTab: TABS.VARIABLES,
    },
    {
        title: "Effect Size",
        content:
            "Check this option to include effect size estimates in the results.",
        targetId: "estimate-effect-size",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "📏",
        requiredTab: TABS.VARIABLES,
    },
    {
        title: "Run Analysis",
        content:
            "Click OK to run the analysis with your selected variables and settings.",
        targetId: "one-way-anova-ok-button",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "▶️",
        requiredTab: TABS.VARIABLES,
    },
];
