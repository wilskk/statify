import { ModalType } from "@/types/modalTypes";

// Export menu component
export { default as DescriptiveMenu } from './DescriptiveMenu';

// Export direct components (lazyload handled in ModalRegistry)
export { default as Descriptives } from './Descriptive';
export { default as Explore } from './Explore';
export { default as Frequencies } from './Frequencies';
export { default as Crosstabs } from './Crosstabs';
export { default as Ratio } from './Ratio';
export { default as PPPlots } from './PPPlots';
export { default as QQPlots } from './QQPlots';

// Helper function to identify Descriptive modals
export const isDescriptiveModal = (type: ModalType): boolean => {
    return [
        ModalType.Descriptives,
        ModalType.Explore,
        ModalType.Frequencies,
        ModalType.Crosstabs,
        ModalType.Ratio,
        ModalType.PPPlots,
        ModalType.QQPlots
    ].includes(type);
}; 