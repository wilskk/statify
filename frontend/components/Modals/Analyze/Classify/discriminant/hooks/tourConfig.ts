import type { TourStep } from "@/types/tourTypes";

export const dialogTourSteps: TourStep[] = [
    {
        title: "Grouping Variable",
        content: "Select a grouping variable that defines the groups for discriminant analysis.",
        targetId: "discriminant-grouping-variable",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "📊",
    },
    {
        title: "Independent Variables",
        content: "Select one or more independent (discriminating) variables.",
        targetId: "discriminant-independent-variables",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "📋",
    },
    {
        title: "Selection Variable",
        content: "Optionally select a variable to filter cases for the analysis.",
        targetId: "discriminant-selection-variable",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "🔍",
    },
    {
        title: "Method",
        content: "Choose Enter Independents Together or Use Stepwise Method.",
        targetId: "discriminant-method-group",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "⚙️",
    },
    {
        title: "Run Analysis",
        content: "Click OK to run the discriminant analysis with your selected variables and settings.",
        targetId: "discriminant-ok-button",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "▶️",
    },
];