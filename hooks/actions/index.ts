// hooks/actions/index.ts
import { useEditActions, EditActionType } from './editActions';
import { useFileActions, FileActionType } from './fileActions';

// Combine all action types
export type ActionType =
    | EditActionType
    | FileActionType;

// Interface for the action payload
export interface ActionPayload {
    actionType: ActionType;
}

// Main actions hook that combines all action handlers
export const useActions = () => {
    const { handleAction: handleEditAction } = useEditActions();
    const { handleAction: handleFileAction } = useFileActions();

    // Combined action handler that routes to the appropriate specific handler
    const handleAction = ({ actionType }: ActionPayload) => {
        // File actions
        if (actionType === "Save" ||
            actionType === "New"  ||
            actionType === "Exit"
        ) {
            return handleFileAction({ actionType: actionType as FileActionType });
        }

        // Edit actions - all the actions that don't use modals
        if (actionType === "Undo" ||
            actionType === "Redo" ||
            actionType === "Cut" ||
            actionType === "Copy" ||
            actionType === "CopyWithVariableNames" ||
            actionType === "CopyWithVariableLabels" ||
            actionType === "Paste" ||
            actionType === "PasteVariables" ||
            actionType === "PasteWithVariableNames" ||
            actionType === "Clear" ||
            actionType === "InsertVariable" ||
            actionType === "InsertCases"
        ) {
            return handleEditAction({ actionType: actionType as EditActionType });
        }

        console.warn("Unhandled action type:", actionType);
    };

    return { handleAction };
};

// Re-export individual action hooks for direct use if needed
export { useEditActions, useFileActions };
export type { EditActionType, FileActionType };