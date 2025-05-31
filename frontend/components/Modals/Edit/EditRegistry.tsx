import React from 'react';
import { ModalType, BaseModalProps } from '@/types/modalTypes';

// Import edit modal components
import { FindAndReplaceModal, FindReplaceMode } from './FindReplace/FindReplace';
import GoToModal, { GoToMode } from './GoTo/GoTo';

/**
 * EDIT_MODAL_COMPONENTS - Registry for edit modal components
 * 
 * Maps each edit-related ModalType to its corresponding React component
 */
export const EDIT_MODAL_COMPONENTS: Record<string, React.ComponentType<BaseModalProps>> = {
  [ModalType.Find]: ((props: BaseModalProps) => {
    const FindComp = () => <FindAndReplaceModal {...props} mode={FindReplaceMode.FIND} />;
    FindComp.displayName = 'FindModal';
    return <FindComp />;
  }) as React.ComponentType<BaseModalProps>,
  
  [ModalType.Replace]: ((props: BaseModalProps) => {
    const ReplaceComp = () => <FindAndReplaceModal {...props} mode={FindReplaceMode.REPLACE} />;
    ReplaceComp.displayName = 'ReplaceModal';
    return <ReplaceComp />;
  }) as React.ComponentType<BaseModalProps>,
  
  [ModalType.GoToCase]: ((props: BaseModalProps) => {
    const GoToCaseComp = () => <GoToModal {...props} mode={GoToMode.CASE} />;
    GoToCaseComp.displayName = 'GoToCaseModal';
    return <GoToCaseComp />;
  }) as React.ComponentType<BaseModalProps>,
  
  [ModalType.GoToVariable]: ((props: BaseModalProps) => {
    const GoToVarComp = () => <GoToModal {...props} mode={GoToMode.VARIABLE} />;
    GoToVarComp.displayName = 'GoToVariableModal';
    return <GoToVarComp />;
  }) as React.ComponentType<BaseModalProps>
};

/**
 * getEditModalComponent - Get an edit modal component by type
 * 
 * @param type - The type of modal to retrieve
 * @returns The React component for the specified modal type, or null if not found
 */
export function getEditModalComponent(type: ModalType): React.ComponentType<BaseModalProps> | null {
  const Component = EDIT_MODAL_COMPONENTS[type];
  
  if (!Component) {
    console.warn(`No edit modal component registered for type: ${type}`);
    return null;
  }
  
  return Component;
}

/**
 * EDIT_MODAL_CONTAINER_PREFERENCES - Container preferences for edit modals
 * 
 * Some modals work better in specific container types based on their complexity
 * and screen space requirements.
 */
export const EDIT_MODAL_CONTAINER_PREFERENCES: Partial<Record<ModalType, "dialog" | "sidebar">> = {
  [ModalType.Find]: "sidebar",
  [ModalType.Replace]: "sidebar",
  [ModalType.GoToCase]: "sidebar",
  [ModalType.GoToVariable]: "sidebar",
};

/**
 * Helper function to check if a modal is an edit modal
 */
export const isEditModal = (type: ModalType): boolean => {
  return [
    ModalType.Find,
    ModalType.Replace,
    ModalType.GoToCase,
    ModalType.GoToVariable
  ].includes(type);
}; 