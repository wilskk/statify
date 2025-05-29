// components/Modals/Edit/index.ts
import { ModalType } from "@/hooks/useModal";

// Export menu component
export { default as EditMenu } from './EditMenu';

// Export FindReplace components and types
export { FindAndReplaceModal, FindReplaceMode } from './FindReplace/FindReplace';
export { isFindReplaceModalType } from './FindReplace/FindReplace';

// Export GoTo components and types
export { default as GoToModal, GoToMode } from './GoTo/GoTo';

// Helper function to identify Edit modals
export const isEditModal = (type: ModalType): boolean => {
    return [
        ModalType.Find,
        ModalType.Replace,
        ModalType.GoToCase,
        ModalType.GoToVariable
    ].includes(type);
};
