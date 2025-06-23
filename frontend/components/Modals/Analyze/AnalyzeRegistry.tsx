import { ModalType, BaseModalProps } from "@/types/modalTypes";

// Import from Descriptive registry via index.ts
import {
    DESCRIPTIVE_MODAL_COMPONENTS,
    DESCRIPTIVE_MODAL_CONTAINER_PREFERENCES,
    getDescriptiveModalComponent,
} from "./Descriptive";
import {
    CLASSIFY_MODAL_COMPONENTS,
    CLASSIFY_MODAL_CONTAINER_PREFERENCES,
} from "./Classify";
import {
    DIMENSION_REDUCTION_MODAL_COMPONENTS,
    DIMENSION_REDUCTION_MODAL_CONTAINER_PREFERENCES,
} from "./dimension-reduction";
import {
    GENERAL_LINEAR_MODEL_MODAL_COMPONENTS,
    GENERAL_LINEAR_MODEL_MODAL_CONTAINER_PREFERENCES,
} from "./general-linear-model";

/**
 * ANALYZE_MODAL_COMPONENTS - Central registry for all Analyze modals
 *
 * This will gradually be expanded to include other analyze categories beyond Descriptive
 */
export const ANALYZE_MODAL_COMPONENTS: Record<
    string,
    React.ComponentType<BaseModalProps>
> = {
    // Descriptive modals
    ...DESCRIPTIVE_MODAL_COMPONENTS,
    ...CLASSIFY_MODAL_COMPONENTS,
    ...DIMENSION_REDUCTION_MODAL_COMPONENTS,
    ...GENERAL_LINEAR_MODEL_MODAL_COMPONENTS,

    // Future categories will be added here
    // ...COMPARE_MEANS_MODAL_COMPONENTS,
    // ...NONPARAMETRIC_MODAL_COMPONENTS,
    // etc.
};

/**
 * getAnalyzeModalComponent - Get an analyze modal component by type
 *
 * @param type - The type of modal to retrieve
 * @returns The React component for the specified modal type, or null if not found
 */
export function getAnalyzeModalComponent(
    type: ModalType
): React.ComponentType<BaseModalProps> | null {
    const Component = ANALYZE_MODAL_COMPONENTS[type];

    if (!Component) {
        console.warn(`No analyze modal component registered for type: ${type}`);
        return null;
    }

    return Component;
}

/**
 * ANALYZE_MODAL_CONTAINER_PREFERENCES - Container preferences for analyze modals
 *
 * Combines preferences from all analyze sub-categories
 */
export const ANALYZE_MODAL_CONTAINER_PREFERENCES: Partial<
    Record<ModalType, "dialog" | "sidebar">
> = {
    // Descriptive modals
    ...DESCRIPTIVE_MODAL_CONTAINER_PREFERENCES,
    ...CLASSIFY_MODAL_CONTAINER_PREFERENCES,
    ...DIMENSION_REDUCTION_MODAL_CONTAINER_PREFERENCES,
    ...GENERAL_LINEAR_MODEL_MODAL_CONTAINER_PREFERENCES,

    // Future categories will be added here
};

/**
 * isAnalyzeModal - Check if a modal type belongs to the Analyze category
 *
 * @param type - The modal type to check
 * @returns Whether the modal is an Analyze modal
 */
export const isAnalyzeModal = (type: ModalType): boolean => {
    return type in ANALYZE_MODAL_COMPONENTS;
};
