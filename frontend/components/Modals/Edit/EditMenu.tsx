// components/Layout/Main/EditMenu.tsx
"use client";

import React from "react";
import {
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
} from "@/components/ui/menubar";
import { useActions } from "@/hooks/actions";
import { useModal } from "@/hooks/useModal";
import { ModalType } from "@/types/modalTypes";

const EditMenu: React.FC = () => {
    const { openModal } = useModal();
    const { handleAction } = useActions();

    return (
        <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
                {/* <MenubarItem onClick={() => handleAction({ actionType: "Undo" })}>
                    Undo
                </MenubarItem>
                <MenubarItem onClick={() => handleAction({ actionType: "Redo" })}>
                    Redo
                </MenubarItem>
                <MenubarSeparator /> */}
                <MenubarItem onClick={() => handleAction({ actionType: "Cut" })}>
                    Cut
                </MenubarItem>
                <MenubarItem onClick={() => handleAction({ actionType: "Copy" })}>
                    Copy
                </MenubarItem>
                <MenubarItem
                    onClick={() =>
                        handleAction({ actionType: "CopyWithVariableNames" })
                    }
                >
                    Copy with Variable Names
                </MenubarItem>
                <MenubarItem
                    onClick={() =>
                        handleAction({ actionType: "CopyWithVariableLabels" })
                    }
                >
                    Copy with Variable Labels
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem
                    onClick={() => handleAction({ actionType: "Paste" })}
                >
                    Paste
                </MenubarItem>
                <MenubarItem
                    onClick={() => handleAction({ actionType: "PasteVariables" })}
                >
                    Paste Variables...
                </MenubarItem>
                <MenubarItem
                    onClick={() =>
                        handleAction({ actionType: "PasteWithVariableNames" })
                    }
                >
                    Paste with Variable Names
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem
                    onClick={() => handleAction({ actionType: "Clear" })}
                >
                    Clear
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem
                    onClick={() => handleAction({ actionType: "InsertVariable" })}
                >
                    Insert Variable
                </MenubarItem>
                <MenubarItem
                    onClick={() => handleAction({ actionType: "InsertCases" })}
                >
                    Insert Cases
                </MenubarItem>
                <MenubarSeparator />
                {/*<MenubarItem>Search Data Files</MenubarItem>*/}
                <MenubarItem onClick={() => openModal(ModalType.Find)}>
                    Find...
                </MenubarItem>
                {/*<MenubarItem>Find Next</MenubarItem>*/}
                <MenubarItem onClick={() => openModal(ModalType.Replace)}>
                    Replace...
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.GoToCase)}>
                    Go to Case...
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.GoToVariable)}>
                    Go to Variable...
                </MenubarItem>
                {/*<MenubarItem>Go to Imputation...</MenubarItem>*/}
                {/*<MenubarSeparator />*/}
                {/*<MenubarItem>Options...</MenubarItem>*/}
            </MenubarContent>
        </MenubarMenu>
    );
};

export default EditMenu;