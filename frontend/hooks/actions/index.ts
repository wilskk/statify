import { useEditActions, EditActionType } from './editActions';
import { useFileActions, FileActionType } from './fileActions';

export type ActionType =
    | EditActionType
    | FileActionType;

export interface ActionPayload {
    actionType: ActionType;
}

export const useActions = () => {
    const { handleAction: handleEditAction } = useEditActions();
    const { handleAction: handleFileAction } = useFileActions();

    const handleAction = ({ actionType }: ActionPayload) => {
        if (actionType === "Save" ||
            actionType === "New"  ||
            actionType === "Exit"
        ) {
            return handleFileAction({ actionType: actionType as FileActionType });
        }

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
            return handleEditAction(actionType as EditActionType);
        }

        console.warn("Unhandled action type:", actionType);
    };

    return { handleAction };
};

export { useEditActions, useFileActions };
export type { EditActionType, FileActionType };